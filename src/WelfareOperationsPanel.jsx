import { useState } from "react";
import "./WelfareOperations.css";

const CONFIG = {
  "welfare-filtration": {
    title: "Water Plant Operations Register",
    titleUr: "واٹر پلانٹ عملی رجسٹر",
    categories: ["Water Quality Test", "Filter Replacement", "Plant Maintenance", "Tank Cleaning"],
    titleLabel: "Result / Work title",
    detailLabel: "Test result, parts changed or maintenance details",
  },
  "welfare-sports": {
    title: "Sports & Youth Register",
    titleUr: "کھیل اور نوجوان رجسٹر",
    categories: ["Player Registration", "Team Registration", "Event Schedule", "Match Result"],
    titleLabel: "Player, team or event name",
    detailLabel: "Contact, venue, score or other details",
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(config) {
  return {
    category: config.categories[0],
    title: "",
    date: today(),
    nextDue: "",
    details: "",
    status: "Scheduled",
  };
}

export default function WelfareOperationsPanel({ projectId, settings, onSave, saving }) {
  const config = CONFIG[projectId];
  const [form, setForm] = useState(() => emptyForm(config));
  if (!config) return null;

  const records = Array.isArray(settings?.welfareOperationsByProject?.[projectId])
    ? settings.welfareOperationsByProject[projectId]
    : [];

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
    if (!form.title.trim()) return;
    persist([
      {
        ...form,
        id: `${projectId}-${Date.now()}`,
        title: form.title.trim(),
        details: form.details.trim(),
        createdAt: new Date().toISOString(),
      },
      ...records,
    ]);
    setForm(emptyForm(config));
  }

  function deleteRecord(id) {
    if (!window.confirm("Delete this operational record?")) return;
    persist(records.filter((record) => record.id !== id));
  }

  return (
    <section className="welfare-operations">
      <div className="welfare-operations__heading">
        <div><span>SPECIAL PROJECT REGISTER</span><h2>{config.title}</h2><p>{config.titleUr} — یہ ریکارڈ Website Settings کے ساتھ محفوظ ہوتا ہے اور عوامی صفحے پر بھی نظر آتا ہے۔</p></div>
        <b>{records.length} records</b>
      </div>

      <form className="welfare-operations__form" onSubmit={addRecord}>
        <label>Record type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{config.categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>{config.titleLabel}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Date<input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
        <label>{projectId === "welfare-filtration" ? "Next test / service date" : "Next event / follow-up date"}<input type="date" value={form.nextDue} onChange={(event) => setForm({ ...form, nextDue: event.target.value })} /></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Scheduled</option><option>Completed</option><option>Attention Required</option></select></label>
        <label className="welfare-operations__details">{config.detailLabel}<textarea rows="3" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} /></label>
        <button disabled={saving} type="submit">{saving ? "Saving..." : "Add to project register"}</button>
      </form>

      <div className="welfare-operations__records">
        {records.map((record) => <article key={record.id}>
          <div><span>{record.category}</span><small>{record.status}</small></div>
          <h3>{record.title}</h3>
          <p>{record.details || "No additional details"}</p>
          <footer><time>{record.date}</time>{record.nextDue && <em>Next: {record.nextDue}</em>}<button type="button" onClick={() => deleteRecord(record.id)}>Delete</button></footer>
        </article>)}
        {!records.length && <p className="welfare-operations__empty">No operational record added yet.</p>}
      </div>
    </section>
  );
}
