import { useEffect, useMemo, useState } from "react";
import "./PlantationSurveyAdmin.css";
import {
  PLANT_CATEGORIES,
  createPlantationHousehold,
  deletePlantationHousehold,
  fetchPlantationHouseholds,
  updatePlantationHousehold,
} from "./plantationSurveyService";

const today = () => new Date().toISOString().slice(0, 10);
const newPlant = () => ({ plant_name: "", category: "fruit", quantity: 1 });
const emptyForm = () => ({
  household_name: "",
  guardian_name: "",
  phone: "",
  address: "",
  street: "",
  survey_date: today(),
  notes: "",
  plants: [newPlant()],
});

function recordPlantCount(record) {
  return (record.plants || []).reduce((sum, plant) => sum + Number(plant.quantity || 0), 0);
}

export default function PlantationSurveyAdmin() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadRecords = async () => {
    setLoading(true);
    try {
      setRecords(await fetchPlantationHouseholds());
      setMessage("");
    } catch (error) {
      setMessage(error.message || "Plantation survey could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const totals = useMemo(() => {
    const species = new Set();
    let plants = 0;
    records.forEach((record) => {
      (record.plants || []).forEach((plant) => {
        species.add(plant.plant_name.toLowerCase());
        plants += Number(plant.quantity || 0);
      });
    });
    return { households: records.length, plants, species: species.size };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      [
        record.household_name,
        record.guardian_name,
        record.phone,
        record.address,
        record.street,
        ...(record.plants || []).map((plant) => plant.plant_name),
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [records, search]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updatePlant = (index, field, value) => setForm((current) => ({
    ...current,
    plants: current.plants.map((plant, plantIndex) =>
      plantIndex === index ? { ...plant, [field]: value } : plant
    ),
  }));

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const validPlants = form.plants.filter((plant) => plant.plant_name.trim());
    if (!form.household_name.trim() || !form.address.trim() || !validPlants.length) {
      setMessage("Household, address and at least one plant are required. / گھر، پتہ اور کم از کم ایک پودا ضروری ہے۔");
      return;
    }

    setSaving(true);
    try {
      if (editingId) await updatePlantationHousehold(editingId, { ...form, plants: validPlants });
      else await createPlantationHousehold({ ...form, plants: validPlants });
      resetForm();
      await loadRecords();
      setMessage(editingId ? "Survey updated successfully. / سروے اپڈیٹ ہو گیا۔" : "Household survey saved. / گھر کا سروے محفوظ ہو گیا۔");
    } catch (error) {
      setMessage(error.message || "Survey could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const editRecord = (record) => {
    setEditingId(record.id);
    setForm({
      household_name: record.household_name || "",
      guardian_name: record.guardian_name || "",
      phone: record.phone || "",
      address: record.address || "",
      street: record.street || "",
      survey_date: record.survey_date || today(),
      notes: record.notes || "",
      plants: (record.plants || []).length
        ? record.plants.map(({ plant_name, category, quantity }) => ({ plant_name, category, quantity }))
        : [newPlant()],
    });
    document.getElementById("plantation-survey-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const removeRecord = async (record) => {
    if (!window.confirm(`Delete survey for ${record.household_name}?`)) return;
    try {
      await deletePlantationHousehold(record.id);
      if (editingId === record.id) resetForm();
      await loadRecords();
      setMessage("Survey deleted. / سروے حذف کر دیا گیا۔");
    } catch (error) {
      setMessage(error.message || "Survey could not be deleted.");
    }
  };

  return (
    <section className="plantation-survey-admin" id="plantation-survey-admin">
      <div className="plantation-survey-admin__heading">
        <div>
          <span>VILLAGE PLANTATION SURVEY</span>
          <h2>Household Plants Record <small>گھر گھر شجرکاری سروے</small></h2>
          <p>Record every household, plant species and exact quantity across Sangran.</p>
        </div>
        <button type="button" onClick={loadRecords}>↻ Refresh</button>
      </div>

      <div className="plantation-survey-admin__stats">
        <article><span>Surveyed homes / سروے شدہ گھر</span><b>{totals.households}</b></article>
        <article><span>Total plants / کل پودے</span><b>{totals.plants}</b></article>
        <article><span>Plant species / اقسام</span><b>{totals.species}</b></article>
      </div>

      <form className="plantation-survey-form" id="plantation-survey-form" onSubmit={submit}>
        <div className="plantation-survey-form__title">
          <div><b>{editingId ? "Edit household survey" : "Add household survey"}</b><span>{editingId ? "گھر کا سروے تبدیل کریں" : "نیا گھر شامل کریں"}</span></div>
          {editingId && <button type="button" onClick={resetForm}>Cancel edit</button>}
        </div>

        <div className="plantation-survey-form__grid">
          <label><span>House / family name *</span><input value={form.household_name} onChange={(event) => updateField("household_name", event.target.value)} placeholder="e.g. House 27 / Arain family" /></label>
          <label><span>Head of household</span><input value={form.guardian_name} onChange={(event) => updateField("guardian_name", event.target.value)} placeholder="Full name" /></label>
          <label><span>Phone (Admin only)</span><input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="03xx xxxxxxx" /></label>
          <label><span>Street / Mohalla</span><input value={form.street} onChange={(event) => updateField("street", event.target.value)} placeholder="Street or mohalla" /></label>
          <label className="wide"><span>Full address *</span><input value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="House location / complete address" /></label>
          <label><span>Survey date</span><input type="date" value={form.survey_date} onChange={(event) => updateField("survey_date", event.target.value)} /></label>
          <label className="wide"><span>Admin notes</span><textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Condition, missing plants or follow-up details" /></label>
        </div>

        <div className="plantation-plants-editor">
          <div className="plantation-plants-editor__heading"><b>Plants in this house / اس گھر کے پودے</b><button type="button" onClick={() => setForm((current) => ({ ...current, plants: [...current.plants, newPlant()] }))}>＋ Add plant type</button></div>
          {form.plants.map((plant, index) => (
            <div className="plantation-plant-row" key={`plant-row-${index}`}>
              <input value={plant.plant_name} onChange={(event) => updatePlant(index, "plant_name", event.target.value)} placeholder="Plant name — Mango / آم" />
              <select value={plant.category} onChange={(event) => updatePlant(index, "category", event.target.value)}>
                {PLANT_CATEGORIES.map((category) => <option value={category.id} key={category.id}>{category.en} — {category.ur}</option>)}
              </select>
              <input className="quantity" type="number" min="1" value={plant.quantity} onChange={(event) => updatePlant(index, "quantity", event.target.value)} aria-label="Quantity" />
              <button type="button" className="remove" disabled={form.plants.length === 1} onClick={() => setForm((current) => ({ ...current, plants: current.plants.filter((_, plantIndex) => plantIndex !== index) }))}>×</button>
            </div>
          ))}
        </div>

        <button className="plantation-survey-form__save" type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Update survey / سروے اپڈیٹ کریں" : "Save survey / سروے محفوظ کریں"}</button>
        {message && <p className="plantation-survey-message">{message}</p>}
      </form>

      <div className="plantation-survey-records">
        <div className="plantation-survey-records__toolbar">
          <div><b>Household survey records</b><span>{filteredRecords.length} of {records.length} homes</span></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search house, address or plant…" />
        </div>
        {loading ? <p className="plantation-survey-empty">Loading survey…</p> : !filteredRecords.length ? <p className="plantation-survey-empty">No household survey found. / کوئی سروے موجود نہیں۔</p> : (
          <div className="plantation-household-list">
            {filteredRecords.map((record) => (
              <article className="plantation-household-card" key={record.id}>
                <div className="plantation-household-card__top">
                  <div><span>{record.street || "Sangran"}</span><h3>{record.household_name}</h3><p>{record.guardian_name || "Head of household not entered"} • {record.address}</p></div>
                  <b>{recordPlantCount(record)} <small>plants</small></b>
                </div>
                <div className="plantation-household-card__plants">
                  {(record.plants || []).map((plant) => <span key={plant.id || `${record.id}-${plant.plant_name}`}>{plant.plant_name} <b>{plant.quantity}</b></span>)}
                </div>
                <div className="plantation-household-card__meta"><span>📞 {record.phone || "No phone"}</span><span>Survey: {record.survey_date}</span></div>
                {record.notes && <p className="plantation-household-card__notes">{record.notes}</p>}
                <div className="plantation-household-card__actions"><button type="button" onClick={() => editRecord(record)}>Edit</button><button type="button" className="danger" onClick={() => removeRecord(record)}>Delete</button></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
