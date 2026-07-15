import { useEffect, useState } from "react";
import "./WebsiteSettings.css";
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from "./siteSettings";

const colorFields = [
  ["forest", "Dark green"], ["forest2", "Secondary green"],
  ["leaf", "Main green"], ["lime", "Parrot green"],
  ["cream", "Page background"], ["ink", "Text colour"],
];

export default function WebsiteSettings({ settings, onSave, saving }) {
  const [draft, setDraft] = useState(() => mergeSiteSettings(settings));
  const [message, setMessage] = useState("");

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
        <div className="settings-preview" style={{ background: draft.colors.cream, color: draft.colors.ink, borderColor: draft.colors.leaf }}><i style={{ background: draft.colors.lime }} /><div><b style={{ color: draft.colors.forest }}>{draft.introTitle}</b><p>{draft.introSubtitle}</p></div></div>
        <div className="settings-actions"><button type="button" className="settings-reset" onClick={() => setDraft(DEFAULT_SITE_SETTINGS)}>Reset defaults</button><button type="submit" className="settings-save" disabled={saving}>{saving ? "Saving..." : "Save & Publish Changes"}</button></div>
        {message && <p className="settings-message">{message}</p>}
      </form>
    </section>
  );
}
