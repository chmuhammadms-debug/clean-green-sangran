import { useEffect, useMemo, useState } from "react";
import {
  deleteCensusHousehold,
  fetchCensusHouseholds,
  fetchPublicCensusSummary,
  saveCensusHousehold,
} from "./demographyService";
import "./Demography.css";

const blank = {
  household_no: "", household_head: "", father_name: "", phone: "", mohalla: "",
  address: "", adult_men: 0, adult_women: 0, boys: 0, girls: 0,
  senior_citizens: 0, persons_with_disabilities: 0, registered_voters: 0,
  overseas_residents: 0, notes: "", is_verified: true,
};
const numeric = new Set([
  "adult_men", "adult_women", "boys", "girls", "senior_citizens",
  "persons_with_disabilities", "registered_voters", "overseas_residents",
]);
const num = (value) => Number(value || 0).toLocaleString("en-PK");

export default function DemographyAdmin() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(blank);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [households, liveSummary] = await Promise.all([
        fetchCensusHouseholds(),
        fetchPublicCensusSummary(),
      ]);
      setRows(households);
      setSummary(liveSummary);
    } catch (err) {
      setMessage("Error: " + (err.message || "Unable to load census data."));
    }
  }

  useEffect(() => { load(); }, []);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.household_no, row.household_head, row.father_name, row.phone, row.mohalla, row.address]
      .filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [rows, search]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((old) => ({
      ...old,
      [name]: type === "checkbox" ? checked : numeric.has(name) ? Math.max(0, Number(value) || 0) : value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await saveCensusHousehold(form);
      setForm(blank);
      setMessage(form.id ? "Household updated successfully." : "Household added successfully.");
      await load();
    } catch (err) {
      setMessage("Error: " + (err.message || "Unable to save household."));
    } finally {
      setBusy(false);
    }
  }

  function edit(row) {
    setForm({ ...blank, ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(row) {
    if (!window.confirm("Delete census record for " + row.household_head + "?")) return;
    setBusy(true);
    try {
      await deleteCensusHousehold(row.id);
      if (form.id === row.id) setForm(blank);
      setMessage("Household deleted.");
      await load();
    } catch (err) {
      setMessage("Error: " + (err.message || "Unable to delete household."));
    } finally {
      setBusy(false);
    }
  }

  const totalPeople = (row) => Number(row.adult_men || 0) + Number(row.adult_women || 0) + Number(row.boys || 0) + Number(row.girls || 0);

  return (
    <section className="census-admin">
      <div className="census-admin-title">
        <div>
          <span>PROJECT 6 · PRIVATE ADMIN</span>
          <h2>👥 Sangran Population Census</h2>
          <p>Add one record per household. Names and phone numbers remain private; the public page receives totals only.</p>
        </div>
        <div className="census-admin-live">
          <b>{num(summary?.households)}</b><small>Households</small>
          <b>{num(summary?.total_population)}</b><small>Population</small>
        </div>
      </div>

      <form className="census-form" onSubmit={submit}>
        <h3>{form.id ? "Edit Household" : "Add Household"}</h3>
        <div className="census-form-grid">
          <label>Household No.<input name="household_no" value={form.household_no || ""} onChange={change} placeholder="SGR-001" /></label>
          <label>Head of Household *<input required name="household_head" value={form.household_head} onChange={change} /></label>
          <label>Father Name<input name="father_name" value={form.father_name || ""} onChange={change} /></label>
          <label>Phone<input name="phone" value={form.phone || ""} onChange={change} inputMode="tel" /></label>
          <label>Mohalla / Area *<input required name="mohalla" value={form.mohalla} onChange={change} placeholder="Mohalla name" /></label>
          <label className="census-wide">Address<input name="address" value={form.address || ""} onChange={change} /></label>
        </div>
        <h4>Family Members</h4>
        <div className="census-number-grid">
          <label>Adult Men<input type="number" min="0" name="adult_men" value={form.adult_men} onChange={change} /></label>
          <label>Adult Women<input type="number" min="0" name="adult_women" value={form.adult_women} onChange={change} /></label>
          <label>Boys<input type="number" min="0" name="boys" value={form.boys} onChange={change} /></label>
          <label>Girls<input type="number" min="0" name="girls" value={form.girls} onChange={change} /></label>
          <label>Senior Citizens<input type="number" min="0" name="senior_citizens" value={form.senior_citizens} onChange={change} /></label>
          <label>Persons with Disabilities<input type="number" min="0" name="persons_with_disabilities" value={form.persons_with_disabilities} onChange={change} /></label>
          <label>Registered Voters<input type="number" min="0" name="registered_voters" value={form.registered_voters} onChange={change} /></label>
          <label>Overseas Residents<input type="number" min="0" name="overseas_residents" value={form.overseas_residents} onChange={change} /></label>
        </div>
        <label className="census-notes">Notes<textarea name="notes" value={form.notes || ""} onChange={change} rows="3" /></label>
        <label className="census-check"><input type="checkbox" name="is_verified" checked={Boolean(form.is_verified)} onChange={change} /> Verified record (included in public totals)</label>
        {message ? <p className={message.startsWith("Error") ? "census-message error" : "census-message"}>{message}</p> : null}
        <div className="census-form-actions">
          <button className="census-save" disabled={busy}>{busy ? "Saving…" : form.id ? "Update Household" : "Save Household"}</button>
          {form.id ? <button type="button" onClick={() => setForm(blank)}>Cancel Edit</button> : null}
        </div>
      </form>

      <div className="census-records">
        <div className="census-records-head">
          <div><h3>Household Records</h3><p>{rows.length} total records</p></div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, area…" />
        </div>
        {visibleRows.length ? (
          <div className="census-table-wrap">
            <table>
              <thead><tr><th>No.</th><th>Head of Household</th><th>Area</th><th>Phone</th><th>People</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.household_no || "—"}</td>
                    <td><b>{row.household_head}</b><small>{row.father_name || ""}</small></td>
                    <td>{row.mohalla}</td><td>{row.phone || "—"}</td>
                    <td><strong>{totalPeople(row)}</strong></td>
                    <td><span className={row.is_verified ? "verified" : "pending"}>{row.is_verified ? "Verified" : "Pending"}</span></td>
                    <td><div className="census-row-actions"><button onClick={() => edit(row)}>Edit</button><button className="danger" onClick={() => remove(row)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="census-empty"><span>📋</span><h3>No household records yet</h3><p>Use the form above to start the population census.</p></div>}
      </div>
    </section>
  );
}
