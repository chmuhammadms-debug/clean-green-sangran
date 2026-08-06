import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./VillageMap.css";

const CATEGORY_META = {
  mosque: { en: "Mosque", ur: "مسجد", icon: "🕌", color: "#168449" },
  cemetery: { en: "Cemetery", ur: "قبرستان", icon: "🌿", color: "#6f7d32" },
  plantation: { en: "Plantation", ur: "شجرکاری", icon: "🌳", color: "#4cc46f" },
  welfare: { en: "Welfare Project", ur: "فلاحی منصوبہ", icon: "🤝", color: "#e3a008" },
  infrastructure: { en: "Village Facility", ur: "گاؤں کی سہولت", icon: "📍", color: "#2563eb" },
  other: { en: "Other", ur: "دیگر", icon: "📌", color: "#64748b" },
};

const STATUS_LABELS = {
  active: { en: "Active", ur: "فعال" },
  planned: { en: "Planned", ur: "منصوبہ بند" },
  "in-progress": { en: "In Progress", ur: "کام جاری" },
  completed: { en: "Completed", ur: "مکمل" },
};

function validCoordinate(value, min, max) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= min && numeric <= max;
}

function cleanLocations(locations = []) {
  return locations.filter((location) => (
    location.enabled !== false
    && validCoordinate(location.lat, -90, 90)
    && validCoordinate(location.lng, -180, 180)
  ));
}

function averageCenter(locations) {
  if (!locations.length) return [32.262341, 75.166168];
  return [
    locations.reduce((sum, location) => sum + Number(location.lat), 0) / locations.length,
    locations.reduce((sum, location) => sum + Number(location.lng), 0) / locations.length,
  ];
}

function MapViewport({ locations, location }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.setView([Number(location.lat), Number(location.lng)], 17, { animate: true });
      return;
    }
    if (locations.length === 1) {
      map.setView([Number(locations[0].lat), Number(locations[0].lng)], 16, { animate: true });
      return;
    }
    if (locations.length > 1) {
      map.fitBounds(locations.map((item) => [Number(item.lat), Number(item.lng)]), { padding: [35, 35], maxZoom: 16, animate: true });
    }
  }, [location, locations, map]);
  return null;
}

function locationName(location, ur) {
  return ur
    ? (location.nameUr || location.nameEn || "مقام")
    : (location.nameEn || location.nameUr || "Location");
}

function locationDetails(location, ur) {
  return ur
    ? (location.detailsUr || location.detailsEn || "")
    : (location.detailsEn || location.detailsUr || "");
}

