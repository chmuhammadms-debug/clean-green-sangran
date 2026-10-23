import { isCemeterySalary } from "./cemeterySalary";
import { useState } from "react";
import { recordsForProject, workItemsFor } from "./workItems";
import "./WorkItemsHub.css";

const emptyWork = { name: "", description: "" };

function totalsFor(records) {
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return { expenses };
}

export default function WorkItemsHub({
  project,
  systems,
  transactions,
  profiles = {},
  onOpenSystem,
  onCreateWork,
  onDeleteWork,
  language = "en",
  getName = (system) => language === "ur" ? system.nameUr || system.name : system.name,
  getDescription = (system) => system.description,
  adminMode = false,
}) {
  const ur = language === "ur";
  const works = workItemsFor(systems, project.id, profiles);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyWork);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
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

  const removeWork = async (work) => {
    if (!onDeleteWork) return;
    const relatedRecords = transactions.filter(
      (record) => String(record.systemId) === String(work.id)
    );

    if (relatedRecords.length) {
      setMessage(ur
        ? `اس کام میں ${relatedRecords.length} مالی ریکارڈ موجود ہیں۔ حساب محفوظ رکھنے کے لیے پہلے وہ ریکارڈ حذف یا منتقل کریں۔`
        : `This work has ${relatedRecords.length} financial record(s). Delete or move those records first so the accounts remain safe.`);
      return;
    }

    const confirmed = window.confirm(
      `Permanently delete the empty work "${getName(work)}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(String(work.id));
    setMessage("");
    try {
      await onDeleteWork(work);
      setMessage(ur ? "کام مستقل طور پر حذف ہوگیا ہے۔" : "Work permanently deleted.");
    } catch (error) {
      setMessage(`${ur ? "کام حذف نہیں ہوسکا" : "Work could not be deleted"}: ${error.message}`);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="work-items" dir={ur ? "rtl" : "ltr"}>
      <div className="work-items__heading">
        <div>
          <span>{ur ? "ہر کام کا الگ حساب" : "SEPARATE WORK • SEPARATE LEDGER"}</span>
          <h2>{ur ? "اس منصوبے کے کام" : "Work inside this project"}</h2>
          <p>{ur
            ? "ہر کام کی تفصیل، بل اور کل خرچ الگ دیکھیں۔"
            : "View the details, bills and total expenses for each work item."}</p>
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
              placeholder="مثلاً: جالی کا کام یا جنازہ گاہ کی مرمت"
              required
            />
          </label>
          <label>
            <span>کام کی تفصیل / Work details</span>
            <textarea
              rows="4"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="صرف کام کا مختصر تعارف؛ بل اور مزدوری اگلے صفحے پر الگ شامل کریں"
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? "محفوظ ہو رہا ہے…" : "کام بنائیں اور اس کے بل شامل کریں"}
          </button>
        </form>
      )}

      {message && <p className="work-items__message">{message}</p>}

      <div className="work-items__grid">
        {works.map((work) => {
          const totals = totalsFor(recordsForProject(transactions, systems, work.id, profiles));
          return (
            <article className="work-item-compact" key={work.id}>
              <button type="button" className="work-item-compact__open" onClick={() => onOpenSystem(work.id)} aria-label={`${getName(work)} — ${ur ? "مکمل ریکارڈ کھولیں" : "Open complete record"}`}>
                <strong>{getName(work)}</strong>
                <span className="work-item-compact__amount">{ur ? "کل خرچ" : "Total expenses"}: Rs. {totals.expenses.toLocaleString()}</span>
                <span aria-hidden="true">{ur ? "←" : "→"}</span>
              </button>
                {adminMode && onDeleteWork && !isCemeterySalary(work) && (
                  <button
                    type="button"
                    className="work-item-compact__delete"
                    disabled={deletingId === String(work.id)}
                    onClick={() => removeWork(work)}
                  >
                    {deletingId === String(work.id)
                      ? (ur ? "حذف ہو رہا ہے…" : "Deleting…")
                      : (ur ? "کام حذف کریں" : "Delete Work")}
                  </button>
                )}
              {profiles[work.id]?.status === "completed" && <p className="work-item-compact__completed">✓ {ur ? "مکمل" : "Completed"}</p>}
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
