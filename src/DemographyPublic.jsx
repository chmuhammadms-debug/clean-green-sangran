import { useEffect, useState } from "react";
import { fetchPublicCensusSummary } from "./demographyService";
import "./Demography.css";

const n = (value) => Number(value || 0).toLocaleString("en-PK");

export default function DemographyPublic({ language = "en" }) {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const ur = language === "ur";

  useEffect(() => {
    let active = true;
    fetchPublicCensusSummary()
      .then((data) => active && setSummary(data))
      .catch((err) => active && setError(err.message || "Unable to load census summary."));
    return () => { active = false; };
  }, []);

  if (error) return <div className="census-state census-error">{error}</div>;
  if (!summary) return <div className="census-state">{ur ? "مردم شماری کا ریکارڈ لوڈ ہو رہا ہے…" : "Loading population census…"}</div>;

  const cards = [
    ["🏠", ur ? "کل گھرانے" : "Households", summary.households],
    ["👥", ur ? "کل آبادی" : "Total Population", summary.total_population],
    ["👨", ur ? "بالغ مرد" : "Adult Men", summary.adult_men],
    ["👩", ur ? "بالغ خواتین" : "Adult Women", summary.adult_women],
    ["🧒", ur ? "بچے" : "Children", summary.children],
    ["🗳️", ur ? "رجسٹرڈ ووٹرز" : "Registered Voters", summary.registered_voters],
    ["👵", ur ? "بزرگ شہری" : "Senior Citizens", summary.senior_citizens],
    ["🌍", ur ? "بیرونِ ملک افراد" : "Overseas Residents", summary.overseas_residents],
  ];

  const areas = Array.isArray(summary.mohalla_breakdown) ? summary.mohalla_breakdown : [];
  const empty = Number(summary.households || 0) === 0;

  return (
    <section className="census-public" dir={ur ? "rtl" : "ltr"}>
      <div className="census-heading">
        <div>
          <span className="census-kicker">{ur ? "سانگراں مردم شماری" : "SANGRAN POPULATION CENSUS"}</span>
          <h2>{ur ? "آبادی اور گھرانوں کا خلاصہ" : "Population & Household Overview"}</h2>
          <p>{ur ? "تصدیق شدہ گھرانوں سے خودکار طور پر تیار کردہ مجموعی اعداد۔" : "Live aggregate statistics generated from verified household records."}</p>
        </div>
        <div className="census-privacy">🔒 {ur ? "ذاتی معلومات عوامی صفحے پر ظاہر نہیں کی جاتیں" : "Personal household details stay private"}</div>
      </div>

      <div className="census-stat-grid">
        {cards.map(([icon, label, value]) => (
          <article className="census-stat-card" key={label}>
            <span>{icon}</span>
            <strong>{n(value)}</strong>
            <p>{label}</p>
          </article>
        ))}
      </div>

      {empty ? (
        <div className="census-empty">
          <span>📋</span>
          <h3>{ur ? "مردم شماری کا نظام تیار ہے" : "Population census system is ready"}</h3>
          <p>{ur ? "ایڈمن پینل سے گھرانوں کا ریکارڈ شامل کریں؛ یہاں صرف مجموعی تعداد نظر آئے گی۔" : "Add household records from the admin panel. Only aggregate totals will appear here."}</p>
        </div>
      ) : null}

      {areas.length > 0 ? (
        <div className="census-area-block">
          <h3>{ur ? "محلہ وار خلاصہ" : "Area-wise Summary"}</h3>
          <div className="census-area-grid">
            {areas.map((area) => (
              <div className="census-area-card" key={area.mohalla}>
                <strong>{area.mohalla || (ur ? "دیگر" : "Other")}</strong>
                <span>{n(area.households)} {ur ? "گھرانے" : "households"}</span>
                <b>{n(area.population)} {ur ? "افراد" : "people"}</b>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
