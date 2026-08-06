import { useMemo, useState } from "react";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  submitPublicComplaint,
  trackPublicComplaint,
} from "./complaintService";
import "./ComplaintSystem.css";

const EMPTY_FORM = {
  name: "",
  phone: "",
  category: "cleanliness",
  description: "",
  locationText: "",
  latitude: "",
  longitude: "",
  photo: null,
};

function statusIndex(status) {
  return Math.max(0, COMPLAINT_STATUSES.findIndex((item) => item.id === status));
}

function ComplaintTimeline({ complaint, ur }) {
  const current = statusIndex(complaint.status);
  return (
    <div className="complaint-timeline">
      {COMPLAINT_STATUSES.map((status, index) => (
        <div className={index <= current ? "complaint-step is-active" : "complaint-step"} key={status.id}>
          <i>{index < current ? "✓" : index + 1}</i>
          <span>{ur ? status.ur : status.en}</span>
        </div>
      ))}
    </div>
  );
}

export default function ComplaintPortal({ language = "en" }) {
  const ur = language === "ur";
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("submit");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [created, setCreated] = useState(null);
  const [reference, setReference] = useState("");
  const [tracking, setTracking] = useState(false);
  const [tracked, setTracked] = useState(null);
  const [trackMessage, setTrackMessage] = useState("");
  const [locating, setLocating] = useState(false);

  const categoryLabel = useMemo(() => Object.fromEntries(
    COMPLAINT_CATEGORIES.map((item) => [item.id, ur ? item.ur : item.en]),
  ), [ur]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const close = () => {
    setOpen(false);
    setFeedback("");
    setTrackMessage("");
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setFeedback(ur ? "آپ کا browser GPS location support نہیں کرتا۔" : "Your browser does not support GPS location.");
      return;
    }
    setLocating(true);
    setFeedback("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: Number(coords.latitude).toFixed(6),
          longitude: Number(coords.longitude).toFixed(6),
        }));
        setLocating(false);
      },
      () => {
        setFeedback(ur ? "GPS location نہیں مل سکی۔ Location permission allow کریں۔" : "GPS location could not be read. Please allow location permission.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    if (form.description.trim().length < 10) {
      setFeedback(ur ? "شکایت کم از کم 10 حروف میں لکھیں۔" : "Please describe the complaint in at least 10 characters.");
      return;
    }
    setSaving(true);
    setFeedback("");
    try {
      const result = await submitPublicComplaint(form);
      setCreated(result);
      setReference(result.complaint_no);
      setForm(EMPTY_FORM);
    } catch (error) {
      console.error("Complaint submission failed", error);
      setFeedback(ur
        ? "شکایت محفوظ نہیں ہوئی۔ Complaint database setup مکمل ہونا ضروری ہے۔"
        : "Complaint could not be saved. The complaint database setup must be completed.");
    } finally {
      setSaving(false);
    }
  };

  const track = async (event) => {
    event.preventDefault();
    if (!reference.trim()) return;
    setTracking(true);
    setTracked(null);
    setTrackMessage("");
    try {
      const result = await trackPublicComplaint(reference);
      if (!result) {
        setTrackMessage(ur ? "اس complaint number کا کوئی ریکارڈ نہیں ملا۔" : "No complaint was found with this reference number.");
      } else {
        setTracked(result);
      }
    } catch (error) {
      console.error("Complaint tracking failed", error);
      setTrackMessage(ur ? "اس وقت status check نہیں ہو سکا۔" : "Status could not be checked right now.");
    } finally {
      setTracking(false);
    }
  };

  const copyReference = async () => {
    if (!created?.complaint_no) return;
    try { await navigator.clipboard.writeText(created.complaint_no); } catch { /* no-op */ }
  };

  return (
    <>
      <button className="complaint-fab" type="button" onClick={() => setOpen(true)}>
        <span>!</span>{ur ? "شکایت" : "Complaint"}
      </button>

      {open && (
        <div className="complaint-modal" role="dialog" aria-modal="true" aria-label={ur ? "شکایت کا نظام" : "Complaint system"}>
          <button type="button" className="complaint-modal__backdrop" onClick={close} aria-label="Close" />
          <section className="complaint-card" dir={ur ? "rtl" : "ltr"}>
            <header className="complaint-card__header">
              <div><span>{ur ? "صاف و سرسبز سنگراں" : "CLEAN & GREEN SANGRAN"}</span><h2>{ur ? "شکایت کا نظام" : "Complaint System"}</h2></div>
              <button type="button" onClick={close} aria-label="Close">×</button>
            </header>

            <div className="complaint-tabs">
              <button type="button" className={tab === "submit" ? "active" : ""} onClick={() => { setTab("submit"); setTracked(null); }}>{ur ? "نئی شکایت" : "New Complaint"}</button>
              <button type="button" className={tab === "track" ? "active" : ""} onClick={() => setTab("track")}>{ur ? "شکایت ٹریک کریں" : "Track Complaint"}</button>
            </div>

            {tab === "submit" && !created && (
              <form className="complaint-form" onSubmit={submit}>
                <p>{ur ? "مسئلے کی واضح تفصیل دیں۔ نام اور فون نمبر اختیاری ہیں۔" : "Tell us clearly what needs attention. Name and phone are optional."}</p>
                <div className="complaint-form-grid">
                  <label><span>{ur ? "نام (اختیاری)" : "Name (optional)"}</span><input maxLength="100" value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
                  <label><span>{ur ? "فون نمبر (اختیاری)" : "Phone (optional)"}</span><input inputMode="tel" maxLength="30" value={form.phone} onChange={(event) => update("phone", event.target.value)} /></label>
                </div>
                <label><span>{ur ? "شکایت کی قسم" : "Category"}</span>
                  <select value={form.category} onChange={(event) => update("category", event.target.value)}>
                    {COMPLAINT_CATEGORIES.map((item) => <option value={item.id} key={item.id}>{ur ? item.ur : item.en}</option>)}
                  </select>
                </label>
                <label><span>{ur ? "شکایت کی تفصیل" : "Complaint details"}</span><textarea rows="5" maxLength="2000" required value={form.description} onChange={(event) => update("description", event.target.value)} placeholder={ur ? "مسئلہ کہاں اور کیا ہے؟" : "What is the issue and where is it?"} /></label>
                <label><span>{ur ? "جگہ / پتہ (اختیاری)" : "Location / address (optional)"}</span><input maxLength="240" value={form.locationText} onChange={(event) => update("locationText", event.target.value)} /></label>
                <div className="complaint-location-row">
                  <button type="button" onClick={useLocation} disabled={locating}>{locating ? (ur ? "GPS مل رہا ہے…" : "Getting GPS…") : (ur ? "⌖ موجودہ GPS لگائیں" : "⌖ Use Current GPS")}</button>
                  {form.latitude && form.longitude && <small>✓ {form.latitude}, {form.longitude}</small>}
                </div>
                <label className="complaint-upload"><span>{ur ? "مسئلے کی تصویر (اختیاری)" : "Issue photo (optional)"}</span><input type="file" accept="image/*" onChange={(event) => update("photo", event.target.files?.[0] || null)} /><small>{ur ? "زیادہ سے زیادہ 5 MB" : "Maximum 5 MB"}</small></label>
                {feedback && <div className="complaint-feedback complaint-feedback--error">{feedback}</div>}
                <button className="complaint-primary" type="submit" disabled={saving}>{saving ? (ur ? "جمع ہو رہی ہے…" : "Submitting…") : (ur ? "شکایت جمع کریں" : "Submit Complaint")}</button>
              </form>
            )}

            {tab === "submit" && created && (
              <div className="complaint-success">
                <div className="complaint-success__icon">✓</div>
                <h3>{ur ? "شکایت موصول ہوگئی" : "Complaint Received"}</h3>
                <p>{ur ? "یہ نمبر محفوظ کرلیں۔ اسی سے آپ status چیک کریں گے۔" : "Save this number. You will use it to check progress."}</p>
                <button type="button" className="complaint-reference" onClick={copyReference} title={ur ? "کاپی کریں" : "Copy"}>{created.complaint_no}</button>
                <ComplaintTimeline complaint={{ status: created.status || "received" }} ur={ur} />
                <div className="complaint-success__actions">
                  <button type="button" onClick={() => { setTab("track"); setTracked(null); }}>{ur ? "Status چیک کریں" : "Check Status"}</button>
                  <button type="button" onClick={() => { setCreated(null); setFeedback(""); }}>{ur ? "ایک اور شکایت" : "Another Complaint"}</button>
                </div>
              </div>
            )}

            {tab === "track" && (
              <div className="complaint-track">
                <p>{ur ? "اپنا complaint number لکھ کر تازہ status دیکھیں۔" : "Enter your complaint number to see its latest status."}</p>
                <form onSubmit={track}>
                  <input value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="CGS-260806-XXXXXXXXXX" aria-label={ur ? "کمپلینٹ نمبر" : "Complaint number"} />
                  <button className="complaint-primary" type="submit" disabled={tracking || !reference.trim()}>{tracking ? (ur ? "چیک ہو رہا ہے…" : "Checking…") : (ur ? "Status دیکھیں" : "Check Status")}</button>
                </form>
                {trackMessage && <div className="complaint-feedback complaint-feedback--error">{trackMessage}</div>}
                {tracked && (
                  <article className="complaint-track-result">
                    <div className="complaint-track-result__top"><div><small>{ur ? "شکایت نمبر" : "Complaint No."}</small><strong>{tracked.complaint_no}</strong></div><b className={`complaint-status complaint-status--${tracked.status}`}>{COMPLAINT_STATUSES.find((item) => item.id === tracked.status)?.[ur ? "ur" : "en"] || tracked.status}</b></div>
                    <p><b>{ur ? "قسم:" : "Category:"}</b> {categoryLabel[tracked.category] || tracked.category}</p>
                    {tracked.location_text && <p><b>{ur ? "جگہ:" : "Location:"}</b> {tracked.location_text}</p>}
                    <ComplaintTimeline complaint={tracked} ur={ur} />
                    {tracked.admin_reply && <div className="complaint-admin-reply"><small>{ur ? "انتظامیہ کا جواب" : "Management reply"}</small><p>{tracked.admin_reply}</p></div>}
                    {(tracked.before_photo_url || tracked.after_photo_url) && (
                      <div className="complaint-evidence-public">
                        {tracked.before_photo_url && <figure><img src={tracked.before_photo_url} alt="Before" /><figcaption>{ur ? "پہلے" : "Before"}</figcaption></figure>}
                        {tracked.after_photo_url && <figure><img src={tracked.after_photo_url} alt="After" /><figcaption>{ur ? "بعد" : "After"}</figcaption></figure>}
                      </div>
                    )}
                  </article>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
