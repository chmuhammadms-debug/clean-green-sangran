import { useState } from "react";
import { registerMembership } from "./membershipService";

const blank = { fullName: "", fatherName: "", phone: "", whatsapp: "", cnic: "", address: "", occupation: "", age: "", interests: [] };
const interestOptions = ["Plantation", "Cleanliness", "Blood Bank", "Welfare", "Sports", "Volunteer Work"];

export default function MembershipForm({ language = "en", onClose }) {
  const ur = language === "ur";
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [member, setMember] = useState(null);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const toggleInterest = (value) => set("interests", form.interests.includes(value) ? form.interests.filter((item) => item !== value) : [...form.interests, value]);

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError("");
    try { setMember(await registerMembership(form)); }
    catch (err) { setError(err.message || "Membership could not be created."); }
    finally { setSaving(false); }
  };

  return <div className="membership-page" role="dialog" aria-modal="true" aria-label="Free membership form" dir={ur ? "rtl" : "ltr"}>
    <header className="membership-page__bar">
      <button className="membership-back" onClick={onClose}>{ur ? "واپس" : "← Back"}</button>
      <div><strong>Clean &amp; Green Sangran</strong><span>{ur ? "مفت ممبرشپ" : "Free Membership"}</span></div>
    </header>
    <main className="membership-page__content">
    <section className="membership-card">
      {member ? <div className="membership-success">
        <span>✓</span><small>{ur ? "ممبرشپ منظور ہو گئی" : "MEMBERSHIP APPROVED"}</small>
        <h2>{ur ? "خوش آمدید!" : "Welcome to the community!"}</h2>
        <p>{ur ? "آپ کی مفت ممبرشپ فوراً منظور ہو گئی ہے۔" : "Your free membership has been approved instantly."}</p>
        <strong>{member.membership_number}</strong>
        <button className="membership-submit" onClick={onClose}>{ur ? "مکمل" : "Done"}</button>
      </div> : <>
        <div className="membership-head"><span>{ur ? "مفت عوامی ممبرشپ" : "FREE COMMUNITY MEMBERSHIP"}</span><h2>{ur ? "کلین اینڈ گرین سنگراں کا حصہ بنیں" : "Become a Member"}</h2><p>{ur ? "کوئی فیس نہیں۔ فارم جمع ہوتے ہی ممبرشپ منظور ہو جائے گی۔" : "No fee. Your membership is approved as soon as you submit."}</p></div>
        <form className="membership-form" onSubmit={submit}>
          <label><span>{ur ? "پورا نام" : "Full name"} *</span><input required minLength="3" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></label>
          <label><span>{ur ? "والد کا نام" : "Father's name"} *</span><input required minLength="3" value={form.fatherName} onChange={(e) => set("fatherName", e.target.value)} /></label>
          <label><span>{ur ? "موبائل نمبر" : "Mobile number"} *</span><input required inputMode="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <label><span>WhatsApp</span><input inputMode="tel" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></label>
          <label><span>CNIC ({ur ? "اختیاری" : "optional"})</span><input inputMode="numeric" value={form.cnic} onChange={(e) => set("cnic", e.target.value)} placeholder="xxxxx-xxxxxxx-x" /></label>
          <label><span>{ur ? "عمر" : "Age"}</span><input type="number" min="12" max="120" value={form.age} onChange={(e) => set("age", e.target.value)} /></label>
          <label><span>{ur ? "پیشہ" : "Occupation"}</span><input value={form.occupation} onChange={(e) => set("occupation", e.target.value)} /></label>
          <label className="membership-wide"><span>{ur ? "پتہ / محلہ" : "Address / Mohalla"} *</span><textarea required minLength="3" rows="2" value={form.address} onChange={(e) => set("address", e.target.value)} /></label>
          <fieldset className="membership-wide"><legend>{ur ? "دلچسپی کے شعبے" : "Areas of interest"}</legend><div className="membership-interests">{interestOptions.map((item) => <label key={item}><input type="checkbox" checked={form.interests.includes(item)} onChange={() => toggleInterest(item)} /><span>{item}</span></label>)}</div></fieldset>
          {error && <p className="membership-error membership-wide">{error}</p>}
          <label className="membership-consent membership-wide"><input required type="checkbox" /><span>{ur ? "میں درست معلومات دینے اور کمیونٹی اصولوں کی پابندی سے اتفاق کرتا/کرتی ہوں۔" : "I confirm these details are correct and agree to follow the community guidelines."}</span></label>
          <button className="membership-submit membership-wide" disabled={saving}>{saving ? (ur ? "جمع ہو رہا ہے…" : "Submitting…") : (ur ? "مفت ممبر بنیں" : "Join Free — Auto Approved")}</button>
        </form>
      </>}
    </section>
    </main>
  </div>;
}
