import { useState } from "react";
import { uploadWebsiteImage } from "./mediaUpload";
import "./VillageMap.css";

const EMPTY_LOCATION = {
  nameEn: "",
  nameUr: "",
  category: "mosque",
  status: "active",
  lat: "",
  lng: "",
  detailsEn: "",
  detailsUr: "",
  imageUrl: "",
  enabled: true,
};

export default function VillageMapSettings({ locations = [], onChange }) {
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const addLocation = () => onChange([
    ...locations,
    { ...EMPTY_LOCATION, id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
  ]);

  const updateLocation = (id, key, value) => onChange(locations.map((location) => (
    location.id === id ? { ...location, [key]: value } : location
  )));

  const removeLocation = (id) => onChange(locations.filter((location) => location.id !== id));

  const useCurrentLocation = (id) => {
    setMessage("");
    if (!navigator.geolocation) {
      setMessage("Is device par GPS location available nahi hai.");
      return;
    }
    setBusyId(`${id}-gps`);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onChange(locations.map((location) => location.id === id ? {
          ...location,
          lat: coords.latitude.toFixed(7),
          lng: coords.longitude.toFixed(7),
        } : location));
        setBusyId("");
        setMessage("GPS location mil gayi. Ab neeche Save & Publish Changes dabayein.");
      },
      (error) => {
        setBusyId("");
        setMessage(`GPS location nahi mili: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const uploadPhoto = async (id, file) => {
    if (!file) return;
    setBusyId(`${id}-photo`);
    setMessage("");
    try {
      const uploaded = await uploadWebsiteImage(file, `village-map/${id}`);
      updateLocation(id, "imageUrl", uploaded.url);
      setMessage("Location photo upload ho gayi. Ab Save & Publish Changes dabayein.");
    } catch (error) {
      setMessage(`Photo upload nahi hui: ${error.message}`);
    } finally {
      setBusyId("");
    }
  };

  return (
    <section className="map-admin-settings">
      <div className="settings-heading map-admin-settings__heading">
        <div><span>VILLAGE GIS MAP</span><h2>Interactive Village Map</h2></div>
        <p>مسجد، قبرستان، شجرکاری یا کسی منصوبے کی درست GPS جگہ، نام اور تصویر یہاں سے شامل کریں۔</p>
      </div>

      <div className="map-admin-settings__toolbar">
        <div><b>{locations.length} locations</b><small>صرف Enabled مقامات public map پر نظر آئیں گے۔</small></div>
        <button type="button" onClick={addLocation}>+ Add Location</button>
      </div>

      <div className="map-admin-list">
        {locations.map((location, index) => (
          <article className="map-admin-card" key={location.id}>
            <div className="map-admin-card__top">
              <strong>Location {index + 1}</strong>
              <label><input type="checkbox" checked={location.enabled !== false} onChange={(event) => updateLocation(location.id, "enabled", event.target.checked)} /> {location.enabled !== false ? "Visible" : "Hidden"}</label>
            </div>

            <div className="map-admin-grid">
              <label><span>English name</span><input value={location.nameEn || ""} onChange={(event) => updateLocation(location.id, "nameEn", event.target.value)} placeholder="Central Mosque" /></label>
              <label><span>اردو نام</span><input dir="rtl" value={location.nameUr || ""} onChange={(event) => updateLocation(location.id, "nameUr", event.target.value)} placeholder="مرکزی مسجد" /></label>
              <label><span>Type</span><select value={location.category || "other"} onChange={(event) => updateLocation(location.id, "category", event.target.value)}><option value="mosque">Mosque / مسجد</option><option value="cemetery">Cemetery / قبرستان</option><option value="plantation">Plantation / شجرکاری</option><option value="welfare">Welfare Project / فلاحی منصوبہ</option><option value="infrastructure">Village Facility / گاؤں کی سہولت</option><option value="other">Other / دیگر</option></select></label>
              <label><span>Status</span><select value={location.status || "active"} onChange={(event) => updateLocation(location.id, "status", event.target.value)}><option value="active">Active</option><option value="planned">Planned</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></label>
              <label><span>Latitude</span><input type="number" inputMode="decimal" step="any" min="-90" max="90" value={location.lat ?? ""} onChange={(event) => updateLocation(location.id, "lat", event.target.value)} placeholder="32.000000" /></label>
              <label><span>Longitude</span><input type="number" inputMode="decimal" step="any" min="-180" max="180" value={location.lng ?? ""} onChange={(event) => updateLocation(location.id, "lng", event.target.value)} placeholder="75.000000" /></label>
              <label className="map-admin-wide"><span>English detail</span><textarea rows="2" value={location.detailsEn || ""} onChange={(event) => updateLocation(location.id, "detailsEn", event.target.value)} placeholder="Short public detail about this location" /></label>
              <label className="map-admin-wide"><span>اردو تفصیل</span><textarea dir="rtl" rows="2" value={location.detailsUr || ""} onChange={(event) => updateLocation(location.id, "detailsUr", event.target.value)} placeholder="اس مقام کی مختصر عوامی تفصیل" /></label>
            </div>

            <div className="map-admin-actions">
              <button type="button" className="map-admin-gps" disabled={busyId === `${location.id}-gps`} onClick={() => useCurrentLocation(location.id)}>{busyId === `${location.id}-gps` ? "Getting GPS..." : "◎ Use Current Location"}</button>
              <label className="map-admin-upload"><input type="file" accept="image/*" disabled={busyId === `${location.id}-photo`} onChange={(event) => { uploadPhoto(location.id, event.target.files?.[0]); event.target.value = ""; }} /><span>{busyId === `${location.id}-photo` ? "Uploading..." : location.imageUrl ? "↻ Replace Photo" : "+ Upload Photo"}</span></label>
              {location.lat && location.lng && <a href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`} target="_blank" rel="noreferrer">Preview GPS ↗</a>}
              <button type="button" className="map-admin-remove" onClick={() => removeLocation(location.id)}>Remove</button>
            </div>
            {location.imageUrl && <img className="map-admin-preview" src={location.imageUrl} alt="Location preview" />}
          </article>
        ))}
        {!locations.length && <div className="map-admin-empty"><span>📍</span><b>Abhi koi location add nahi ki gayi.</b><p>+ Add Location dabayein, phir mobile par GPS se exact jagah save karein.</p></div>}
      </div>
      {message && <p className="map-admin-message">{message}</p>}
    </section>
  );
}
