import { useState } from "react";
import ProjectIcon from "./ProjectIcon";
import { recordsForProject, workItemsFor } from "./workItems";
import "./WorkItemsHub.css";

const emptyWork = { name: "", description: "", budget: "" };

function totalsFor(records) {
  const donations = records
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return { donations, expenses, balance: donations - expenses };
}

export default function WorkItemsHub({
  project,
  systems,
  transactions,
  profiles = {},
  onOpenSystem,
  onCreateWork,
  language = "en",
  getName = (system) => system.name,
  getDescription = (system) => system.description,
  adminMode = false,
}) {
  const ur = language === "ur";
  const works = workItemsFor(systems, project.id, profiles);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyWork);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!adminMode && !works.length) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !onCreateWork) return;
    setSaving(true);
    setMessage("");
    try {
      await onCreateWork(project.id, form);
      setForm(emptyWork);
      setShowForm(false);
      setMessage("نیا کام محفوظ ہوگیا ہے۔");
    } catch (error) {
      setMessage(`کام محفوظ نہیں ہوسکا: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="work-items" dir={ur ? "rtl" : "ltr"}>
      <div className="work-items__heading">
        <div>
          <span>{ur ? "ہر کام کا الگ حساب" : "SEPARATE WORK • SEPARATE LEDGER"}</span>
          <h2>{ur ? "اس منصوبے کے کام" : "Work inside this project"}</h2>
          <p>{ur
            ? "ضرورت کے مطابق نیا کام بنائیں۔ ہر کام کی اپنی تفصیل، جمع رقم، خرچ اور بقایا الگ محفوظ ہوگا۔"
            : "Create work only when needed. Each work item keeps its own details, money received, expenses and balance."}</p>
        </div>
        {adminMode && (
          <button type="button" className="work-items__add" onClick={() => setShowForm((current) => !current)}>
            {showForm ? (ur ? "فارم بند کریں" : "Close form") : (ur ? "+ نیا کام" : "+ New Work")}
          </button>
        )}
      </div>

      {adminMode && showForm && (
        <form className="work-items__form" onSubmit={submit}>
          <label>
            <span>کام کا نام / Work name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="مثلاً: ٹائلز کا کام"
              required
            />
          </label>
          <label>
            <span>کام کی تفصیل / Work details</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="اس کام کی مکمل تفصیل لکھیں"
            />
          </label>
          <label>
            <span>کام کا بجٹ / Work Budget (Rs.)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={form.budget}
              onChange={(event) => setForm((current) => ({ ...current, budget: event.target.value }))}
              placeholder="0"
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save New Work"}
          </button>
        </form>
      )}

      {message && <p className="work-items__message">{message}</p>}

      <div className="work-items__grid">
        {works.map((work, index) => {
          const totals = totalsFor(recordsForProject(transactions, systems, work.id, profiles));
          const budget = Math.max(0, Number(profiles?.[work.id]?.budget) || 0);
          return (
            <article className="work-item-card" key={work.id}>
              <div className="work-item-card__top">
                <span>0{index + 1}</span>
                <ProjectIcon project={work} size={34} />
              </div>
              <h3>{getName(work)}</h3>
              <p>{getDescription(work) || (ur ? "اس کام کی تفصیل ابھی شامل نہیں کی گئی۔" : "No work details added yet.")}</p>
              <div className="work-item-card__stats">
                <span><small>{ur ? "بجٹ" : "Budget"}</small><b>Rs. {budget.toLocaleString()}</b></span>
                <span><small>{ur ? "جمع رقم" : "Received"}</small><b>Rs. {totals.donations.toLocaleString()}</b></span>
                <span><small>{ur ? "خرچ" : "Spent"}</small><b>Rs. {totals.expenses.toLocaleString()}</b></span>
                <span><small>{ur ? "بقایا" : "Balance"}</small><b>Rs. {totals.balance.toLocaleString()}</b></span>
              </div>
              <button type="button" onClick={() => onOpenSystem(work.id)}>
                {adminMode
                  ? (ur ? "کام کا حساب کھولیں" : "Open work ledger")
                  : (ur ? "کام کا ریکارڈ دیکھیں" : "View work record")}
              </button>
            </article>
          );
        })}
        {!works.length && (
          <div className="work-items__empty">
            {ur ? "ابھی اس منصوبے میں کوئی الگ کام شامل نہیں کیا گیا۔" : "No separate work has been added to this project yet."}
          </div>
        )}
      </div>
    </section>
  );
}
