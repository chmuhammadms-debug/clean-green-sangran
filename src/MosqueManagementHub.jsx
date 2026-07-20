import ProjectIcon from "./ProjectIcon";
import { mosqueChildSystems } from "./mosqueManagement";
import "./MosqueManagementHub.css";

function totalsFor(records) {
  const donations = records
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expenses = records
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return { donations, expenses, balance: donations - expenses };
}

export default function MosqueManagementHub({
  systems,
  transactions,
  onOpenSystem,
  language = "en",
  getName = (system) => system.name,
  getDescription = (system) => system.description,
  adminMode = false,
}) {
  const ur = language === "ur";
  const mosques = mosqueChildSystems(systems);

  return (
    <section className="mosque-hub" dir={ur ? "rtl" : "ltr"}>
      <div className="mosque-hub__heading">
        <div>
          <span>{ur ? "چار مساجد، چار الگ شفاف حساب" : "FOUR MOSQUES • FOUR SEPARATE ACCOUNTS"}</span>
          <h2>{ur ? "اپنی مسجد منتخب کریں" : "Select a mosque account"}</h2>
          <p>{ur
            ? "ہر مسجد کے عطیات، اخراجات، رسیدیں، ڈونر ریکارڈ اور رپورٹس مکمل طور پر الگ محفوظ ہوں گی۔"
            : "Each mosque has its own donations, expenses, receipts, donor history and reports."}</p>
        </div>
        <div className="mosque-hub__count"><strong>{mosques.length}</strong><small>{ur ? "مساجد" : "MOSQUES"}</small></div>
      </div>

      {adminMode && (
        <div className="mosque-hub__admin-note">
          <b>Admin control:</b> Project Manager میں ہر مسجد کا English/Urdu نام، تعارف، آئیکن، کور اور گیلری تبدیل کی جاسکتی ہے۔
        </div>
      )}

      <div className="mosque-hub__grid">
        {mosques.map((mosque, index) => {
          const totals = totalsFor(transactions.filter((record) => record.systemId === mosque.id));
          return (
            <article className="mosque-account-card" key={mosque.id}>
              <div className="mosque-account-card__top">
                <span className="mosque-account-card__number">0{index + 1}</span>
                <ProjectIcon project={mosque} size={42} />
              </div>
              <h3>{getName(mosque)}</h3>
              <p>{getDescription(mosque)}</p>
              <div className="mosque-account-card__stats">
                <span><small>{ur ? "عطیات" : "Donations"}</small><b>Rs. {totals.donations.toLocaleString()}</b></span>
                <span><small>{ur ? "اخراجات" : "Expenses"}</small><b>Rs. {totals.expenses.toLocaleString()}</b></span>
                <span><small>{ur ? "بیلنس" : "Balance"}</small><b>Rs. {totals.balance.toLocaleString()}</b></span>
              </div>
              <button type="button" onClick={() => onOpenSystem(mosque.id)}>
                {ur ? "مسجد کا مکمل حساب کھولیں" : "Open mosque account"} <span>{ur ? "←" : "→"}</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
