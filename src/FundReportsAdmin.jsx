import { useState } from "react";
import { useFundReports } from "./fundReports";

const pakistanDate = () => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit",
}).format(new Date());

export default function FundReportsAdmin() {
  const { reports, loaded, loadError, saveReport } = useFundReports();
  const [date, setDate] = useState(pakistanDate);
  const [month, setMonth] = useState(() => pakistanDate().slice(0, 7));
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const visibleReports = reports.filter((report) => report.date.startsWith(month));
  const existing = reports.some((report) => report.date === date);

  function selectMonth(value) {
    if (!value) return;
    setMonth(value);
    setDate(`${value}-01`);
  }

  async function submit(event) {
    event.preventDefault();
    if (!file || !date) return;
    const form = event.currentTarget;
    if (await apply(date, file)) {
      form.reset();
      setFile(null);
      setMonth(date.slice(0, 7));
    }
  }

  async function apply(reportDate, image) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await saveReport(reportDate, image);
      setMessage(image ? "رپورٹ ویب سائٹ پر محفوظ ہو گئی۔" : "رپورٹ ماہانہ ریکارڈ سے ہٹا دی گئی۔");
      return true;
    } catch (failure) {
      setError(failure.message || "تبدیلی محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function remove(reportDate) {
    if (window.confirm(`${reportDate} کی رپورٹ ماہانہ ریکارڈ سے ہٹا دیں؟`)) {
      apply(reportDate, null);
    }
  }

  return (
    <section dir="rtl" className="fund-report-admin">
      <label>
        مہینہ
        <input type="month" value={month} onChange={(event) => selectMonth(event.target.value)} disabled={saving} />
      </label>
      <form onSubmit={submit}>
        <label>
          رپورٹ کی تاریخ
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required disabled={saving} />
        </label>
        <label>
          رپورٹ کی تصویر
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files[0] || null)} required disabled={saving} />
        </label>
        <button type="submit" disabled={!loaded || saving || !file || !date}>
          {existing ? "رپورٹ بدلیں" : "رپورٹ لگائیں"}
        </button>
      </form>
      {saving && <p role="status">تبدیلی محفوظ ہو رہی ہے…</p>}
      {message && <p role="status">{message}</p>}
      {(error || loadError) && <p role="alert">{error || `رپورٹوں کا ریکارڈ لوڈ نہیں ہو سکا۔ ${loadError}`}</p>}
      {loaded && !visibleReports.length && <p>اس مہینے کی کوئی رپورٹ موجود نہیں۔</p>}
      <ul>
        {visibleReports.map((report) => (
          <li key={report.id}>
            <a href={report.url} target="_blank" rel="noreferrer"><time dateTime={report.date}>{report.date}</time> — رپورٹ کھولیں</a>
            <button type="button" onClick={() => setDate(report.date)} disabled={saving}>بدلنے کے لیے منتخب کریں</button>
            <button type="button" onClick={() => remove(report.date)} disabled={saving || !loaded}>ہٹائیں</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
