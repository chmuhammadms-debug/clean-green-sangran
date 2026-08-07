import { useState } from "react";
import ProjectIcon from "./ProjectIcon";
import { mosqueProjectsFor } from "./mosqueManagement";
import "./MosqueProjectsHub.css";

const emptyProject = {
  nameEn: "",
  nameUr: "",
  descriptionEn: "",
  descriptionUr: "",
  icon: "🛠️",
  status: "proposed",
  budget: "",
  completionPercent: 0,
  startDate: "",
  expectedCompletionDate: "",
};

const statusLabels = {
  proposed: { en: "Proposed", ur: "تجویز کردہ" },
  approved: { en: "Approved", ur: "منظور شدہ" },
  fundraising: { en: "Fundraising", ur: "فنڈ جمع ہو رہا ہے" },
  "in-progress": { en: "In Progress", ur: "کام جاری ہے" },
  completed: { en: "Completed", ur: "مکمل" },
  "on-hold": { en: "On Hold", ur: "عارضی طور پر رکا ہوا" },
};

function totalsFor(records) {
  const donations = records
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return { donations, expenses, balance: donations - expenses };
}

export default function MosqueProjectsHub({
  mosque,
  systems,
  transactions,
  profiles = {},
  onOpenSystem,
  onCreateProject,
  language = "en",
  getName = (system) => system.name,
  getDescription = (system) => system.description,
  adminMode = false,
}) {
  const ur = language === "ur";
  const projects = mosqueProjectsFor(systems, mosque.id, profiles);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.nameEn.trim() && !form.nameUr.trim()) return;
    setSaving(true);
    setMessage("");
    try {
      await onCreateProject(mosque.id, form);
      setForm(emptyProject);
      setShowForm(false);
      setMessage("نیا مسجد پروجیکٹ محفوظ ہوگیا ہے۔");
    } catch (error) {
      setMessage(`پروجیکٹ محفوظ نہیں ہوسکا: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mosque-projects" dir={ur ? "rtl" : "ltr"}>
      <div className="mosque-projects__heading">
        <div>
          <span>{ur ? "ہر کام کا الگ شفاف ریکارڈ" : "SEPARATE WORK • SEPARATE RECORD"}</span>
          <h2>{ur ? "مسجد کے ترقیاتی منصوبے" : "Mosque development projects"}</h2>
          <p>{ur
            ? "مینار، ٹائلز، سولر، واش روم اور آئندہ شامل ہونے والے ہر کام کی تفصیل، بجٹ، تصاویر، عطیات، اخراجات اور پیش رفت الگ محفوظ ہوگی۔"
            : "Minaret, tiles, solar, washroom and every future work item keeps its own details, budget, photos, donations, expenses and progress."}</p>
        </div>
        <div className="mosque-projects__heading-actions">
          <div className="mosque-projects__count"><strong>{projects.length}</strong><small>{ur ? "منصوبے" : "PROJECTS"}</small></div>
          {adminMode && (
            <button type="button" onClick={() => setShowForm((visible) => !visible)}>
              {showForm ? "× فارم بند کریں" : "+ نیا پروجیکٹ"}
            </button>
          )}
        </div>
      </div>

      {adminMode && showForm && (
        <form className="mosque-project-form" onSubmit={submit}>
          <div className="mosque-project-form__title">
            <div><span>NEW MOSQUE PROJECT</span><h3>اس مسجد میں نیا پروجیکٹ شامل کریں</h3></div>
            <ProjectIcon project={{ icon: form.icon }} size={38} />
          </div>
          <div className="mosque-project-form__grid">
            <label><span>English name</span><input value={form.nameEn} onChange={(event) => update("nameEn", event.target.value)} placeholder="For example: New roof work" /></label>
            <label><span>اردو نام</span><input dir="rtl" value={form.nameUr} onChange={(event) => update("nameUr", event.target.value)} placeholder="مثلاً: نئی چھت کا کام" /></label>
            <label><span>English details</span><textarea rows="3" value={form.descriptionEn} onChange={(event) => update("descriptionEn", event.target.value)} /></label>
            <label><span>اردو تفصیل</span><textarea dir="rtl" rows="3" value={form.descriptionUr} onChange={(event) => update("descriptionUr", event.target.value)} /></label>
            <label><span>Icon</span><input value={form.icon} onChange={(event) => update("icon", event.target.value)} /></label>
            <label><span>Status / حالت</span><select value={form.status} onChange={(event) => update("status", event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label.en} — {label.ur}</option>)}</select></label>
            <label><span>Total Budget (Rs.) / کل بجٹ</span><input type="number" min="0" value={form.budget} onChange={(event) => update("budget", event.target.value)} placeholder="0" /></label>
            <label><span>Completion % / تکمیل</span><input type="number" min="0" max="100" value={form.completionPercent} onChange={(event) => update("completionPercent", event.target.value)} /></label>
            <label><span>Start Date / آغاز</span><input type="date" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} /></label>
            <label><span>Expected Completion / متوقع تکمیل</span><input type="date" value={form.expectedCompletionDate} onChange={(event) => update("expectedCompletionDate", event.target.value)} /></label>
          </div>
          <button className="mosque-project-form__save" type="submit" disabled={saving || (!form.nameEn.trim() && !form.nameUr.trim())}>
            {saving ? "Saving..." : "Save & Open Project"}
          </button>
        </form>
      )}

      {message && <p className="mosque-projects__message">{message}</p>}

      <div className="mosque-projects__grid">
        {projects.map((project, index) => {
          const projectProfile = profiles[project.id] || {};
          const status = statusLabels[projectProfile.status || project.status || "proposed"] || statusLabels.proposed;
          const completion = Math.max(0, Math.min(100, Number(projectProfile.completionPercent) || 0));
          const budget = Math.max(0, Number(projectProfile.budget) || 0);
          const totals = totalsFor(transactions.filter((record) => record.systemId === project.id));
          return (
            <article className="mosque-project-card" key={project.id}>
              <div className="mosque-project-card__top">
                <span className="mosque-project-card__number">{String(index + 1).padStart(2, "0")}</span>
                <ProjectIcon project={project} size={38} />
                <b className={`mosque-project-card__status status-${projectProfile.status || project.status || "proposed"}`}>{ur ? status.ur : status.en}</b>
              </div>
              <h3>{getName(project)}</h3>
              <p>{getDescription(project)}</p>
              <div className="mosque-project-card__progress"><span style={{ width: `${completion}%` }} /></div>
              <div className="mosque-project-card__progress-label"><span>{ur ? "کام مکمل" : "Progress"}</span><b>{completion}%</b></div>
              <div className="mosque-project-card__figures">
                <span><small>{ur ? "بجٹ" : "Budget"}</small><b>Rs. {budget.toLocaleString()}</b></span>
                <span><small>{ur ? "عطیات" : "Donations"}</small><b>Rs. {totals.donations.toLocaleString()}</b></span>
                <span><small>{ur ? "اخراجات" : "Expenses"}</small><b>Rs. {totals.expenses.toLocaleString()}</b></span>
                <span><small>{ur ? "بیلنس" : "Balance"}</small><b>Rs. {totals.balance.toLocaleString()}</b></span>
              </div>
              <button type="button" onClick={() => onOpenSystem(project.id)}>
                {ur ? "پروجیکٹ کی مکمل تفصیل کھولیں" : "Open full project details"} <span>{ur ? "←" : "→"}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