export default function VillageMapSection({ locations = [], language = "en" }) {
  const ur = language === "ur";
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("");
  const publicLocations = useMemo(() => cleanLocations(locations), [locations]);
  const filtered = useMemo(() => (
    filter === "all"
      ? publicLocations
      : publicLocations.filter((location) => location.category === filter)
  ), [filter, publicLocations]);
  const selected = filtered.find((location) => location.id === selectedId) || null;
  const center = averageCenter(publicLocations);
  const categories = ["all", ...Object.keys(CATEGORY_META).filter((category) => publicLocations.some((location) => location.category === category))];

  return (
    <section className="village-map-section" id="village-map" dir={ur ? "rtl" : "ltr"}>
      <div className="content-section">
        <div className="section-heading reveal village-map-heading">
          <div>
            <span className="section-kicker">{ur ? "ڈیجیٹل سنگراں" : "EXPLORE SANGRAN"}</span>
            <h2>{ur ? "گاؤں کا انٹرایکٹو نقشہ" : <>Interactive<br />Village Map.</>}</h2>
          </div>
          <p>{ur
            ? "مساجد، قبرستان، شجرکاری اور فلاحی منصوبوں کی تصدیق شدہ جگہیں ایک نقشے پر دیکھیں۔"
            : "Explore verified locations for mosques, the cemetery, plantation areas and community projects."}</p>
        </div>

        {publicLocations.length > 0 && (
          <div className="village-map-filters" role="group" aria-label={ur ? "مقام کی قسم" : "Location categories"}>
            {categories.map((category) => {
              const meta = CATEGORY_META[category];
              const label = category === "all" ? (ur ? "تمام مقامات" : "All locations") : (ur ? meta.ur : meta.en);
              return <button type="button" className={filter === category ? "active" : ""} key={category} onClick={() => { setFilter(category); setSelectedId(""); }}>{category === "all" ? "⌖" : meta.icon} {label}</button>;
            })}
          </div>
        )}

        <div className="village-map-layout">
          <div className="village-map-canvas" aria-label={ur ? "سنگراں کا نقشہ" : "Map of Sangran"}>
            <MapContainer center={center} zoom={publicLocations.length ? 15 : 11} scrollWheelZoom={false} className="village-leaflet-map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport locations={filtered} location={selected} />
              {filtered.map((location) => {
                const meta = CATEGORY_META[location.category] || CATEGORY_META.other;
                const status = STATUS_LABELS[location.status] || STATUS_LABELS.active;
                return (
                  <CircleMarker
                    center={[Number(location.lat), Number(location.lng)]}
                    pathOptions={{ color: "#fff", fillColor: meta.color, fillOpacity: 1, weight: 3 }}
                    radius={11}
                    key={location.id}
                    eventHandlers={{ click: () => setSelectedId(location.id) }}
                  >
                    <Popup minWidth={230}>
                      <article className="village-map-popup" dir={ur ? "rtl" : "ltr"}>
                        {location.imageUrl && <img src={location.imageUrl} alt={locationName(location, ur)} />}
                        <span>{meta.icon} {ur ? meta.ur : meta.en}</span>
                        <h3>{locationName(location, ur)}</h3>
                        <p>{locationDetails(location, ur)}</p>
                        <b>{ur ? status.ur : status.en}</b>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${Number(location.lat)},${Number(location.lng)}`} target="_blank" rel="noreferrer">{ur ? "راستہ دیکھیں" : "Get directions"} ↗</a>
                      </article>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            {!publicLocations.length && (
              <div className="village-map-empty">
                <span>📍</span>
                <strong>{ur ? "مقامات شامل کیے جا رہے ہیں" : "Verified locations are being added"}</strong>
                <p>{ur ? "کمیٹی ایڈمن درست GPS کے ساتھ مقامات Publish کرے گا۔" : "Committee admins will publish locations with exact GPS coordinates."}</p>
              </div>
            )}
          </div>

          <div className="village-map-list">
            {filtered.map((location) => {
              const meta = CATEGORY_META[location.category] || CATEGORY_META.other;
              const status = STATUS_LABELS[location.status] || STATUS_LABELS.active;
              return (
                <button type="button" className={selectedId === location.id ? "village-map-card active" : "village-map-card"} key={`card-${location.id}`} onClick={() => setSelectedId(location.id)}>
                  {location.imageUrl ? <img src={location.imageUrl} alt="" /> : <span className="village-map-card__icon" style={{ background: meta.color }}>{meta.icon}</span>}
                  <span className="village-map-card__copy">
                    <small>{ur ? meta.ur : meta.en}</small>
                    <strong>{locationName(location, ur)}</strong>
                    <em>{ur ? status.ur : status.en}</em>
                  </span>
                  <span className="village-map-card__arrow">{ur ? "←" : "→"}</span>
                </button>
              );
            })}
            {!filtered.length && publicLocations.length > 0 && <p className="village-map-list__empty">{ur ? "اس قسم کا کوئی مقام ابھی شامل نہیں۔" : "No verified location in this category yet."}</p>}
            {!publicLocations.length && (
              <div className="village-map-guide">
                <b>{ur ? "نقشے میں کیا شامل ہوگا؟" : "What will appear here?"}</b>
                <span>🕌 {ur ? "مساجد" : "Mosques"}</span>
                <span>🌿 {ur ? "قبرستان" : "Cemetery"}</span>
                <span>🌳 {ur ? "شجرکاری" : "Plantation areas"}</span>
                <span>🤝 {ur ? "فلاحی و جاری منصوبے" : "Welfare & ongoing projects"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
