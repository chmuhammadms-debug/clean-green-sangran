import { useMemo, useState } from "react";
import { uploadWebsiteImage } from "./mediaUpload";
import "./InfrastructureManagement.css";

const PROJECT_ID = "welfare-infrastructure";
const CATEGORIES = ["Streetlight", "Road", "Drainage"];
const STATUSES = ["Reported", "Surveyed", "Approved", "In Progress", "Completed", "On Hold"];
const PRIORITIES = ["Normal", "High", "Urgent"];

function today() { return new Date().toISOString().slice(0, 10); }
function blankRecord() {
  return { category: "Streetlight", title: "", location: "", date: today(), targetDate: "", assignedTo: "", priority: "Normal", status: "Reported", progress: 0, estimatedCost: "", actualCost: "", details: "", publicUpdate: "", beforeImage: "", afterImage: "" };
}
function recordsFrom(settings) {
  const value = settings?.welfareOperationsByProject?.[PROJECT_ID];
  return Array.isArray(value) ? value : [];
}
function statusUr(status) {
  return ({ Reported: "رپورٹ شدہ", Surveyed: "سروے مکمل", Approved: "منظور شدہ", "In Progress": "کام جاری", Completed: "مکمل", "On Hold": "عارضی طور پر رکا ہوا" })[status] || status;
}
function categoryUr(category) {
  return ({ Streetlight: "سٹریٹ لائٹ", Road: "سڑک / گلی", Drainage: "نکاسیٔ آب" })[category] || category;
}

function Summary({ records, ur = false }) {
  const completed = records.filter((item) => item.status === "Completed").length;
  const active = records.filter((item) => item.status === "In Progress").length;
  const urgent = records.filter((item) => item.priority === "Urgent" && item.status !== "Completed").length;
  const spent = records.reduce((sum, item) => sum + (Number(item.actualCost) || 0), 0);
  const cards = [
    [ur ? "کل کام" : "Total Works", records.length, "▦"],
    [ur ? "کام جاری" : "In Progress", active, "◷"],
    [ur ? "مکمل" : "Completed", completed, "✓"],
    [ur ? "فوری توجہ" : "Urgent", urgent, "!"],
    [ur ? "کل خرچ" : "Total Spent", `Rs. ${spent.toLocaleString()}`, "₨"],
  ];
  return <div className="infra-summary">{cards.map(([label, value, icon]) => <div key={label}><i>{icon}</i><span>{label}</span><strong>{value}</strong></div>)}</div>;
}

export function InfrastructureAdmin({ settings, onSave, saving }) {
  const records = recordsFrom(settings);
  const [form, setForm] = useState(blankRecord);
  const [editingId, setEditingId] = useState("");
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  function persist(next) {
    return onSave({ ...settings, welfareOperationsByProject: { ...settings?.welfareOperationsByProject, [PROJECT_ID]: next } });
  }
  async function upload(field, file) {
    if (!file) return;
    setUploading(field); setMessage("");
    try {
      const image = await uploadWebsiteImage(file, `infrastructure/${field}`);
      setForm((current) => ({ ...current, [field]: image.url }));
    } catch (error) { setMessage(error.message); }
    finally { setUploading(""); }
  }
  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.location.trim()) return;
    const record = { ...form, id: editingId || `infra-${Date.now()}`, title: form.title.trim(), location: form.location.trim(), progress: Math.max(0, Math.min(100, Number(form.progress) || 0)), estimatedCost: Number(form.estimatedCost) || 0, actualCost: Number(form.actualCost) || 0, updatedAt: new Date().toISOString() };
    const next = editingId ? records.map((item) => item.id === editingId ? record : item) : [record, ...records];
    await persist(next); setForm(blankRecord()); setEditingId(""); setMessage(editingId ? "Work record updated." : "New work added to the register.");
  }
  function edit(item) { setEditingId(item.id); setForm({ ...blankRecord(), ...item }); document.getElementById("infra-work-form")?.scrollIntoView({ behavior: "smooth" }); }
  async function remove(id) { if (window.confirm("Permanently delete this infrastructure work record?")) await persist(records.filter((item) => item.id !== id)); }

  return <section className="infra-system infra-system--admin" id="infra-work-form">
    <header className="infra-heading"><div><span>STREETLIGHTS • ROADS • DRAINAGE</span><h2>Infrastructure Work Management</h2><p>ہر مقام، لاگت، پیش رفت اور before/after ثبوت کا مکمل انتظام۔</p></div><b>{records.length} WORKS</b></header>
    <Summary records={records} />
    <form className="infra-form" onSubmit={submit}>
      <label>Work type<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label className="infra-form__wide">Work title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Install solar light near main mosque" /></label>
      <label className="infra-form__wide">Exact location / landmark<input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Street, mohalla or nearby landmark" /></label>
      <label>Report / start date<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
      <label>Target completion<input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} /></label>
      <label>Priority<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select></label>
      <label>Progress ({form.progress}%)<input type="range" min="0" max="100" step="5" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} /></label>
      <label>Responsible person / team<input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} /></label>
      <label>Estimated cost (Rs.)<input type="number" min="0" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></label>
      <label>Actual cost (Rs.)<input type="number" min="0" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} /></label>
      <label className="infra-form__wide">Technical details / work required<textarea rows="3" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Fault, dimensions, material, quantity or survey notes" /></label>
      <label className="infra-form__wide">Public progress update<textarea rows="3" value={form.publicUpdate} onChange={(e) => setForm({ ...form, publicUpdate: e.target.value })} placeholder="Short update visible to the community" /></label>
      <label className="infra-upload"><span>Before photo</span>{form.beforeImage && <img src={form.beforeImage} alt="Before work" />}<input type="file" accept="image/*" onChange={(e) => upload("beforeImage", e.target.files?.[0])} /><small>{uploading === "beforeImage" ? "Uploading..." : "Choose image"}</small></label>
      <label className="infra-upload"><span>After / progress photo</span>{form.afterImage && <img src={form.afterImage} alt="After work" />}<input type="file" accept="image/*" onChange={(e) => upload("afterImage", e.target.files?.[0])} /><small>{uploading === "afterImage" ? "Uploading..." : "Choose image"}</small></label>
      <div className="infra-form__actions"><button disabled={saving || uploading} type="submit">{saving ? "Saving..." : editingId ? "Update Work" : "Add Work"}</button>{editingId && <button type="button" className="secondary" onClick={() => { setEditingId(""); setForm(blankRecord()); }}>Cancel edit</button>}</div>
    </form>
    {message && <p className="infra-message">{message}</p>}
    <div className="infra-admin-list">{records.map((item) => <article key={item.id}><div><span>{item.category}</span><b className={`priority priority--${item.priority.toLowerCase()}`}>{item.priority}</b></div><h3>{item.title}</h3><p>📍 {item.location}</p><div className="infra-progress"><i style={{ width: `${item.progress || 0}%` }} /></div><small>{item.status} • {item.progress || 0}% • Rs. {(Number(item.actualCost) || 0).toLocaleString()}</small><footer><button type="button" onClick={() => edit(item)}>Edit</button><button type="button" className="danger" onClick={() => remove(item.id)}>Delete</button></footer></article>)}</div>
  </section>;
}

