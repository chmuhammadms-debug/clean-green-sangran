import { useEffect, useMemo, useState } from "react";
import {
  BLOOD_GROUPS,
  fetchPublicBloodDonors,
  fetchPublicBloodSummary,
  markBloodRequestDonated,
  printBloodDonorSlip,
  registerBloodRequest,
  registerPublicBloodDonor,
  selectDonorForBloodRequest,
} from "./bloodBankService";
import "./BloodBank.css";

const DONOR_STORAGE_KEY = "cgs_registered_blood_donor";
const emptyDonorForm = { fullName: "", phone: "", address: "", bloodGroup: "A+" };
const emptyPatientForm = {
  patientName: "",
  attendantName: "",
  phone: "",
  hospitalAddress: "",
  bloodGroup: "A+",
  units: "1",
  neededOn: new Date().toISOString().slice(0, 10),
  notes: "",
};

function readStoredDonor() {
  try { return JSON.parse(window.localStorage.getItem(DONOR_STORAGE_KEY) || "null"); }
  catch { return null; }
}

function normaliseDonorSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/positive|پازیٹو|پوزیٹو|مثبت/g, "+")
    .replace(/negative|نیگیٹو|منفی/g, "-")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

function normalisePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function DonorCards({ donors, ur, emptyText, onSelect, selectedDonorId, donated }) {
  if (!donors.length) return <div className="blood-empty">{emptyText}</div>;
  return <div className="blood-public-grid">
    {donors.map((donor) => <article className="blood-public-card" key={donor.id}>
      <b className="blood-public-card__group">{donor.blood_group}</b>
      <div><h3>{donor.full_name}</h3><p>{donor.address}</p></div>
      <div className="blood-public-card__actions">
        <a href={`tel:${String(donor.phone || "").replace(/[^+\d]/g, "")}`}>{ur ? "کال کریں" : "Call"} · {donor.phone}</a>
        {onSelect && <button className={selectedDonorId === donor.id ? "selected" : ""} disabled={donated} type="button" onClick={() => onSelect(donor)}>{selectedDonorId === donor.id ? (donated ? (ur ? "خون دے دیا" : "Blood donated") : (ur ? "منتخب ہوگیا" : "Selected")) : (ur ? "اس ڈونر کو منتخب کریں" : "Select donor")}</button>}
      </div>
    </article>)}
  </div>;
}

