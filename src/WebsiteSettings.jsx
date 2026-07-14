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
        <label className="settings-field"><span>Intro short message</span><textarea dir="rtl" rows="4" value={draft.introSummary} onChange={(e) => update("introSummary", e.target.value)} /></label>
        <div className="settings-preview" style={{ background: draft.colors.cream, color: draft.colors.ink, borderColor: draft.colors.leaf }}><i style={{ background: draft.colors.lime }} /><div><b style={{ color: draft.colors.forest }}>{draft.introTitle}</b><p>{draft.introSubtitle}</p></div></div>
        <div className="settings-actions"><button type="button" className="settings-reset" onClick={() => setDraft(DEFAULT_SITE_SETTINGS)}>Reset defaults</button><button type="submit" className="settings-save" disabled={saving}>{saving ? "Saving..." : "Save & Publish Changes"}</button></div>
        {message && <p className="settings-message">{message}</p>}
      </form>
    </section>
  );
}
