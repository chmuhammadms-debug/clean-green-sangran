import { useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
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

function PickPoint({ onPick }) {
  useMapEvents({ click: ({ latlng }) => onPick(latlng) });
  return null;
}

function hasCoordinates(location) {
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  return String(location.lat ?? "").trim() !== "" && String(location.lng ?? "").trim() !== ""
    && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

export default function VillageMapSettings({ locations = [], onChange, onSaveLocations, saving = false }) {
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [pickingId, setPickingId] = useState("");

  const addLocation = () => onChange([
    ...locations,
    { ...EMPTY_LOCATION, id: `map-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
  ]);

  const updateLocation = (id, key, value) => onChange(locations.map((location) => (
    location.id === id ? { ...location, [key]: value } : location
  )));

  const removeLocation = (id) => onChange(locations.filter((location) => location.id !== id));

  const saveLocations = async (nextLocations = locations) => {
    if (nextLocations.some((location) => location.enabled !== false && !hasCoordinates(location))) {
      setMessage("Visible کرنے سے پہلے اس مقام کی درست GPS جگہ منتخب کریں۔");
      return;
    }
    setMessage("");
    try {
      await onSaveLocations(nextLocations);
      setMessage("نقشے کی تبدیلیاں محفوظ ہو گئیں۔");
    } catch (error) {
      setMessage(`نقشہ محفوظ نہیں ہوا: ${error.message}`);
    }
  };

  const toggleLocation = (location, enabled) => {
    if (enabled && !hasCoordinates(location)) {
      setMessage("پہلے مسجد کی GPS جگہ لکھیں یا نقشے پر منتخب کریں۔");
      return;
    }
    const nextLocations = locations.map((entry) => entry.id === location.id ? { ...entry, enabled } : entry);
    onChange(nextLocations);
    saveLocations(nextLocations);
  };

  const pickLocation = (id, { lat, lng }) => {
    onChange(locations.map((entry) => entry.id === id ? {
      ...entry, lat: lat.toFixed(7), lng: lng.toFixed(7),
    } : entry));
    setPickingId("");
    setMessage("جگہ منتخب ہوگئی۔ درست جگہ دیکھ کر اسی مقام کا Save Location بٹن دبائیں۔");
  };

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
        setMessage("GPS جگہ مل گئی۔ درست مقام دیکھ کر Save Location دبائیں۔");
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
      setMessage("تصویر اپ لوڈ ہوگئی۔ Save Location دبائیں۔");
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
              <label><input type="checkbox" checked={location.enabled !== false} disabled={saving} onChange={(event) => toggleLocation(location, event.target.checked)} /> {location.enabled !== false ? "Visible" : "Hidden"}</label>
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

            {!hasCoordinates(location) && <p className="map-admin-hint">یہ جگہ ابھی نقشے پر نہیں آسکتی؛ GPS خالی ہے۔ مسجد کے مقام پر کھڑے ہو کر Use Current Location دبائیں، یا نیچے نقشے پر درست جگہ منتخب کریں۔</p>}
            {pickingId === location.id && (
              <div className="map-admin-picker">
                <p>نقشے پر مسجد کی درست جگہ کو ٹَیپ کریں، پھر Save Location دبائیں۔</p>
                <MapContainer center={hasCoordinates(location) ? [Number(location.lat), Number(location.lng)] : (locations.find(hasCoordinates) ? [Number(locations.find(hasCoordinates).lat), Number(locations.find(hasCoordinates).lng)] : [30, 70])} zoom={hasCoordinates(location) || locations.some(hasCoordinates) ? 16 : 6} scrollWheelZoom={false} className="map-admin-picker__map">
                  <TileLayer attribution="Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <PickPoint onPick={(point) => pickLocation(location.id, point)} />
                  {hasCoordinates(location) && <CircleMarker center={[Number(location.lat), Number(location.lng)]} radius={9} pathOptions={{ color: "#fff", fillColor: "#0c6b3a", fillOpacity: 1 }} />}
                </MapContainer>
              </div>
            )}

            <div className="map-admin-actions">
              <button type="button" className="map-admin-gps" disabled={busyId === `${location.id}-gps`} onClick={() => useCurrentLocation(location.id)}>{busyId === `${location.id}-gps` ? "Getting GPS..." : "◎ Use Current Location"}</button>
              <button type="button" className="map-admin-gps" onClick={() => setPickingId(pickingId === location.id ? "" : location.id)}>{pickingId === location.id ? "Close map" : "📍 Pick on map"}</button>
              <button type="button" className="map-admin-gps" disabled={saving} onClick={() => saveLocations()}>{saving ? "Saving..." : "Save Location"}</button>
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
