import { useMemo, useState } from "react";
import { uploadWebsiteImage } from "./mediaUpload";
import "./ServiceDirectory.css";

export const SERVICE_DIRECTORY_ID = "service-directory";

export function isServiceDirectory(projectOrId) {
  const id = typeof projectOrId === "object" ? projectOrId?.id : projectOrId;
  return String(id || "") === SERVICE_DIRECTORY_ID;
}

export const serviceDirectorySystem = {
  id: SERVICE_DIRECTORY_ID,
  name: "Sangran Service Directory",
  nameUr: "سنگراں سروس ڈائریکٹری",
  description: "Verified local contacts for doctors, electricians, plumbers and other essential services.",
  descriptionUr: "ڈاکٹر، الیکٹریشن، پلمبر اور دیگر ضروری مقامی خدمات کے تصدیق شدہ رابطے۔",
  icon: "☎️",
};

const CATEGORIES = [
  ["plumber", "Plumber", "پلمبر", "🔧"],
  ["electrician", "Electrician", "الیکٹریشن", "⚡"],
  ["doctor", "Doctor & Clinic", "ڈاکٹر اور کلینک", "🩺"],
  ["ambulance", "Ambulance", "ایمبولینس", "🚑"],
  ["mechanic", "Mechanic", "مکینک", "🛠️"],
  ["mason", "Mason & Labour", "مستری اور مزدور", "🧱"],
  ["carpenter", "Carpenter", "کارپینٹر", "🪚"],
  ["welder", "Welder", "ویلڈر", "🥽"],
  ["solar", "Solar Technician", "سولر ٹیکنیشن", "☀️"],
  ["repair", "Mobile & Computer Repair", "موبائل اور کمپیوٹر ریپیئر", "📱"],
  ["transport", "Transport", "ٹرانسپورٹ", "🚐"],
  ["tailor", "Tailor", "درزی", "🧵"],
  ["supplier", "Milk, Water & Gas", "دودھ، پانی اور گیس", "🚚"],
  ["emergency", "Emergency Contact", "ہنگامی رابطہ", "🆘"],
  ["other", "Other Local Service", "دیگر مقامی خدمت", "📍"],
];

const categoryFor = (id) => CATEGORIES.find(([key]) => key === id) || CATEGORIES.at(-1);
const cleanPhone = (value) => String(value || "").replace(/[^+\d]/g, "");
const whatsappPhone = (value) => {
  const phone = cleanPhone(value).replace(/^\+/, "");
  if (phone.startsWith("0")) return `92${phone.slice(1)}`;
  return phone;
};

