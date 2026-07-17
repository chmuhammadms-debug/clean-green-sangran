import { useEffect, useMemo, useState } from "react";
import {
  BLOOD_GROUPS,
  fetchBloodDonations,
  fetchBloodDonors,
  printBloodDonorSlip,
  recordBloodDonation,
  setBloodDonorAvailability,
} from "./bloodBankService";
import "./BloodBank.css";

const today = () => new Date().toISOString().slice(0, 10);

function searchable(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/positive|پازیٹو|مثبت/g, "+")
    .replace(/negative|نیگیٹو|منفی/g, "-")
    .replace(/\s+/g, "")
    .trim();
}

export default function BloodBankAdmin() {
  const [donors, setDonors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedDonorId, setSelectedDonorId] = useState("");
  const [form, setForm] = useState({ donationDate: today(), units: 1, location: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [nextDonors, nextDonations] = await Promise.all([
        fetchBloodDonors(),
        fetchBloodDonations(),
      ]);
      setDonors(nextDonors);
      setDonations(nextDonations);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredDonors = useMemo(() => {
    const query = searchable(search);
    return donors.filter((donor) => {
      const matchesGroup = group === "all" || donor.blood_group === group;
      const haystack = searchable([
        donor.full_name,
        donor.phone,
        donor.address,
        donor.email,
        donor.blood_group,
      ].join(" "));
      return matchesGroup && (!query || haystack.includes(query));
    });
  }, [donors, group, search]);

  const selectedDonor = donors.find((donor) => donor.id === selectedDonorId);
  const donorHistory = (donorId) => donations.filter((item) => item.donor_id === donorId);

  const toggleAvailability = async (donor) => {
    setBusy(true); setMessage("");
    try {
      const updated = await setBloodDonorAvailability(donor.id, donor.is_available === false);
      setDonors((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const saveDonation = async (event) => {
    event.preventDefault();
    if (!selectedDonor) return;
    setBusy(true); setMessage("");
    try {
      const donation = await recordBloodDonation({ donorId: selectedDonor.id, ...form });
      setDonations((current) => [donation, ...current]);
      setForm({ donationDate: today(), units: 1, location: "", notes: "" });
      setMessage("Blood donation record saved successfully / خون کے عطیے کا ریکارڈ محفوظ ہوگیا۔");
      printBloodDonorSlip(selectedDonor, donation);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return (
    <section className="blood-admin">
      <div className="blood-admin__hero">
        <div>
          <span>SECURE BLOOD DONOR REGISTRY</span>
          <h2>Blood Bank Management / بلڈ بینک انتظام</h2>
          <p>Search donors instantly by blood group, name, phone or address. No money records are used in this project.</p>
        </div>
        <div className="blood-admin__stats"><b>{donors.length}</b><span>Registered donors</span></div>
      </div>

      <div className="blood-admin__filters">
        <label><span>Search donor / ڈونر تلاش کریں</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="A positive, B+, name, phone or address" /></label>
        <label><span>Blood group / بلڈ گروپ</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All blood groups</option>{BLOOD_GROUPS.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>

      <div className="blood-group-chips">
        <button className={group === "all" ? "active" : ""} onClick={() => setGroup("all")}>All</button>
        {BLOOD_GROUPS.map((item) => <button className={group === item ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}<small>{donors.filter((donor) => donor.blood_group === item).length}</small></button>)}
      </div>

      {message && <p className="blood-message">{message}</p>}

      <div className="blood-admin__layout">
        <div className="blood-donor-list">
          <div className="blood-donor-list__title"><h3>Donor records / ڈونر ریکارڈ</h3><span>{filteredDonors.length} result(s)</span></div>
          {filteredDonors.length === 0 ? <p className="blood-empty">No matching donor found.</p> : filteredDonors.map((donor) => {
            const history = donorHistory(donor.id);
            return (
              <article className={selectedDonorId === donor.id ? "blood-donor active" : "blood-donor"} key={donor.id}>
                <button className="blood-donor__main" type="button" onClick={() => setSelectedDonorId(donor.id)}>
                  <strong>{donor.blood_group}</strong>
                  <span><b>{donor.full_name}</b><small>{donor.phone} · {donor.address}</small></span>
                  <em className={donor.is_available === false ? "unavailable" : "available"}>{donor.is_available === false ? "Not available" : "Available"}</em>
                </button>
                <div className="blood-donor__meta"><span>{history.length} donation(s)</span><span>Last: {history[0]?.donation_date || "—"}</span></div>
                <div className="blood-donor__actions">
                  <button type="button" onClick={() => setSelectedDonorId(donor.id)}>Record blood donation</button>
                  <button type="button" onClick={() => printBloodDonorSlip(donor)}>Print donor slip</button>
                  <button disabled={busy} type="button" onClick={() => toggleAvailability(donor)}>{donor.is_available === false ? "Mark available" : "Mark unavailable"}</button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="blood-record-card">
          <span>ACTUAL BLOOD DONATION</span>
          <h3>{selectedDonor ? selectedDonor.full_name : "Select a donor"}</h3>
          {selectedDonor ? (
            <>
              <div className="blood-selected"><b>{selectedDonor.blood_group}</b><p><strong>{selectedDonor.phone}</strong><small>{selectedDonor.address}</small></p></div>
              <form className="blood-form blood-record-form" onSubmit={saveDonation}>
                <label><span>Donation date</span><input required type="date" value={form.donationDate} onChange={(event) => setForm({ ...form, donationDate: event.target.value })} /></label>
                <label><span>Units</span><input required min="0.1" step="0.1" type="number" value={form.units} onChange={(event) => setForm({ ...form, units: event.target.value })} /></label>
                <label className="wide"><span>Hospital / location</span><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Hospital or patient location" /></label>
                <label className="wide"><span>Notes</span><textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
                <button className="blood-submit wide" disabled={busy}>{busy ? "Saving..." : "Save & print blood donation slip"}</button>
              </form>
              {donorHistory(selectedDonor.id).length > 0 && <div className="blood-history"><h3>Previous donations</h3>{donorHistory(selectedDonor.id).map((item) => <div key={item.id}><b>{item.donation_date}</b><span>{item.units} unit(s)</span><small>{item.location || item.notes || "—"}</small><button onClick={() => printBloodDonorSlip(selectedDonor, item)}>Print</button></div>)}</div>}
            </>
          ) : <p className="blood-empty">Choose any donor from the list to record a blood donation.</p>}
        </aside>
      </div>
    </section>
  );
}
