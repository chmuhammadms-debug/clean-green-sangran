import { useEffect, useState } from "react";
import "./WebsiteSettings.css";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from "./siteSettings";

const colorFields = [
  ["forest", "Dark green"], ["forest2", "Secondary green"],
  ["leaf", "Main green"], ["lime", "Parrot green"],
  ["cream", "Page background"], ["ink", "Text colour"],
];

const faithProjects = [
  { id: "cemetery", label: "قبرستان", labelEn: "Cemetery" },
  { id: "plantation", label: "شجرکاری", labelEn: "Plantation" },
  { id: "mosque", label: "مسجد", labelEn: "Mosque" },
  { id: "welfare", label: "فلاحی منصوبے", labelEn: "Welfare" },
];

export default function WebsiteSettings({ settings, onSave, saving }) {
  const [draft, setDraft] = useState(() => mergeSiteSettings(settings));
  const [message, setMessage] = useState("");
  const [faithProject, setFaithProject] = useState("cemetery");

  useEffect(() => setDraft(mergeSiteSettings(settings)), [settings]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateColor = (key, value) => setDraft((current) => ({
    ...current, colors: { ...current.colors, [key]: value },
  }));
  const addSocialLink = () => setDraft((current) => ({
    ...current,
    socialLinks: [...(current.socialLinks || []), { id: `${Date.now()}-${Math.random()}`, name: "Facebook", url: "", enabled: true }],
  }));
  const updateSocialLink = (id, key, value) => setDraft((current) => ({
    ...current,
    socialLinks: (current.socialLinks || []).map((link) => link.id === id ? { ...link, [key]: value } : link),
  }));
  const removeSocialLink = (id) => setDraft((current) => ({
    ...current,
    socialLinks: (current.socialLinks || []).filter((link) => link.id !== id),
  }));
  const addPaymentMethod = () => setDraft((current) => ({
    ...current,
    paymentMethods: [...(current.paymentMethods || []), { id: `${Date.now()}-${Math.random()}`, provider: "Bank Account", accountTitle: "", accountNumber: "", instructionsEn: "", instructionsUr: "", enabled: true }],
  }));
  const updatePaymentMethod = (id, key, value) => setDraft((current) => ({
    ...current,
    paymentMethods: (current.paymentMethods || []).map((method) => method.id === id ? { ...method, [key]: value } : method),
  }));
  const removePaymentMethod = (id) => setDraft((current) => ({
    ...current,
    paymentMethods: (current.paymentMethods || []).filter((method) => method.id !== id),
  }));
  const addProjectFaithSlide = () => setDraft((current) => ({
    ...current,
    projectFaithSlidesByProject: {
      ...(current.projectFaithSlidesByProject || {}),
      [faithProject]: [...(current.projectFaithSlidesByProject?.[faithProject] || []), {
        id: `${faithProject}-${Date.now()}-${Math.random()}`,
        typeEn: "Quranic guidance",
        typeUr: "قرآنی رہنمائی",
        arabic: "",
        translationUr: "",
        translationEn: "",
        reference: "",
        enabled: true,
      }],
    },
  }));
  const updateProjectFaithSlide = (id, key, value) => setDraft((current) => ({
    ...current,
    projectFaithSlidesByProject: {
      ...(current.projectFaithSlidesByProject || {}),
      [faithProject]: (current.projectFaithSlidesByProject?.[faithProject] || []).map((slide) => (
        slide.id === id ? { ...slide, [key]: value } : slide
      )),
    },
  }));
  const removeProjectFaithSlide = (id) => setDraft((current) => ({
    ...current,
    projectFaithSlidesByProject: {
      ...(current.projectFaithSlidesByProject || {}),
      [faithProject]: (current.projectFaithSlidesByProject?.[faithProject] || []).filter((slide) => slide.id !== id),
    },
  }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      await onSave(draft);
      setMessage("Website settings saved successfully.");
    } catch (error) {
      setMessage(`Save failed: ${error.message}`);
    }
  };

  return (
    <section className="website-settings panel">
      <div className="settings-heading">
        <div><span>ADMIN CONTROL</span><h2>Website Settings</h2></div>
        <p>Colours aur public website ka text yahan se change karein.</p>
      </div>
      <form onSubmit={submit}>
        <div className="settings-colours">
          {colorFields.map(([key, label]) => (
            <label key={key}><span>{label}</span><div><input type="color" value={draft.colors[key]} onChange={(e) => updateColor(key, e.target.value)} /><input value={draft.colors[key]} onChange={(e) => updateColor(key, e.target.value)} /></div></label>
          ))}
        </div>
        <label className="settings-field"><span>Moving ticker text</span><textarea rows="3" value={draft.tickerText} onChange={(e) => update("tickerText", e.target.value)} /></label>
        <div className="settings-text-grid">
          <label className="settings-field"><span>Intro title</span><input dir="rtl" value={draft.introTitle} onChange={(e) => update("introTitle", e.target.value)} /></label>
          <label className="settings-field"><span>Intro subtitle</span><input dir="rtl" value={draft.introSubtitle} onChange={(e) => update("introSubtitle", e.target.value)} /></label>
        </div>
        <div className="settings-heading"><div><span>SOCIAL MEDIA</span><h2>Social Media Accounts</h2></div><p>Jab chahein account add, hide ya remove karein. Mukammal link https:// ke sath paste karein.</p></div>
        <div className="social-settings-list">
          {(draft.socialLinks || []).map((link) => (
            <div className="social-settings-row" key={link.id}>
              <select value={link.name} onChange={(e) => updateSocialLink(link.id, "name", e.target.value)}>
                <option>Facebook</option><option>Instagram</option><option>YouTube</option><option>WhatsApp</option><option>TikTok</option><option>X / Twitter</option><option>LinkedIn</option><option>Other</option>
              </select>
              <input type="url" placeholder="https://..." value={link.url} onChange={(e) => updateSocialLink(link.id, "url", e.target.value)} />
              <label className="social-settings-toggle"><input type="checkbox" checked={link.enabled !== false} onChange={(e) => updateSocialLink(link.id, "enabled", e.target.checked)} /><span>{link.enabled !== false ? "Visible" : "Hidden"}</span></label>
              <button type="button" className="social-settings-remove" onClick={() => removeSocialLink(link.id)}>Remove</button>
            </div>
          ))}
          {!(draft.socialLinks || []).length && <p className="social-settings-empty">Abhi koi social media account attach nahi hai.</p>}
        </div>
        <button type="button" className="social-settings-add" onClick={addSocialLink}>+ Add Social Media Account</button>
        <div className="settings-heading"><div><span>DONATION DETAILS</span><h2>Bank, JazzCash & Easypaisa</h2></div><p>Public donation details add, edit, hide ya remove karein. PIN, password ya OTP kabhi yahan na likhein.</p></div>
        <div className="payment-settings-list">
          {(draft.paymentMethods || []).map((method) => (
            <div className="payment-settings-card" key={method.id}>
              <div className="payment-settings-grid">
                <label className="settings-field"><span>Payment method</span><select value={method.provider} onChange={(e) => updatePaymentMethod(method.id, "provider", e.target.value)}><option>Bank Account</option><option>JazzCash</option><option>Easypaisa</option><option>Raast ID</option><option>Other</option></select></label>
                <label className="settings-field"><span>Account title</span><input value={method.accountTitle} onChange={(e) => updatePaymentMethod(method.id, "accountTitle", e.target.value)} placeholder="Account holder name" /></label>
                <label className="settings-field payment-number-field"><span>Account / IBAN / Mobile number</span><input value={method.accountNumber} onChange={(e) => updatePaymentMethod(method.id, "accountNumber", e.target.value)} placeholder="PK00... or 03XX..." /></label>
                <label className="settings-field"><span>Instructions — English</span><input value={method.instructionsEn} onChange={(e) => updatePaymentMethod(method.id, "instructionsEn", e.target.value)} placeholder="Send payment and keep the receipt" /></label>
                <label className="settings-field"><span>ہدایات — اردو</span><input dir="rtl" value={method.instructionsUr} onChange={(e) => updatePaymentMethod(method.id, "instructionsUr", e.target.value)} placeholder="رقم بھیج کر رسید محفوظ رکھیں" /></label>
              </div>
              <div className="payment-settings-actions"><label className="social-settings-toggle"><input type="checkbox" checked={method.enabled !== false} onChange={(e) => updatePaymentMethod(method.id, "enabled", e.target.checked)} /><span>{method.enabled !== false ? "Visible on public page" : "Hidden"}</span></label><button type="button" className="social-settings-remove" onClick={() => removePaymentMethod(method.id)}>Remove</button></div>
            </div>
          ))}
          {!(draft.paymentMethods || []).length && <p className="social-settings-empty">Abhi koi bank, JazzCash ya Easypaisa detail add nahi ki gayi.</p>}
        </div>
        <button type="button" className="social-settings-add" onClick={addPaymentMethod}>+ Add Donation Method</button>
        <label className="settings-field"><span>Intro short message</span><textarea dir="rtl" rows="4" value={draft.introSummary} onChange={(e) => update("introSummary", e.target.value)} /></label>
        <div className="settings-heading"><div><span>PROJECT TICKERS</span><h2>Ongoing & Coming Soon</h2></div><p>Public page ke dono project boxes ka naam aur date/detail yahan se edit karein.</p></div>
        <div className="settings-text-grid">
          <label className="settings-field"><span>Ongoing project — English</span><input value={draft.ongoingProjectEn} onChange={(e) => update("ongoingProjectEn", e.target.value)} /></label>
          <label className="settings-field"><span>جاری منصوبہ — اردو</span><input dir="rtl" value={draft.ongoingProjectUr} onChange={(e) => update("ongoingProjectUr", e.target.value)} /></label>
          <label className="settings-field"><span>Ongoing date/detail — English</span><input value={draft.ongoingProjectDateEn} onChange={(e) => update("ongoingProjectDateEn", e.target.value)} /></label>
          <label className="settings-field"><span>جاری منصوبے کی تاریخ/تفصیل — اردو</span><input dir="rtl" value={draft.ongoingProjectDateUr} onChange={(e) => update("ongoingProjectDateUr", e.target.value)} /></label>
          <label className="settings-field"><span>Coming soon project — English</span><input value={draft.comingProjectEn} onChange={(e) => update("comingProjectEn", e.target.value)} /></label>
          <label className="settings-field"><span>آنے والا منصوبہ — اردو</span><input dir="rtl" value={draft.comingProjectUr} onChange={(e) => update("comingProjectUr", e.target.value)} /></label>
          <label className="settings-field"><span>Expected date/detail — English</span><input value={draft.comingProjectDateEn} onChange={(e) => update("comingProjectDateEn", e.target.value)} /></label>
          <label className="settings-field"><span>متوقع تاریخ/تفصیل — اردو</span><input dir="rtl" value={draft.comingProjectDateUr} onChange={(e) => update("comingProjectDateUr", e.target.value)} /></label>
        </div>
        <div className="settings-heading faith-settings-heading">
          <div><span>PROJECT FAITH SLIDER</span><h2>آیات، ترجمہ اور احادیث</h2></div>
          <p>پہلے منصوبہ منتخب کریں، پھر اسی منصوبے کی الگ آیات یا احادیث شامل، تبدیل، بند یا حذف کریں۔</p>
        </div>
        <div className="faith-project-tabs" role="tablist" aria-label="منصوبہ منتخب کریں">
          {faithProjects.map((project) => (
            <button
              type="button"
              role="tab"
              aria-selected={faithProject === project.id}
              className={faithProject === project.id ? "active" : ""}
              key={project.id}
              onClick={() => setFaithProject(project.id)}
            >
              <b>{project.label}</b><small>{project.labelEn}</small>
            </button>
          ))}
        </div>
        <p className="faith-project-note">
          <strong>{faithProjects.find((project) => project.id === faithProject)?.label}</strong> کی سلائیڈیں
        </p>
        <div className="faith-settings-list">
          {(draft.projectFaithSlidesByProject?.[faithProject] || []).map((slide, index) => (
            <div className="faith-settings-card" key={slide.id}>
              <div className="faith-settings-card__top">
                <strong>Slide {index + 1}</strong>
                <label className="social-settings-toggle">
                  <input type="checkbox" checked={slide.enabled !== false} onChange={(e) => updateProjectFaithSlide(slide.id, "enabled", e.target.checked)} />
                  <span>{slide.enabled !== false ? "Visible" : "Hidden"}</span>
                </label>
              </div>
              <div className="faith-settings-grid">
                <label className="settings-field"><span>Type — English</span><input value={slide.typeEn || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "typeEn", e.target.value)} placeholder="Quranic guidance / Hadith" /></label>
                <label className="settings-field"><span>قسم — اردو</span><input dir="rtl" value={slide.typeUr || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "typeUr", e.target.value)} placeholder="قرآنی رہنمائی / حدیثِ مبارک" /></label>
                <label className="settings-field faith-settings-wide faith-settings-arabic"><span>عربی متن</span><textarea dir="rtl" lang="ar" rows="3" value={slide.arabic || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "arabic", e.target.value)} placeholder="قرآنی آیت یا حدیث کا عربی متن" /></label>
                <label className="settings-field"><span>اردو ترجمہ</span><textarea dir="rtl" rows="3" value={slide.translationUr || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "translationUr", e.target.value)} placeholder="اردو ترجمہ یا وضاحت" /></label>
                <label className="settings-field"><span>English translation</span><textarea rows="3" value={slide.translationEn || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "translationEn", e.target.value)} placeholder="English translation or explanation" /></label>
                <label className="settings-field faith-settings-wide"><span>Reference / حوالہ</span><input value={slide.reference || ""} onChange={(e) => updateProjectFaithSlide(slide.id, "reference", e.target.value)} placeholder="Surah Al-Ma'idah 5:2 / Sahih al-Bukhari 2442" /></label>
              </div>
              <div className="faith-settings-actions">
                <small>پیغام تقریباً 8.5 سیکنڈ بعد خود تبدیل ہوگا۔</small>
                <button type="button" className="social-settings-remove" onClick={() => removeProjectFaithSlide(slide.id)}>Remove Slide</button>
              </div>
            </div>
          ))}
          {!(draft.projectFaithSlidesByProject?.[faithProject] || []).length && <p className="social-settings-empty">اس منصوبے میں ابھی کوئی آیت یا حدیث شامل نہیں ہے۔</p>}
        </div>
        <button type="button" className="social-settings-add" onClick={addProjectFaithSlide}>+ اس منصوبے میں نئی آیت یا حدیث شامل کریں</button>
        <div className="settings-preview" style={{ background: draft.colors.cream, color: draft.colors.ink, borderColor: draft.colors.leaf }}><i style={{ background: draft.colors.lime }} /><div><b style={{ color: draft.colors.forest }}>{draft.introTitle}</b><p>{draft.introSubtitle}</p></div></div>
        <div className="settings-actions"><button type="button" className="settings-reset" onClick={() => setDraft(DEFAULT_SITE_SETTINGS)}>Reset defaults</button><button type="submit" className="settings-save" disabled={saving}>{saving ? "Saving..." : "Save & Publish Changes"}</button></div>
        {message && <p className="settings-message">{message}</p>}
      </form>
    </section>
  );
}
