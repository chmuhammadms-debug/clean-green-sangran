import { useMemo, useState } from "react";
import { uploadWebsiteMediaFiles } from "./mediaUpload";
import "./WelfareOperations.css";

export const SPORTS = [
  { id: "cricket", en: "Cricket", ur: "کرکٹ", icon: "🏏" },
  { id: "football", en: "Football", ur: "فٹ بال", icon: "⚽" },
  { id: "volleyball", en: "Volleyball", ur: "والی بال", icon: "🏐" },
  { id: "kabaddi", en: "Kabaddi", ur: "کبڈی", icon: "🤼" },
  { id: "badminton", en: "Badminton", ur: "بیڈمنٹن", icon: "🏸" },
  { id: "athletics", en: "Athletics & Races", ur: "ایتھلیٹکس اور دوڑیں", icon: "🏃" },
];

const CONFIG = {
  "welfare-filtration": {
    title: "Water Plant Operations Register",
    titleUr: "واٹر پلانٹ عملی رجسٹر",
    categories: ["Water Quality Test", "Filter Replacement", "Plant Maintenance", "Tank Cleaning"],
    titleLabel: "Result / Work title",
    detailLabel: "Test result, parts changed or maintenance details",
  },
  "welfare-sports": {
    title: "Sports, Tournaments & Mela Register",
    titleUr: "کھیل، ٹورنامنٹ اور میلہ رجسٹر",
    categories: ["Tournament", "Sports Mela", "Friendly Match", "League Match", "Team Registration", "Player Registration", "Training Camp", "Prize Ceremony"],
    titleLabel: "Tournament, match, team or event name",
    detailLabel: "Event details, highlights, organisers or other information",
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(config, projectId) {
  return {
    sport: projectId === "welfare-sports" ? SPORTS[0].id : "",
    category: config.categories[0],
    title: "",
    date: today(),
    nextDue: "",
    venue: "",
    teams: "",
    result: "",
    details: "",
    status: "Scheduled",
    media: [],
  };
}

export default function WelfareOperationsPanel({ projectId, settings, onSave, saving }) {
  const config = CONFIG[projectId];
  const sportsMode = projectId === "welfare-sports";
  const [form, setForm] = useState(() => emptyForm(config, projectId));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  if (!config) return null;

  const records = Array.isArray(settings?.welfareOperationsByProject?.[projectId])
    ? settings.welfareOperationsByProject[projectId]
    : [];
  const visibleRecords = useMemo(
    () => !sportsMode || sportFilter === "all"
      ? records
      : records.filter((record) => (record.sport || "other") === sportFilter),
    [records, sportFilter, sportsMode],
  );

  function persist(nextRecords) {
    onSave({
      ...settings,
      welfareOperationsByProject: {
        ...(settings?.welfareOperationsByProject || {}),
        [projectId]: nextRecords,
      },
    });
  }

  function addRecord(event) {
    event.preventDefault();
    if (!form.title.trim() || uploading) return;
    const savedRecord = {
      ...form,
      id: editingId || `${projectId}-${Date.now()}`,
      title: form.title.trim(),
      venue: form.venue.trim(),
      teams: form.teams.trim(),
      result: form.result.trim(),
      details: form.details.trim(),
      createdAt: editingId ? (records.find((record) => record.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    persist(editingId
      ? records.map((record) => record.id === editingId ? savedRecord : record)
      : [savedRecord, ...records]);
    setEditingId(null);
    setForm(emptyForm(config, projectId));
  }

  async function addMedia(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setUploadError("");
    try {
      const uploaded = await uploadWebsiteMediaFiles(files, `welfare-sports/${form.sport || "general"}`);
      setForm((current) => ({
        ...current,
        media: [...(current.media || []), ...uploaded.map((asset) => ({
          url: asset.url,
          type: asset.type,
          title: asset.name,
        }))],
      }));
    } catch (error) {
      setUploadError(error.message || "Photos/videos could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  function removePendingMedia(index) {
    setForm((current) => ({ ...current, media: current.media.filter((_, mediaIndex) => mediaIndex !== index) }));
  }

  function startEditing(record) {
    setEditingId(record.id);
    setForm({ ...emptyForm(config, projectId), ...record, media: Array.isArray(record.media) ? record.media : [] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setForm(emptyForm(config, projectId));
  }

  function deleteRecord(id) {
    if (!window.confirm("Delete this sports/event record?")) return;
    persist(records.filter((record) => record.id !== id));
    if (editingId === id) cancelEditing();
  }

  return (
    <section className={`welfare-operations ${sportsMode ? "welfare-operations--sports-admin" : ""}`}>
      <div className="welfare-operations__heading">
        <div><span>SPECIAL PROJECT REGISTER</span><h2>{config.title}</h2><p>{config.titleUr} — یہ ریکارڈ Website Settings کے ساتھ محفوظ ہوتا ہے اور عوامی صفحے پر بھی نظر آتا ہے۔</p></div>
        <b>{records.length} records</b>
      </div>

      {sportsMode && <div className="sports-admin-sport-strip">
        {SPORTS.map((sport) => <button type="button" key={sport.id} className={form.sport === sport.id ? "active" : ""} onClick={() => setForm({ ...form, sport: sport.id })}><span>{sport.icon}</span><b>{sport.en}</b><small>{sport.ur}</small></button>)}
      </div>}

      <form className="welfare-operations__form" onSubmit={addRecord}>
        {sportsMode && <label>Sport<select value={form.sport} onChange={(event) => setForm({ ...form, sport: event.target.value })}>{SPORTS.map((sport) => <option value={sport.id} key={sport.id}>{sport.en} — {sport.ur}</option>)}</select></label>}
        <label>Record type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{config.categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>{config.titleLabel}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        {sportsMode && <><label>Venue / Ground<input value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} placeholder="Ground or event location" /></label><label>Teams / Players<input value={form.teams} onChange={(event) => setForm({ ...form, teams: event.target.value })} placeholder="Team A vs Team B / player names" /></label><label>Score / Result<input value={form.result} onChange={(event) => setForm({ ...form, result: event.target.value })} placeholder="Winner, score or position" /></label></>}
        <label>{projectId === "welfare-filtration" ? "Next test / service date" : "Next event / follow-up date"}<input type="date" value={form.nextDue} onChange={(event) => setForm({ ...form, nextDue: event.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Scheduled</option><option>Registration Open</option><option>In Progress</option><option>Completed</option><option>Postponed</option><option>Cancelled</option><option>Attention Required</option></select></label>
        <label className="welfare-operations__details">{config.detailLabel}<textarea rows="3" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} /></label>
        {sportsMode && <label className="sports-media-upload">Photos & videos<input type="file" accept="image/*,video/*" multiple onChange={addMedia} disabled={uploading} /><small>Multiple photos/videos can be selected together.</small></label>}
        {sportsMode && form.media.length > 0 && <div className="sports-pending-media">{form.media.map((asset, index) => <div key={`${asset.url}-${index}`}>{asset.type === "video" ? <video src={asset.url} /> : <img src={asset.url} alt="" />}<button type="button" onClick={() => removePendingMedia(index)}>×</button></div>)}</div>}
        {uploadError && <p className="sports-upload-error">{uploadError}</p>}
        <button disabled={saving || uploading} type="submit">{uploading ? "Uploading media..." : saving ? "Saving..." : editingId ? "Update sports event" : sportsMode ? "Save sports event" : "Add to project register"}</button>
        {editingId && <button className="sports-cancel-edit" type="button" onClick={cancelEditing}>Cancel editing</button>}
      </form>

      {sportsMode && <div className="sports-record-filter"><button type="button" className={sportFilter === "all" ? "active" : ""} onClick={() => setSportFilter("all")}>All sports</button>{SPORTS.map((sport) => <button type="button" className={sportFilter === sport.id ? "active" : ""} onClick={() => setSportFilter(sport.id)} key={sport.id}>{sport.icon} {sport.en}</button>)}</div>}

      <div className="welfare-operations__records">
        {visibleRecords.map((record) => {
          const sport = SPORTS.find((entry) => entry.id === record.sport);
          return <article className="sports-admin-record" key={record.id}>
            <div><span>{sport ? `${sport.icon} ${sport.en} • ${record.category}` : record.category}</span><small>{record.status}</small></div>
            <h3>{record.title}</h3>
            {sportsMode && <div className="sports-record-facts">{record.venue && <b>📍 {record.venue}</b>}{record.teams && <b>👥 {record.teams}</b>}{record.result && <b>🏆 {record.result}</b>}</div>}
            <p>{record.details || "No additional details"}</p>
            {Array.isArray(record.media) && record.media.length > 0 && <div className="sports-record-media">{record.media.slice(0, 4).map((asset, index) => asset.type === "video" ? <video key={index} src={asset.url} controls /> : <img key={index} src={asset.url} alt={record.title} />)}</div>}
            <footer><time>{record.date}</time>{record.nextDue && <em>Next: {record.nextDue}</em>}<span className="sports-record-actions"><button className="sports-edit-record" type="button" onClick={() => startEditing(record)}>Edit</button><button type="button" onClick={() => deleteRecord(record.id)}>Delete</button></span></footer>
          </article>;
        })}
        {!visibleRecords.length && <p className="welfare-operations__empty">No record added for this sport yet.</p>}
      </div>
    </section>
  );
}