export function ServiceDirectoryPublic({ entries = [], language = "en" }) {
  const ur = language === "ur";
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const visibleEntries = useMemo(() => (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry.enabled !== false)
    .filter((entry) => category === "all" || entry.category === category)
    .filter((entry) => `${entry.name || ""} ${entry.service || ""} ${entry.address || ""}`.toLocaleLowerCase("en").includes(search.trim().toLocaleLowerCase("en")))
    .sort((a, b) => Number(Boolean(b.emergency)) - Number(Boolean(a.emergency)) || String(a.name).localeCompare(String(b.name))), [entries, category, search]);
  const usedCategories = CATEGORIES.filter(([id]) => (entries || []).some((entry) => entry.enabled !== false && entry.category === id));

  return (
    <section className="service-directory" dir={ur ? "rtl" : "ltr"}>
      <div className="service-directory__intro">
        <div><span>{ur ? "ضروری مقامی رابطے" : "LOCAL HELP, ONE TAP AWAY"}</span><h2>{ur ? "سنگراں سروس ڈائریکٹری" : "Sangran Service Directory"}</h2></div>
        <p>{ur ? "تصدیق شدہ مقامی سروس سے براہِ راست کال یا واٹس ایپ پر رابطہ کریں۔" : "Call or WhatsApp a verified local service provider directly."}</p>
      </div>
      <label className="service-directory__search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={ur ? "نام، سروس یا جگہ تلاش کریں" : "Search name, service or location"} /></label>
      <div className="service-directory__filters">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>{ur ? "تمام خدمات" : "All Services"}</button>
        {usedCategories.map(([id, en, urdu, icon]) => <button className={category === id ? "active" : ""} key={id} onClick={() => setCategory(id)}>{icon} {ur ? urdu : en}</button>)}
      </div>
      {visibleEntries.length ? <div className="service-directory__grid">
        {visibleEntries.map((entry) => {
          const [, categoryEn, categoryUr, icon] = categoryFor(entry.category);
          const wa = whatsappPhone(entry.whatsapp || entry.phone);
          return <article className={`service-card${entry.emergency ? " service-card--emergency" : ""}`} key={entry.id}>
            <div className="service-card__top">
              {entry.photo ? <img src={entry.photo} alt={entry.name} /> : <span className="service-card__avatar" aria-hidden="true">{icon}</span>}
              <div><small>{ur ? categoryUr : categoryEn}</small><h3>{entry.name}</h3><p>{entry.service || (ur ? categoryUr : categoryEn)}</p></div>
              {entry.verified !== false && <b className="service-card__verified">✓ {ur ? "تصدیق شدہ" : "Verified"}</b>}
            </div>
            <dl>
              {entry.address && <div><dt>{ur ? "پتہ" : "Address"}</dt><dd>{entry.address}</dd></div>}
              {entry.availability && <div><dt>{ur ? "دستیابی" : "Available"}</dt><dd>{entry.availability}</dd></div>}
            </dl>
            <div className="service-card__actions">
              <a href={`tel:${cleanPhone(entry.phone)}`}>☎ {ur ? "کال کریں" : "Call"}</a>
              {wa && <a className="service-card__whatsapp" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            </div>
          </article>;
        })}
      </div> : <div className="service-directory__empty">{ur ? "اس کیٹیگری میں ابھی کوئی رابطہ شامل نہیں ہے۔" : "No contact has been added in this category yet."}</div>}
    </section>
  );
}

const emptyEntry = () => ({ id: "", category: "plumber", name: "", service: "", phone: "", whatsapp: "", address: "", availability: "", photo: "", verified: true, emergency: false, enabled: true });

export function ServiceDirectoryAdmin({ settings, onSaveSettings, savingSettings }) {
  const entries = Array.isArray(settings?.serviceDirectoryEntries) ? settings.serviceDirectoryEntries : [];
  const [form, setForm] = useState(emptyEntry);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const saveEntries = async (nextEntries, successMessage) => {
    await onSaveSettings({ ...settings, serviceDirectoryEntries: nextEntries });
    setMessage(successMessage);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return setMessage("Name and phone number are required.");
    const entry = { ...form, id: form.id || `service-${Date.now()}`, name: form.name.trim(), phone: form.phone.trim() };
    const next = form.id ? entries.map((item) => item.id === form.id ? entry : item) : [entry, ...entries];
    await saveEntries(next, form.id ? "Service updated successfully." : "Service added successfully.");
    setForm(emptyEntry());
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try { const uploaded = await uploadWebsiteImage(file, "service-directory"); update("photo", uploaded.url); }
    catch (error) { setMessage(`Photo upload failed: ${error.message}`); }
    finally { setUploading(false); }
  };

  const edit = (entry) => { setForm({ ...emptyEntry(), ...entry }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = async (entry) => {
    if (!window.confirm(`Permanently remove ${entry.name}?`)) return;
    await saveEntries(entries.filter((item) => item.id !== entry.id), "Service removed.");
    if (form.id === entry.id) setForm(emptyEntry());
  };

  return <section className="service-admin">
    <div className="service-admin__heading"><div><span>SERVICE DIRECTORY</span><h2>Add Local Contact</h2></div><p>Public website par doctor, plumber, electrician aur doosri services add karein.</p></div>
    <form className="service-admin__form" onSubmit={submit}>
      <label><span>Category</span><select value={form.category} onChange={(e) => update("category", e.target.value)}>{CATEGORIES.map(([id, en]) => <option value={id} key={id}>{en}</option>)}</select></label>
      <label><span>Name *</span><input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Service provider name" /></label>
      <label><span>Service / Speciality</span><input value={form.service} onChange={(e) => update("service", e.target.value)} placeholder="e.g. Child specialist / House wiring" /></label>
      <label><span>Phone *</span><input inputMode="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="03XX XXXXXXX" /></label>
      <label><span>WhatsApp</span><input inputMode="tel" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} placeholder="Leave blank to use phone" /></label>
      <label><span>Availability</span><input value={form.availability} onChange={(e) => update("availability", e.target.value)} placeholder="9 AM – 9 PM / 24 Hours" /></label>
      <label className="service-admin__wide"><span>Address</span><textarea rows="2" value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Shop, clinic or area address" /></label>
      <label className="service-admin__photo"><span>Photo</span><input type="file" accept="image/*" disabled={uploading} onChange={(e) => { uploadPhoto(e.target.files?.[0]); e.target.value = ""; }} />{form.photo && <img src={form.photo} alt="Preview" />}</label>
      <div className="service-admin__checks">
        <label><input type="checkbox" checked={form.verified} onChange={(e) => update("verified", e.target.checked)} /> Verified contact</label>
        <label><input type="checkbox" checked={form.emergency} onChange={(e) => update("emergency", e.target.checked)} /> Emergency service</label>
        <label><input type="checkbox" checked={form.enabled} onChange={(e) => update("enabled", e.target.checked)} /> Visible publicly</label>
      </div>
      <div className="service-admin__actions"><button type="submit" disabled={savingSettings || uploading}>{uploading ? "Uploading photo..." : savingSettings ? "Saving..." : form.id ? "Update Service" : "Add Service"}</button>{form.id && <button type="button" onClick={() => setForm(emptyEntry())}>Cancel Edit</button>}</div>
    </form>
    {message && <p className="service-admin__message">{message}</p>}
    <div className="service-admin__list">
      {entries.map((entry) => { const [, en, , icon] = categoryFor(entry.category); return <article key={entry.id}>{entry.photo ? <img src={entry.photo} alt="" /> : <span>{icon}</span>}<div><b>{entry.name}</b><small>{en} · {entry.phone}</small></div><button type="button" onClick={() => edit(entry)}>Edit</button><button className="danger" type="button" onClick={() => remove(entry)}>Delete</button></article>; })}
      {!entries.length && <p>No services added yet.</p>}
    </div>
  </section>;
}
