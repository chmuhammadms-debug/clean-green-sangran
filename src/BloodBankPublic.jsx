import { useEffect, useMemo, useState } from "react";
import { BLOOD_GROUPS, fetchPublicBloodDonors, fetchPublicBloodSummary, printBloodDonorSlip, registerPublicBloodDonor } from "./bloodBankService";
import "./BloodBank.css";

const emptyForm = { fullName: "", phone: "", address: "", bloodGroup: "A+" };

function normaliseDonorSearch(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/positive|پازیٹو|پوزیٹو|مثبت/g, "+")
    .replace(/negative|نیگیٹو|نیگیٹو|منفی/g, "-")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

export default function BloodBankPublic({ language = "en" }) {
  const ur = language === "ur";
  const [form, setForm] = useState(emptyForm);
  const [registeredDonor, setRegisteredDonor] = useState(null);
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

  const submitRegistration = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const donor = await registerPublicBloodDonor(form);
      setRegisteredDonor(donor);
      setForm(emptyForm);
      setMessage(ur ? "آپ کا نام بلڈ ڈونر فہرست میں شامل ہوگیا ہے۔" : "You have been added to the blood donor registry.");
      loadSummary();
      await loadDonors();
      window.setTimeout(() => document.getElementById("blood-registration-result")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const startAnotherRegistration = () => {
    setRegisteredDonor(null); setMessage("");
    window.setTimeout(() => document.getElementById("blood-registration-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <section className="blood-bank" dir={ur ? "rtl" : "ltr"}>
      <div className="blood-bank__intro">
        <div><span>{ur ? "زندگی بچانے والوں کا نیٹ ورک" : "A NETWORK THAT SAVES LIVES"}</span><h2>{ur ? "خون کا عطیہ—رقم نہیں، زندگی۔" : "Donate blood, not money."}</h2><p>{ur ? "اپنی بنیادی معلومات درج کریں تاکہ ضرورت کے وقت مناسب بلڈ گروپ فوری تلاش کیا جاسکے۔" : "Register your basic details so the right blood group can be found quickly in an emergency."}</p></div>
        <b className="blood-bank__drop">✚</b>
      </div>

      <div className="blood-summary" aria-label="Available blood donors by group">
        {BLOOD_GROUPS.map((group) => { const row = summary.find((item) => item.blood_group === group); return <div key={group}><b>{group}</b><span>{Number(row?.available_donors || 0)} {ur ? "ڈونر" : "donor(s)"}</span></div>; })}
      </div>

      <section className="blood-public-directory" aria-labelledby="blood-public-directory-title">
        <div className="blood-public-directory__head">
          <div>
            <span>{ur ? "ایمرجنسی ڈونر ڈائریکٹری" : "EMERGENCY DONOR DIRECTORY"}</span>
            <h2 id="blood-public-directory-title">{ur ? "دستیاب بلڈ ڈونرز" : "Available blood donors"}</h2>
            <p>{ur ? "بلڈ گروپ، نام، فون نمبر یا پتے سے تلاش کریں۔" : "Search by blood group, name, phone number or address."}</p>
          </div>
          <b>{filteredDonors.length}</b>
        </div>

        <label className="blood-public-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={ur ? "مثلاً A پازیٹو، B+، O نیگیٹو، نام یا فون" : "For example: A positive, B+, O negative, name or phone"}
            aria-label={ur ? "بلڈ ڈونر تلاش کریں" : "Search blood donors"}
          />
          {search && <button type="button" onClick={() => setSearch("")} aria-label={ur ? "تلاش صاف کریں" : "Clear search"}>×</button>}
        </label>

        <div className="blood-public-quick-groups" aria-label={ur ? "بلڈ گروپ منتخب کریں" : "Select a blood group"}>
          <button type="button" className={!search ? "active" : ""} onClick={() => setSearch("")}>{ur ? "تمام" : "All"}</button>
          {BLOOD_GROUPS.map((group) => <button type="button" className={normaliseDonorSearch(search) === normaliseDonorSearch(group) ? "active" : ""} key={group} onClick={() => setSearch(group)}>{group}</button>)}
        </div>

        {directoryLoading ? <div className="blood-loading"><span className="blood-spinner" />{ur ? "ڈونرز لوڈ ہو رہے ہیں…" : "Loading donors…"}</div>
          : directoryError ? <p className="blood-directory-error">{ur ? "ڈونر فہرست لوڈ نہیں ہوئی۔ Supabase میں نئی SQL فائل چلائیں۔" : "The donor directory could not be loaded. Run the new SQL file in Supabase."}</p>
            : filteredDonors.length ? <div className="blood-public-grid">
              {filteredDonors.map((donor) => <article className="blood-public-card" key={donor.id}>
                <b className="blood-public-card__group">{donor.blood_group}</b>
                <div><h3>{donor.full_name}</h3><p>{donor.address}</p></div>
                <a href={`tel:${String(donor.phone || "").replace(/[^+\d]/g, "")}`}>{donor.phone}</a>
              </article>)}
            </div> : <div className="blood-empty">{ur ? "اس تلاش کے مطابق کوئی دستیاب ڈونر نہیں ملا۔" : "No available donor matches this search."}</div>}
      </section>

      {!registeredDonor ? (
        <div className="blood-auth-card blood-simple-register" id="blood-registration-form">
          <div className="blood-simple-register__head"><span>{ur ? "بلڈ ڈونر رجسٹریشن" : "BLOOD DONOR REGISTRATION"}</span><h2>{ur ? "اپنا نام فہرست میں شامل کریں" : "Add yourself to the donor list"}</h2><p>{ur ? "Gmail، password یا login کی ضرورت نہیں۔" : "No Gmail, password or login is required."}</p></div>
          <form className="blood-form" onSubmit={submitRegistration}>
            <label><span>{ur ? "پورا نام" : "Full name"}</span><input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
            <label><span>{ur ? "فون نمبر" : "Phone number"}</span><input required inputMode="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label><span>{ur ? "بلڈ گروپ" : "Blood group"}</span><select value={form.bloodGroup} onChange={(event) => setForm({ ...form, bloodGroup: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className="wide"><span>{ur ? "مکمل پتہ" : "Complete address"}</span><textarea required rows="3" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            <button className="blood-submit wide" disabled={busy}>{busy ? (ur ? "محفوظ ہو رہا ہے…" : "Saving…") : (ur ? "بلڈ ڈونر کے طور پر رجسٹر کریں" : "Register as a blood donor")}</button>
          </form>
          {message && <p className="blood-message">{message}</p>}
        </div>
      ) : (
        <div className="blood-registration-success" id="blood-registration-result">
          <div className="blood-registration-success__mark">✓</div>
          <div><span>{ur ? "رجسٹریشن مکمل" : "REGISTRATION COMPLETE"}</span><h2>{registeredDonor.full_name}</h2><p>{ur ? "آپ کا donor record محفوظ ہوگیا ہے۔" : "Your donor record has been saved."}</p></div>
          <b className="blood-registration-success__group">{registeredDonor.blood_group}</b>
          <div className="blood-registration-success__details"><p><span>{ur ? "فون" : "Phone"}</span><b>{registeredDonor.phone}</b></p><p><span>{ur ? "پتہ" : "Address"}</span><b>{registeredDonor.address}</b></p></div>
          <div className="blood-registration-success__actions"><button className="blood-submit" type="button" onClick={() => printBloodDonorSlip(registeredDonor)}>{ur ? "Donor slip پرنٹ کریں" : "Print donor slip"}</button><button type="button" onClick={startAnotherRegistration}>{ur ? "دوسرا donor رجسٹر کریں" : "Register another donor"}</button></div>
          {message && <p className="blood-message">{message}</p>}
        </div>
      )}
      <p className="blood-privacy">✚ {ur ? "ڈونر کی معلومات صرف حقیقی بلڈ ایمرجنسی کے لیے استعمال کریں۔" : "Use donor details only for a genuine blood emergency."}</p>
    </section>
  );
}
