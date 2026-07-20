import { useState } from "react";
import { submitSuggestion } from "./notificationService";
import "./SuggestionNotifications.css";

const EMPTY_FORM = { name: "", phone: "", category: "general", message: "" };

function SuggestionBox({ language = "en" }) {
  const ur = language === "ur";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const close = () => { setOpen(false); setFeedback(""); };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) return;
    setSaving(true);
    setFeedback("");
    try {
      await submitSuggestion(form);
      setForm(EMPTY_FORM);
      setFeedback(ur ? "آپ کی تجویز انتظامیہ تک پہنچ گئی ہے۔ شکریہ!" : "Your suggestion has reached the administration. Thank you!");
    } catch (error) {
      console.error("Suggestion submission failed", error);
      setFeedback(ur ? "تجویز محفوظ نہیں ہوئی۔ پہلے Supabase کی نئی SQL فائل Run کریں۔" : "Suggestion could not be saved. Please run the new Supabase SQL file first.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button className="suggestion-fab" type="button" onClick={() => setOpen(true)}>
        <span>✦</span>{ur ? "تجاویز" : "Suggestions"}
      </button>
      {open && (
        <div className="suggestion-modal" role="dialog" aria-modal="true" aria-label={ur ? "تجاویز کا فارم" : "Suggestion form"}>
          <button type="button" className="suggestion-modal__backdrop" onClick={close} aria-label="Close" />
          <form className="suggestion-card" onSubmit={submit} dir={ur ? "rtl" : "ltr"}>
            <div className="suggestion-card__header">
              <div><span>{ur ? "آپ کی آواز، ہماری بہتری" : "YOUR VOICE MATTERS"}</span><h2>{ur ? "تجاویز باکس" : "Suggestion Box"}</h2></div>
              <button type="button" onClick={close} aria-label="Close">×</button>
            </div>
            <p>{ur ? "گاؤں یا ویب سائٹ کی بہتری کے لیے اپنی تجویز براہِ راست انتظامیہ تک پہنچائیں۔" : "Send your idea for the village or website directly to the administration."}</p>
            <div className="suggestion-form-grid">
              <label>{ur ? "نام (اختیاری)" : "Name (optional)"}<input value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
              <label>{ur ? "فون نمبر (اختیاری)" : "Phone (optional)"}<input inputMode="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
            </div>
            <label>{ur ? "شعبہ" : "Category"}
              <select value={form.category} onChange={(event) => update("category", event.target.value)}>
                <option value="general">{ur ? "عمومی تجویز" : "General"}</option>
                <option value="cleanliness">{ur ? "صفائی" : "Cleanliness"}</option>
                <option value="plantation">{ur ? "شجرکاری" : "Plantation"}</option>
                <option value="cemetery">{ur ? "قبرستان" : "Cemetery"}</option>
                <option value="mosque">{ur ? "مسجد" : "Mosque"}</option>
                <option value="blood-bank">{ur ? "بلڈ بینک" : "Blood Bank"}</option>
                <option value="website">{ur ? "ویب سائٹ" : "Website"}</option>
                <option value="other">{ur ? "دیگر" : "Other"}</option>
              </select>
            </label>
            <label>{ur ? "اپنی تجویز لکھیں" : "Write your suggestion"}<textarea required rows="5" maxLength="1500" value={form.message} onChange={(event) => update("message", event.target.value)} /></label>
            {feedback && <div className="suggestion-feedback">{feedback}</div>}
            <button className="suggestion-submit" type="submit" disabled={saving || !form.message.trim()}>{saving ? (ur ? "محفوظ ہو رہی ہے…" : "Sending…") : (ur ? "تجویز بھیجیں" : "Send Suggestion")}</button>
          </form>
        </div>
      )}
    </>
  );
}

export default SuggestionBox;
