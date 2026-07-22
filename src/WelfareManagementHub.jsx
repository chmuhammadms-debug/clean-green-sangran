import ProjectIcon from "./ProjectIcon";
import { welfareChildSystems } from "./welfareManagement";
import "./WelfareManagementHub.css";

function totalsFor(records) {
  const donations = records
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return { donations, expenses, balance: donations - expenses };
}

export default function WelfareManagementHub({
  systems,
  transactions,
  onOpenSystem,
  language = "en",
  getName = (system) => system.name,
  getDescription = (system) => system.description,
  adminMode = false,
}) {
  const ur = language === "ur";
  const projects = welfareChildSystems(systems);

  return (
    <section className="welfare-hub" dir={ur ? "rtl" : "ltr"}>
      <div className="welfare-hub__heading">
        <div>
          <span>{ur ? "خدمت، صحت اور مثبت سرگرمیاں" : "CARE • HEALTH • OPPORTUNITY"}</span>
          <h2>{ur ? "فلاحی منصوبہ منتخب کریں" : "Select a welfare project"}</h2>
          <p>{ur
            ? "ہر فلاحی منصوبے کے عطیات، اخراجات، تصاویر، رسیدیں اور عوامی رپورٹ الگ اور شفاف رکھی جائے گی۔"
            : "Every welfare initiative has its own transparent donations, expenses, photos, receipts and public report."}</p>
        </div>
        <div className="welfare-hub__count"><strong>{projects.length}</strong><small>{ur ? "منصوبے" : "PROJECTS"}</small></div>
      </div>

      {adminMode && (
        <div className="welfare-hub__admin-note">
          <b>Admin control:</b> Project Manager سے ہر فلاحی منصوبے کا نام، تعارف، آئیکن، کور، گیلری اور Public حالت تبدیل کی جاسکتی ہے۔
        </div>
      )}

      <div className="welfare-hub__grid">
        {projects.map((project, index) => {
          const totals = totalsFor(transactions.filter((record) => record.systemId === project.id));
          return (
            <article className="welfare-account-card" key={project.id}>
              <div className="welfare-account-card__top">
                <span className="welfare-account-card__number">0{index + 1}</span>
                <ProjectIcon project={project} size={46} />
              </div>
              <h3>{getName(project)}</h3>
              <p>{getDescription(project)}</p>
              <div className="welfare-account-card__stats">
                <span><small>{ur ? "عطیات" : "Donations"}</small><b>Rs. {totals.donations.toLocaleString()}</b></span>
                <span><small>{ur ? "اخراجات" : "Expenses"}</small><b>Rs. {totals.expenses.toLocaleString()}</b></span>
                <span><small>{ur ? "بیلنس" : "Balance"}</small><b>Rs. {totals.balance.toLocaleString()}</b></span>
              </div>
              <button type="button" onClick={() => onOpenSystem(project.id)}>
                {ur ? "منصوبے کا مکمل حساب کھولیں" : "Open project account"} <span>{ur ? "←" : "→"}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