export default function BloodBankPublic({ language = "en" }) {
  const ur = language === "ur";
  const storedDonor = useMemo(readStoredDonor, []);
  const [mode, setMode] = useState(storedDonor ? "donor" : "");
  const [donorForm, setDonorForm] = useState(emptyDonorForm);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [registeredDonor, setRegisteredDonor] = useState(storedDonor);
  const [bloodRequest, setBloodRequest] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [summary, setSummary] = useState([]);
  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [directoryError, setDirectoryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadSummary = () => fetchPublicBloodSummary().then(setSummary).catch(() => setSummary([]));
  const loadDonors = async () => {
    setDirectoryLoading(true);
    setDirectoryError("");
    try { setDonors(await fetchPublicBloodDonors()); }
    catch (error) { setDonors([]); setDirectoryError(error.message); }
    finally { setDirectoryLoading(false); }
  };

  useEffect(() => { loadSummary(); loadDonors(); }, []);

  useEffect(() => {
    if (directoryLoading || directoryError || !registeredDonor?.id) return;
    const currentDonor = donors.find((donor) => donor.id === registeredDonor.id)
      || donors.find((donor) => normalisePhone(donor.phone) === normalisePhone(registeredDonor.phone));
    if (currentDonor) {
      setRegisteredDonor(currentDonor);
      window.localStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify(currentDonor));
    } else {
      setRegisteredDonor(null);
      window.localStorage.removeItem(DONOR_STORAGE_KEY);
    }
  }, [directoryLoading, directoryError, donors]);

  const filteredDonors = useMemo(() => {
    const query = normaliseDonorSearch(search);
    if (!query) return donors;
    return donors.filter((donor) => normaliseDonorSearch([
      donor.blood_group,
      donor.full_name,
      donor.phone,
      donor.address,
    ].join(" ")).includes(query));
  }, [donors, search]);

  const matchingPatientDonors = useMemo(() => {
    if (!bloodRequest) return [];
    return donors.filter((donor) => donor.blood_group === bloodRequest.blood_group);
  }, [bloodRequest, donors]);

  const chooseMode = (nextMode) => {
    setMode(nextMode);
    setMessage("");
    window.setTimeout(() => document.getElementById("blood-active-flow")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const donor = await registerPublicBloodDonor(donorForm);
      setRegisteredDonor(donor);
      window.localStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify(donor));
      setDonorForm(emptyDonorForm);
      setMessage(ur ? "آپ پہلے ہی بلڈ ڈونر فہرست میں شامل ہو چکے ہیں۔" : "You are now registered in the blood donor directory.");
      loadSummary();
      await loadDonors();
      window.setTimeout(() => document.getElementById("blood-registration-result")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const submitBloodRequest = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const request = await registerBloodRequest(patientForm);
      setBloodRequest(request);
      setSelectedAssignment(null);
      setMessage(ur ? "مریض کی درخواست محفوظ ہوگئی ہے۔ متعلقہ ڈونرز نیچے موجود ہیں۔" : "The patient request has been saved. Matching donors are shown below.");
      await loadDonors();
      window.setTimeout(() => document.getElementById("blood-request-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const selectPatientDonor = async (donor) => {
    if (!bloodRequest?.id || busy) return;
    setBusy(true); setMessage("");
    try {
      const assignment = await selectDonorForBloodRequest(bloodRequest.id, donor.id);
      setSelectedAssignment({ ...assignment, donor });
      setMessage(ur ? `${donor.full_name} کو اس مریض کے لیے منتخب کرلیا گیا ہے۔` : `${donor.full_name} has been selected for this patient.`);
      window.setTimeout(() => document.getElementById("blood-selected-donor")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const confirmBloodReceived = async () => {
    if (!bloodRequest?.id || !selectedAssignment?.donor?.id || busy) return;
    if (!window.confirm(ur ? "کیا اس ڈونر نے مریض کو خون دے دیا ہے؟" : "Confirm that this donor has given blood to the patient?")) return;
    setBusy(true); setMessage("");
    try {
      const assignment = await markBloodRequestDonated(bloodRequest.id, selectedAssignment.donor.id);
      setSelectedAssignment((current) => ({ ...current, ...assignment, status: "donated" }));
      setBloodRequest((current) => ({ ...current, status: "fulfilled" }));
      setMessage(ur ? "خون دینے کا مکمل ریکارڈ محفوظ ہوگیا ہے۔" : "The completed blood donation has been saved in the report.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const startNewRequest = () => {
    setPatientForm(emptyPatientForm);
    setBloodRequest(null);
    setSelectedAssignment(null);
    setMessage("");
  };

  return (
    <section className="blood-bank" dir={ur ? "rtl" : "ltr"}>
      <div className="blood-bank__intro">
        <div><span>{ur ? "زندگی بچانے والوں کا نیٹ ورک" : "A NETWORK THAT SAVES LIVES"}</span><h2>{ur ? "خون کا عطیہ—رقم نہیں، زندگی۔" : "Donate blood, not money."}</h2><p>{ur ? "ضرورت مند مریض اور رضاکار ڈونر ایک محفوظ، آسان راستے سے رابطہ کرسکتے ہیں۔" : "Patients in need and volunteer donors can connect through one simple community service."}</p></div>
        <b className="blood-bank__drop">✚</b>
      </div>

      <section className="blood-entry-choice" aria-labelledby="blood-entry-title">
        <div className="blood-entry-choice__head"><span>{ur ? "سب سے پہلے انتخاب کریں" : "CHOOSE HOW TO CONTINUE"}</span><h2 id="blood-entry-title">{ur ? "آپ ڈونر ہیں یا آپ کو خون چاہیے؟" : "Are you a donor, or do you need blood?"}</h2></div>
        <div className="blood-entry-choice__grid">
          <button type="button" className={mode === "donor" ? "active" : ""} onClick={() => chooseMode("donor")}><b>♥</b><span><strong>{ur ? "میں بلڈ ڈونر ہوں" : "I am a blood donor"}</strong><small>{registeredDonor ? (ur ? "آپ کا ریکارڈ محفوظ ہے" : "Your record is already saved") : (ur ? "اپنا ریکارڈ شامل کریں" : "Register your donor details")}</small></span><em>→</em></button>
          <button type="button" className={mode === "patient" ? "active" : ""} onClick={() => chooseMode("patient")}><b>✚</b><span><strong>{ur ? "مجھے خون چاہیے" : "I need blood"}</strong><small>{ur ? "مریض کی تفصیل درج کریں" : "Enter the patient details"}</small></span><em>→</em></button>
        </div>
      </section>

      <div className="blood-summary" aria-label="Available blood donors by group">
        {BLOOD_GROUPS.map((group) => { const row = summary.find((item) => item.blood_group === group); return <div key={group}><b>{group}</b><span>{Number(row?.available_donors || 0)} {ur ? "ڈونر" : "donor(s)"}</span></div>; })}
      </div>

      {!mode && <div className="blood-flow-placeholder">↑ {ur ? "اوپر موجود دو آپشنز میں سے ایک منتخب کریں۔" : "Please select one of the two options above."}</div>}

      {mode === "donor" && <div className="blood-active-flow" id="blood-active-flow">
        {registeredDonor ? <div className="blood-registration-success" id="blood-registration-result">
          <div className="blood-registration-success__mark">✓</div>
          <div><span>{ur ? "آپ پہلے ہی رجسٹرڈ ہیں" : "YOU ARE ALREADY REGISTERED"}</span><h2>{registeredDonor.full_name}</h2><p>{ur ? "آپ کا donor record محفوظ ہے؛ دوبارہ رجسٹریشن کی ضرورت نہیں۔" : "Your donor record is saved; you do not need to register again."}</p></div>
          <b className="blood-registration-success__group">{registeredDonor.blood_group}</b>
          <div className="blood-registration-success__details"><p><span>{ur ? "فون" : "Phone"}</span><b>{registeredDonor.phone}</b></p><p><span>{ur ? "پتہ" : "Address"}</span><b>{registeredDonor.address}</b></p></div>
          <div className="blood-registration-success__actions"><button className="blood-submit" type="button" onClick={() => printBloodDonorSlip(registeredDonor)}>{ur ? "Donor slip پرنٹ کریں" : "Print donor slip"}</button><button type="button" onClick={() => chooseMode("patient")}>{ur ? "مجھے خون چاہیے" : "I need blood"}</button></div>
          {message && <p className="blood-message">{message}</p>}
        </div> : <div className="blood-auth-card blood-simple-register" id="blood-registration-form">
          <div className="blood-simple-register__head"><span>{ur ? "بلڈ ڈونر رجسٹریشن" : "BLOOD DONOR REGISTRATION"}</span><h2>{ur ? "اپنا نام فہرست میں شامل کریں" : "Add yourself to the donor list"}</h2><p>{ur ? "ایک فون نمبر صرف ایک مرتبہ رجسٹر ہو سکتا ہے۔" : "A phone number can be registered only once."}</p></div>
          <form className="blood-form" onSubmit={submitRegistration}>
            <label><span>{ur ? "پورا نام" : "Full name"}</span><input required value={donorForm.fullName} onChange={(event) => setDonorForm({ ...donorForm, fullName: event.target.value })} /></label>
            <label><span>{ur ? "فون نمبر" : "Phone number"}</span><input required inputMode="tel" value={donorForm.phone} onChange={(event) => setDonorForm({ ...donorForm, phone: event.target.value })} /></label>
            <label><span>{ur ? "بلڈ گروپ" : "Blood group"}</span><select value={donorForm.bloodGroup} onChange={(event) => setDonorForm({ ...donorForm, bloodGroup: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className="wide"><span>{ur ? "مکمل پتہ" : "Complete address"}</span><textarea required rows="3" value={donorForm.address} onChange={(event) => setDonorForm({ ...donorForm, address: event.target.value })} /></label>
            <button className="blood-submit wide" disabled={busy}>{busy ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : (ur ? "بلڈ ڈونر کے طور پر رجسٹر کریں" : "Register as a blood donor")}</button>
          </form>
          {message && <p className="blood-message">{message}</p>}
        </div>}

        <section className="blood-public-directory" aria-labelledby="blood-public-directory-title">
          <div className="blood-public-directory__head"><div><span>{ur ? "ایمرجنسی ڈونر ڈائریکٹری" : "EMERGENCY DONOR DIRECTORY"}</span><h2 id="blood-public-directory-title">{ur ? "دستیاب بلڈ ڈونرز" : "Available blood donors"}</h2><p>{ur ? "بلڈ گروپ، نام، فون نمبر یا پتے سے تلاش کریں۔" : "Search by blood group, name, phone number or address."}</p></div><b>{filteredDonors.length}</b></div>
          <label className="blood-public-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ur ? "مثلاً A پازیٹو، B+، O نیگیٹو، نام یا فون" : "For example: A positive, B+, O negative, name or phone"} aria-label={ur ? "بلڈ ڈونر تلاش کریں" : "Search blood donors"} />{search && <button type="button" onClick={() => setSearch("")} aria-label={ur ? "تلاش صاف کریں" : "Clear search"}>×</button>}</label>
          <div className="blood-public-quick-groups"><button type="button" className={!search ? "active" : ""} onClick={() => setSearch("")}>{ur ? "تمام" : "All"}</button>{BLOOD_GROUPS.map((group) => <button type="button" className={normaliseDonorSearch(search) === normaliseDonorSearch(group) ? "active" : ""} key={group} onClick={() => setSearch(group)}>{group}</button>)}</div>
          {directoryLoading ? <div className="blood-loading"><span className="blood-spinner" />{ur ? "ڈونرز لوڈ ہو رہے ہیں…" : "Loading donors…"}</div> : directoryError ? <p className="blood-directory-error">{ur ? "ڈونر فہرست لوڈ نہیں ہوئی۔ نئی SQL فائل چلائیں۔" : "The donor directory could not be loaded. Run the new SQL file."}</p> : <DonorCards donors={filteredDonors} ur={ur} emptyText={ur ? "اس تلاش کے مطابق کوئی دستیاب ڈونر نہیں ملا۔" : "No available donor matches this search."} />}
        </section>
      </div>}

      {mode === "patient" && <div className="blood-active-flow" id="blood-active-flow">
        {!bloodRequest ? <div className="blood-auth-card blood-patient-request">
          <div className="blood-simple-register__head"><span>{ur ? "خون کی درخواست" : "BLOOD REQUEST"}</span><h2>{ur ? "مریض کی مکمل تفصیل درج کریں" : "Enter the patient details"}</h2><p>{ur ? "درخواست محفوظ ہونے کے بعد متعلقہ بلڈ گروپ کے ڈونرز سامنے آجائیں گے۔" : "Matching donors will appear after the request is saved."}</p></div>
          <form className="blood-form" onSubmit={submitBloodRequest}>
            <label><span>{ur ? "مریض کا نام" : "Patient name"}</span><input required value={patientForm.patientName} onChange={(event) => setPatientForm({ ...patientForm, patientName: event.target.value })} /></label>
            <label><span>{ur ? "رابطہ کرنے والے کا نام" : "Contact person"}</span><input required value={patientForm.attendantName} onChange={(event) => setPatientForm({ ...patientForm, attendantName: event.target.value })} /></label>
            <label><span>{ur ? "فون نمبر" : "Phone number"}</span><input required inputMode="tel" value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} /></label>
            <label><span>{ur ? "مطلوبہ بلڈ گروپ" : "Required blood group"}</span><select value={patientForm.bloodGroup} onChange={(event) => setPatientForm({ ...patientForm, bloodGroup: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label><span>{ur ? "خون کی بوتلیں / یونٹس" : "Units required"}</span><input required min="1" max="20" type="number" value={patientForm.units} onChange={(event) => setPatientForm({ ...patientForm, units: event.target.value })} /></label>
            <label><span>{ur ? "ضرورت کی تاریخ" : "Required date"}</span><input required type="date" value={patientForm.neededOn} onChange={(event) => setPatientForm({ ...patientForm, neededOn: event.target.value })} /></label>
            <label className="wide"><span>{ur ? "ہسپتال اور مکمل پتہ" : "Hospital and complete address"}</span><textarea required rows="3" value={patientForm.hospitalAddress} onChange={(event) => setPatientForm({ ...patientForm, hospitalAddress: event.target.value })} /></label>
            <label className="wide"><span>{ur ? "مزید تفصیل (اختیاری)" : "Additional details (optional)"}</span><textarea rows="2" value={patientForm.notes} onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} /></label>
            <button className="blood-submit wide" disabled={busy}>{busy ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : (ur ? "درخواست محفوظ کریں اور ڈونرز دکھائیں" : "Save request and show donors")}</button>
          </form>
          {message && <p className="blood-message">{message}</p>}
        </div> : <section className="blood-request-result" id="blood-request-result">
          <div className="blood-request-result__head"><span>✓</span><div><small>{ur ? "درخواست محفوظ ہوگئی" : "REQUEST SAVED"}</small><h2>{bloodRequest.patient_name}</h2><p>{ur ? `${bloodRequest.blood_group} کے دستیاب ڈونرز سے رابطہ کریں۔` : `Contact an available ${bloodRequest.blood_group} donor below.`}</p></div><b>{bloodRequest.blood_group}</b></div>
          <div className="blood-request-summary"><p><span>{ur ? "رابطہ" : "Contact"}</span><b>{bloodRequest.attendant_name} · {bloodRequest.phone}</b></p><p><span>{ur ? "ہسپتال / پتہ" : "Hospital / address"}</span><b>{bloodRequest.hospital_address}</b></p><p><span>{ur ? "ضرورت" : "Required"}</span><b>{bloodRequest.units} {ur ? "یونٹ" : "unit(s)"} · {bloodRequest.needed_on}</b></p></div>
          {message && <p className="blood-message">{message}</p>}
          {selectedAssignment?.donor && <section className="blood-selected-assignment" id="blood-selected-donor">
            <div><span>{selectedAssignment.status === "donated" ? (ur ? "خون دے دیا گیا" : "DONATION COMPLETED") : (ur ? "مریض کے لیے منتخب ڈونر" : "SELECTED FOR THIS PATIENT")}</span><h3>{selectedAssignment.donor.full_name}</h3><p>{selectedAssignment.donor.blood_group} · {selectedAssignment.donor.phone}</p></div>
            <div className="blood-selected-assignment__actions"><a href={`tel:${String(selectedAssignment.donor.phone || "").replace(/[^+\d]/g, "")}`}>{ur ? "ڈونر کو کال کریں" : "Call donor"}</a>{selectedAssignment.status !== "donated" && <button disabled={busy} type="button" onClick={confirmBloodReceived}>{ur ? "تصدیق کریں: خون دے دیا" : "Confirm: blood donated"}</button>}</div>
          </section>}
          <h3>{ur ? "متعلقہ دستیاب ڈونرز" : "Matching available donors"}</h3>
          {directoryLoading ? <div className="blood-loading"><span className="blood-spinner" /></div> : <DonorCards donors={matchingPatientDonors} ur={ur} onSelect={selectPatientDonor} selectedDonorId={selectedAssignment?.donor?.id} donated={selectedAssignment?.status === "donated"} emptyText={ur ? "اس بلڈ گروپ کا کوئی دستیاب ڈونر ابھی موجود نہیں۔" : "No available donor in this blood group is currently listed."} />}
          <button className="blood-new-request" type="button" onClick={startNewRequest}>{ur ? "نئی درخواست درج کریں" : "Create another request"}</button>
        </section>}
      </div>}

      <p className="blood-privacy">✚ {ur ? "ڈونر کی معلومات صرف حقیقی بلڈ ایمرجنسی کے لیے استعمال کریں۔" : "Use donor details only for a genuine blood emergency."}</p>
    </section>
  );
}
