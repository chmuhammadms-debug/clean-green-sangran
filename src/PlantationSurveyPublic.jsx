import { useEffect, useMemo, useState } from "react";
import "./PlantationSurveyPublic.css";
import { supabase } from "./supabase";
import { fetchPublicPlantationStats } from "./plantationSurveyService";

const emptyStats = { households: 0, total_plants: 0, species: [], categories: [], updated_at: null };

export default function PlantationSurveyPublic({ language = "english" }) {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const ur = language === "urdu";

  const load = async () => {
    try {
      setStats(await fetchPublicPlantationStats());
      setError("");
    } catch {
      setError(ur ? "گاؤں کا شجرکاری سروے ابھی دستیاب نہیں۔" : "The village plantation survey is not available yet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refreshTimer = window.setInterval(load, 30000);
    const channel = supabase
      .channel("public-plantation-survey")
      .on("postgres_changes", { event: "*", schema: "public", table: "plantation_households" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "plantation_plants" }, load)
      .subscribe();
    return () => {
      window.clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [language]);

  const topQuantity = useMemo(() => Math.max(1, ...stats.species.map((item) => Number(item.quantity) || 0)), [stats.species]);

  return (
    <section className={`plantation-public-survey ${ur ? "is-urdu" : ""}`}>
      <div className="plantation-public-survey__heading">
        <div><span>{ur ? "گاؤں بھر کا شجرکاری سروے" : "VILLAGE-WIDE PLANTATION SURVEY"}</span><h2>{ur ? "سنگراں کے گھروں میں موجود پودے" : "Plants growing across Sangran homes"}</h2></div>
        <p>{ur ? "ذاتی معلومات ظاہر کیے بغیر گھروں، پودوں اور اقسام کا شفاف مجموعی ریکارڈ۔" : "A transparent village total without displaying any household's private contact information."}</p>
      </div>

      <div className="plantation-public-survey__stats">
        <article><span>{ur ? "سروے شدہ گھر" : "Homes surveyed"}</span><b>{stats.households.toLocaleString()}</b></article>
        <article><span>{ur ? "کل پودے" : "Total plants"}</span><b>{stats.total_plants.toLocaleString()}</b></article>
        <article><span>{ur ? "پودوں کی اقسام" : "Plant species"}</span><b>{stats.species.length.toLocaleString()}</b></article>
      </div>

      {loading ? <p className="plantation-public-survey__empty">{ur ? "سروے لوڈ ہو رہا ہے…" : "Loading survey…"}</p> : error ? <p className="plantation-public-survey__empty">{error}</p> : stats.species.length ? (
        <div className="plantation-public-species">
          <div className="plantation-public-species__title"><b>{ur ? "اقسام کے لحاظ سے تعداد" : "Quantity by plant species"}</b><span>{ur ? "لائیو مجموعی اعداد" : "Live village totals"}</span></div>
          <div className="plantation-public-species__grid">
            {stats.species.map((item) => (
              <article key={item.name}>
                <div><b>{item.name}</b><strong>{Number(item.quantity).toLocaleString()}</strong></div>
                <span><i style={{ width: `${Math.max(7, (Number(item.quantity) / topQuantity) * 100)}%` }} /></span>
              </article>
            ))}
          </div>
        </div>
      ) : <p className="plantation-public-survey__empty">{ur ? "پہلا گھر شامل ہوتے ہی یہاں مجموعی سروے دکھائی دے گا۔" : "Village totals will appear here after the first household is surveyed."}</p>}

      {stats.updated_at && <small className="plantation-public-survey__updated">{ur ? "آخری اپڈیٹ" : "Last updated"}: {new Date(stats.updated_at).toLocaleDateString(ur ? "ur-PK" : "en-PK")}</small>}
    </section>
  );
}
