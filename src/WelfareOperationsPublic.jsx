import "./WelfareOperations.css";

const TITLES = {
  "welfare-filtration": { en: "Water Quality & Maintenance Log", ur: "پانی معیار اور دیکھ بھال ریکارڈ" },
  "welfare-sports": { en: "Sports Activities & Results", ur: "کھیلوں کی سرگرمیاں اور نتائج" },
};

export default function WelfareOperationsPublic({ projectId, settings, language = "en" }) {
  const records = Array.isArray(settings?.welfareOperationsByProject?.[projectId])
    ? settings.welfareOperationsByProject[projectId]
    : [];
  const title = TITLES[projectId];
  if (!title) return null;
  const ur = language === "ur";
  return (
    <section className="welfare-operations welfare-operations--public" dir={ur ? "rtl" : "ltr"}>
      <div className="welfare-operations__heading"><div><span>{ur ? "تازہ ترین عملی ریکارڈ" : "LATEST OPERATIONS"}</span><h2>{ur ? title.ur : title.en}</h2><p>{ur ? "منصوبے کی تازہ سرگرمیاں عوام کے لیے شفاف انداز میں۔" : "Latest project activity, shared transparently with the community."}</p></div><b>{records.length}</b></div>
      <div className="welfare-operations__records">
        {records.slice(0, 8).map((record) => <article key={record.id}>
          <div><span>{record.category}</span><small>{record.status}</small></div>
          <h3>{record.title}</h3><p>{record.details || (ur ? "مزید تفصیل شامل نہیں۔" : "No additional details.")}</p>
          <footer><time>{record.date}</time>{record.nextDue && <em>{ur ? "اگلی تاریخ:" : "Next:"} {record.nextDue}</em>}</footer>
        </article>)}
        {!records.length && <p className="welfare-operations__empty">{ur ? "پہلا عملی ریکارڈ جلد شامل کیا جائے گا۔" : "The first operational record will be published soon."}</p>}
      </div>
    </section>
  );
}