export function InfrastructurePublic({ settings, language = "en" }) {
  const ur = language === "ur";
  const records = recordsFrom(settings);
  const [category, setCategory] = useState("All");
  const visible = useMemo(() => category === "All" ? records : records.filter((item) => item.category === category), [records, category]);
  return <section className="infra-system infra-system--public" dir={ur ? "rtl" : "ltr"}>
    <header className="infra-heading"><div><span>{ur ? "شفاف انفراسٹرکچر ریکارڈ" : "TRANSPARENT INFRASTRUCTURE REGISTER"}</span><h2>{ur ? "سٹریٹ لائٹس، سڑکیں اور نکاسیٔ آب" : "Streetlights, Roads & Drainage"}</h2><p>{ur ? "ہر مسئلے سے تکمیل تک مقام، خرچ، پیش رفت اور تصویری ثبوت۔" : "From reported issue to completion: location, cost, progress and photographic proof."}</p></div></header>
    <Summary records={records} ur={ur} />
    <nav className="infra-filters">{["All", ...CATEGORIES].map((item) => <button type="button" className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item === "All" ? (ur ? "تمام" : "All") : (ur ? categoryUr(item) : item)}</button>)}</nav>
    <div className="infra-public-grid">{visible.map((item) => <article key={item.id}>
      <div className="infra-card__top"><span>{ur ? categoryUr(item.category) : item.category}</span><b className={`priority priority--${String(item.priority || "Normal").toLowerCase()}`}>{item.priority}</b></div>
      <h3>{item.title}</h3><p className="infra-location">📍 {item.location}</p>
      {(item.beforeImage || item.afterImage) && <div className="infra-proof">{item.beforeImage && <figure><img src={item.beforeImage} alt="Before work" loading="lazy" /><figcaption>{ur ? "کام سے پہلے" : "Before"}</figcaption></figure>}{item.afterImage && <figure><img src={item.afterImage} alt="After or progress" loading="lazy" /><figcaption>{item.status === "Completed" ? (ur ? "کام کے بعد" : "After") : (ur ? "پیش رفت" : "Progress")}</figcaption></figure>}</div>}
      <div className="infra-progress"><i style={{ width: `${item.progress || 0}%` }} /></div><div className="infra-progress-label"><span>{ur ? statusUr(item.status) : item.status}</span><strong>{item.progress || 0}%</strong></div>
      <p>{item.publicUpdate || item.details || (ur ? "مزید تفصیل جلد شامل کی جائے گی۔" : "More details will be added soon.")}</p>
      <dl><div><dt>{ur ? "تاریخ" : "Start"}</dt><dd>{item.date || "—"}</dd></div><div><dt>{ur ? "ہدف" : "Target"}</dt><dd>{item.targetDate || "—"}</dd></div><div><dt>{ur ? "ذمہ دار" : "Assigned"}</dt><dd>{item.assignedTo || "—"}</dd></div><div><dt>{ur ? "خرچ" : "Spent"}</dt><dd>Rs. {(Number(item.actualCost) || 0).toLocaleString()}</dd></div></dl>
    </article>)}{!visible.length && <p className="infra-empty">{ur ? "ابھی اس زمرے میں کوئی کام شامل نہیں۔" : "No work has been added in this category yet."}</p>}</div>
  </section>;
}
