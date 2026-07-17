import { useEffect, useState } from "react";
import { BLOOD_GROUPS, fetchPublicBloodSummary, printBloodDonorSlip, registerPublicBloodDonor } from "./bloodBankService";
import "./BloodBank.css";

const emptyForm = { fullName: "", phone: "", address: "", bloodGroup: "A+" };

export default function BloodBankPublic({ language = "en" }) {
  const ur = language === "ur";
  const [form, setForm] = useState(emptyForm);
  const [registeredDonor, setRegisteredDonor] = useState(null);
  const [summary, setSummary] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadSummary = () => fetchPublicBloodSummary().then(setSummary).catch(() => setSummary([]));
  useEffect(() => { loadSummary(); }, []);

  const submitRegistration = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const donor = await registerPublicBloodDonor(form);
      setRegisteredDonor(donor);
      setForm(emptyForm);
      setMessage(ur ? "آپ کا نام بلڈ ڈونر فہرست میں شامل ہوگیا ہے۔" : "You have been added to the blood donor registry.");
      loadSummary();
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
      <p className="blood-privacy">🔒 {ur ? "فون اور پتہ صرف مجاز ایڈمن کو نظر آئیں گے؛ عوام کو ذاتی معلومات نہیں دکھائی جاتیں۔" : "Phone numbers and addresses are visible only to the authorised administrator, never to the public."}</p>
    </section>
  );
}
