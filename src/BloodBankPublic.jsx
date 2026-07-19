import { useEffect, useMemo, useState } from "react";
import {
  BLOOD_GROUPS,
  fetchPublicBloodDonors,
  fetchPublicBloodSummary,
  printBloodDonorSlip,
  registerBloodRequest,
  registerPublicBloodDonor,
  verifyBloodRequestAccess,
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

function phoneLink(phone) {
  return String(phone || "").replace(/[^+\d]/g, "");
}

function whatsAppLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return `92${digits.slice(1)}`;
  return digits;
}

export default function BloodBankPublic({ language = "en", managementPhone = "03269842000" }) {
  const ur = language === "ur";
  const storedDonor = useMemo(readStoredDonor, []);
  const [mode, setMode] = useState("");
  const [donorForm, setDonorForm] = useState(emptyDonorForm);
  const [patientForm, setPatientForm] = useState(emptyPatientForm);
  const [registeredDonor, setRegisteredDonor] = useState(storedDonor);
  const [bloodRequest, setBloodRequest] = useState(null);
  const [accessCode, setAccessCode] = useState("");
  const [approvalVerified, setApprovalVerified] = useState(false);
  const [summary, setSummary] = useState([]);
  const [donors, setDonors] = useState([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadSummary = () => fetchPublicBloodSummary().then(setSummary).catch(() => setSummary([]));
  const loadDonors = async (requestId, code) => {
    setDirectoryLoading(true);
    setDirectoryError("");
    try { setDonors(await fetchPublicBloodDonors(requestId, code)); }
    catch (error) { setDonors([]); setDirectoryError(error.message); }
    finally { setDirectoryLoading(false); }
  };

  useEffect(() => { loadSummary(); }, []);

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
      setAccessCode("");
      setApprovalVerified(false);
      setDonors([]);
      setMessage(ur ? "درخواست محفوظ ہوگئی ہے۔ اب management سے رابطہ کرکے approval code حاصل کریں۔" : "The request has been saved. Contact management to receive the approval code.");
      window.setTimeout(() => document.getElementById("blood-request-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const verifyApprovalCode = async (event) => {
    event.preventDefault();
    if (!bloodRequest?.id || accessCode.trim().length < 6) return;
    setBusy(true); setMessage(""); setDirectoryError("");
    try {
      await verifyBloodRequestAccess(bloodRequest.id, accessCode);
      setApprovalVerified(true);
      setBloodRequest((current) => ({ ...current, approval_status: "approved" }));
      await loadDonors(bloodRequest.id, accessCode);
      setMessage(ur ? "Management approval مکمل ہوگئی۔ متعلقہ ڈونرز اب نیچے موجود ہیں۔" : "Management approval is complete. Matching donors are now available below.");
    } catch (error) {
      setApprovalVerified(false);
      setDirectoryError(error.message);
    } finally { setBusy(false); }
  };

  const startNewRequest = () => {
    setPatientForm(emptyPatientForm);
    setBloodRequest(null);
    setAccessCode("");
    setApprovalVerified(false);
    setDonors([]);
    setMessage("");
  };

  const requestReference = bloodRequest?.id ? bloodRequest.id.slice(0, 8).toUpperCase() : "";
  const managementMessage = bloodRequest
    ? encodeURIComponent(`Blood request ${requestReference}\nPatient: ${bloodRequest.patient_name}\nBlood group: ${bloodRequest.blood_group}\nPlease verify the request and share its approval code.`)
    : "";

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

        <p className="blood-private-directory-note">✚ {ur ? "ڈونر رجسٹریشن کے بعد عوامی فہرست ظاہر نہیں کی جاتی۔ ڈونر صرف متعلقہ مریض کی درخواست کے بعد دکھائے جاتے ہیں۔" : "The donor directory is private. Matching donors appear only after a patient submits a blood request."}</p>
      </div>}

      {mode === "patient" && <div className="blood-active-flow" id="blood-active-flow">
        {!bloodRequest ? <div className="blood-auth-card blood-patient-request">
          <div className="blood-simple-register__head"><span>{ur ? "خون کی درخواست" : "BLOOD REQUEST"}</span><h2>{ur ? "مریض کی مکمل تفصیل درج کریں" : "Enter the patient details"}</h2><p>{ur ? "درخواست محفوظ ہونے کے بعد management verification ہوگی؛ approval code کے بغیر ڈونرز ظاہر نہیں ہوں گے۔" : "After saving, management will verify the request. Donors remain hidden until the approval code is entered."}</p></div>
          <form className="blood-form" onSubmit={submitBloodRequest}>
            <label><span>{ur ? "مریض کا نام" : "Patient name"}</span><input required value={patientForm.patientName} onChange={(event) => setPatientForm({ ...patientForm, patientName: event.target.value })} /></label>
            <label><span>{ur ? "رابطہ کرنے والے کا نام" : "Contact person"}</span><input required value={patientForm.attendantName} onChange={(event) => setPatientForm({ ...patientForm, attendantName: event.target.value })} /></label>
            <label><span>{ur ? "فون نمبر" : "Phone number"}</span><input required inputMode="tel" value={patientForm.phone} onChange={(event) => setPatientForm({ ...patientForm, phone: event.target.value })} /></label>
            <label><span>{ur ? "مطلوبہ بلڈ گروپ" : "Required blood group"}</span><select value={patientForm.bloodGroup} onChange={(event) => setPatientForm({ ...patientForm, bloodGroup: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label><span>{ur ? "خون کی بوتلیں / یونٹس" : "Units required"}</span><input required min="1" max="20" type="number" value={patientForm.units} onChange={(event) => setPatientForm({ ...patientForm, units: event.target.value })} /></label>
            <label><span>{ur ? "ضرورت کی تاریخ" : "Required date"}</span><input required type="date" value={patientForm.neededOn} onChange={(event) => setPatientForm({ ...patientForm, neededOn: event.target.value })} /></label>
            <label className="wide"><span>{ur ? "ہسپتال اور مکمل پتہ" : "Hospital and complete address"}</span><textarea required rows="3" value={patientForm.hospitalAddress} onChange={(event) => setPatientForm({ ...patientForm, hospitalAddress: event.target.value })} /></label>
            <label className="wide"><span>{ur ? "مزید تفصیل (اختیاری)" : "Additional details (optional)"}</span><textarea rows="2" value={patientForm.notes} onChange={(event) => setPatientForm({ ...patientForm, notes: event.target.value })} /></label>
            <button className="blood-submit wide" disabled={busy}>{busy ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : (ur ? "درخواست محفوظ کریں" : "Save blood request")}</button>
          </form>
          {message && <p className="blood-message">{message}</p>}
        </div> : <section className="blood-request-result" id="blood-request-result">
          <div className="blood-request-result__head"><span>{approvalVerified ? "✓" : "⌛"}</span><div><small>{approvalVerified ? (ur ? "MANAGEMENT APPROVAL مکمل" : "MANAGEMENT APPROVED") : (ur ? "MANAGEMENT APPROVAL باقی ہے" : "MANAGEMENT APPROVAL REQUIRED")}</small><h2>{bloodRequest.patient_name}</h2><p>{approvalVerified ? (ur ? `${bloodRequest.blood_group} کے متعلقہ ڈونرز اب دکھائے جارہے ہیں۔` : `Matching ${bloodRequest.blood_group} donors are now visible.`) : (ur ? "Management سے رابطہ کرکے چھ ہندسوں کا approval code حاصل کریں۔" : "Contact management and obtain the six-digit approval code.")}</p></div><b>{bloodRequest.blood_group}</b></div>
          <div className="blood-request-summary"><p><span>{ur ? "رابطہ" : "Contact"}</span><b>{bloodRequest.attendant_name} · {bloodRequest.phone}</b></p><p><span>{ur ? "ہسپتال / پتہ" : "Hospital / address"}</span><b>{bloodRequest.hospital_address}</b></p><p><span>{ur ? "ضرورت" : "Required"}</span><b>{bloodRequest.units} {ur ? "یونٹ" : "unit(s)"} · {bloodRequest.needed_on}</b></p></div>
          {message && <p className="blood-message">{message}</p>}
          {!approvalVerified && <section className="blood-management-approval">
            <div className="blood-management-approval__contact">
              <span>{ur ? "MANAGEMENT رابطہ" : "MANAGEMENT CONTACT"}</span>
              <h3>{managementPhone || (ur ? "نمبر دستیاب نہیں" : "Number not available")}</h3>
              <p>{ur ? `درخواست نمبر: ${requestReference}` : `Request reference: ${requestReference}`}</p>
              <div><a href={`tel:${phoneLink(managementPhone)}`}>{ur ? "کال کریں" : "Call management"}</a><a target="_blank" rel="noreferrer" href={`https://wa.me/${whatsAppLink(managementPhone)}?text=${managementMessage}`}>WhatsApp</a></div>
            </div>
            <form className="blood-approval-form" onSubmit={verifyApprovalCode}>
              <label><span>{ur ? "Management سے ملا ہوا 6 ہندسوں کا code" : "Six-digit code from management"}</span><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={accessCode} onChange={(event) => setAccessCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" /></label>
              <button disabled={busy || accessCode.length !== 6}>{busy ? (ur ? "تصدیق ہو رہی ہے…" : "Verifying…") : (ur ? "Code کی تصدیق کریں" : "Verify code & show donors")}</button>
            </form>
            {directoryError && <p className="blood-message blood-message--error">{directoryError}</p>}
            <small>{ur ? "ڈونر کی نجی معلومات درست code کی تصدیق تک محفوظ رہیں گی۔" : "Private donor details stay locked until the correct code is verified."}</small>
          </section>}
          {approvalVerified && <><h3>{ur ? "Management donor کا انتظام کرے گی" : "Management will arrange the donor"}</h3>
          {directoryError ? <p className="blood-message blood-message--error">{directoryError}</p> : null}
          {directoryLoading ? <div className="blood-loading"><span className="blood-spinner" /></div> : <section className="blood-secure-match">
            <b>{matchingPatientDonors.length}</b>
            <div><span>{ur ? `${bloodRequest.blood_group} کے دستیاب matching donors` : `available matching ${bloodRequest.blood_group} donor(s)`}</span><p>{ur ? "حفاظت اور رازداری کی وجہ سے ڈونر کا نام، فون اور پتہ public نہیں دکھایا جاتا۔ Management مناسب ڈونر سے تصدیق کرکے آپ سے رابطہ کرے گی۔" : "For safety and privacy, donor names, phone numbers and addresses are never shown publicly. Management will confirm a suitable donor and contact you."}</p></div>
            <div className="blood-secure-match__actions"><a href={`tel:${phoneLink(managementPhone)}`}>{ur ? "Management کو کال کریں" : "Call management"}</a><a target="_blank" rel="noreferrer" href={`https://wa.me/${whatsAppLink(managementPhone)}?text=${managementMessage}`}>WhatsApp</a></div>
          </section>}</>}
          <button className="blood-new-request" type="button" onClick={startNewRequest}>{ur ? "نئی درخواست درج کریں" : "Create another request"}</button>
        </section>}
      </div>}

      <p className="blood-privacy">✚ {ur ? "ڈونر کی معلومات صرف حقیقی بلڈ ایمرجنسی کے لیے استعمال کریں۔" : "Use donor details only for a genuine blood emergency."}</p>
    </section>
  );
}
