import { useMemo, useState } from "react";
import { SPORTS } from "./WelfareOperationsPanel";
import "./WelfareOperations.css";

const TITLES = {
  "welfare-filtration": { en: "Water Quality & Maintenance Log", ur: "پانی معیار اور دیکھ بھال ریکارڈ" },
  "welfare-sports": { en: "Sports, Tournaments & Community Melas", ur: "کھیل، ٹورنامنٹ اور اجتماعی میلے" },
};

export default function WelfareOperationsPublic({ projectId, settings, language = "en" }) {
  const records = Array.isArray(settings?.welfareOperationsByProject?.[projectId])
    ? settings.welfareOperationsByProject[projectId]
    : [];
  const title = TITLES[projectId];
  const sportsMode = projectId === "welfare-sports";
  const [activeSport, setActiveSport] = useState("all");
  const ur = language === "ur";
  const visibleRecords = useMemo(
    () => !sportsMode || activeSport === "all" ? records : records.filter((record) => record.sport === activeSport),
    [records, activeSport, sportsMode],
  );
  if (!title) return null;

  return (
    <section className={`welfare-operations welfare-operations--public ${sportsMode ? "sports-public-hub" : ""}`} dir={ur ? "rtl" : "ltr"}>
      <div className="welfare-operations__heading"><div><span>{ur ? "تازہ ترین عملی ریکارڈ" : "LATEST OPERATIONS"}</span><h2>{ur ? title.ur : title.en}</h2><p>{ur ? "ہر کھیل کے ٹورنامنٹس، میچز، ٹیمیں، نتائج، تصاویر اور ویڈیوز ایک جگہ۔" : "Tournaments, matches, teams, results, photos and videos for every sport—all in one place."}</p></div><b>{records.length}</b></div>

      {sportsMode && <div className="sports-public-categories">
        <button type="button" className={activeSport === "all" ? "active" : ""} onClick={() => setActiveSport("all")}><span>🏆</span><b>{ur ? "تمام کھیل" : "All Sports"}</b><small>{records.length} {ur ? "ریکارڈ" : "records"}</small></button>
        {SPORTS.map((sport) => {
          const count = records.filter((record) => record.sport === sport.id).length;
          return <button type="button" key={sport.id} className={activeSport === sport.id ? "active" : ""} onClick={() => setActiveSport(sport.id)}><span>{sport.icon}</span><b>{ur ? sport.ur : sport.en}</b><small>{count} {ur ? "ایونٹس" : "events"}</small></button>;
        })}
      </div>}

      <div className="welfare-operations__records sports-public-records">
        {visibleRecords.slice(0, sportsMode ? 30 : 8).map((record) => {
          const sport = SPORTS.find((entry) => entry.id === record.sport);
          return <article key={record.id}>
            <div><span>{sport ? `${sport.icon} ${ur ? sport.ur : sport.en} • ${record.category}` : record.category}</span><small>{record.status}</small></div>
            <h3>{record.title}</h3>
            {sportsMode && <div className="sports-record-facts">{record.venue && <b>📍 {record.venue}</b>}{record.teams && <b>👥 {record.teams}</b>}{record.result && <b>🏆 {record.result}</b>}</div>}
            <p>{record.details || (ur ? "مزید تفصیل شامل نہیں۔" : "No additional details.")}</p>
            {Array.isArray(record.media) && record.media.length > 0 && <div className="sports-record-media">{record.media.map((asset, index) => asset.type === "video" ? <video key={index} src={asset.url} controls playsInline /> : <a key={index} href={asset.url} target="_blank" rel="noreferrer"><img src={asset.url} alt={record.title} /></a>)}</div>}
            <footer><time>{record.date}</time>{record.nextDue && <em>{ur ? "اگلی تاریخ:" : "Next:"} {record.nextDue}</em>}</footer>
          </article>;
        })}
        {!visibleRecords.length && <p className="welfare-operations__empty">{ur ? "اس کھیل کا پہلا ٹورنامنٹ، میچ یا میلہ جلد شامل کیا جائے گا۔" : "The first tournament, match or sports mela for this sport will appear here."}</p>}
      </div>
    </section>
  );
}
