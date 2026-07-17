import { useEffect, useMemo, useState } from "react";
import { BLOOD_GROUPS, deleteBloodDonor, fetchBloodDonors, printBloodDonorSlip } from "./bloodBankService";
import "./BloodBank.css";

function searchable(value) {
  return String(value || "").toLowerCase().replace(/positive|پازیٹو|مثبت/g, "+").replace(/negative|نیگیٹو|منفی/g, "-").replace(/\s+/g, "").trim();
}

export default function BloodBankAdmin() {
  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBloodDonors().then(setDonors).catch((error) => setMessage(error.message));
  }, []);

  const filteredDonors = useMemo(() => {
    const query = searchable(search);
    return donors.filter((donor) => {
      const matchesGroup = group === "all" || donor.blood_group === group;
      const haystack = searchable([donor.full_name, donor.phone, donor.address, donor.blood_group].join(" "));
      return matchesGroup && (!query || haystack.includes(query));
    });
  }, [donors, group, search]);

  const removeDonor = async (donor) => {
    if (!window.confirm(`Delete donor record for ${donor.full_name}?\nKya aap yeh donor record delete karna chahte hain?`)) return;
    setBusyId(donor.id); setMessage("");
    try {
      await deleteBloodDonor(donor.id);
      setDonors((current) => current.filter((item) => item.id !== donor.id));
      setMessage("Donor record deleted successfully.");
    } catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  return (
    <section className="blood-admin">
      <div className="blood-admin__hero">
        <div><span>SECURE BLOOD DONOR REGISTRY</span><h2>Blood Bank Management / بلڈ بینک انتظام</h2><p>Donors register themselves. The administrator can search, print or delete donor cards.</p></div>
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
      <div className="blood-donor-list blood-donor-list--wide">
        <div className="blood-donor-list__title"><h3>Donor records / ڈونر ریکارڈ</h3><span>{filteredDonors.length} result(s)</span></div>
        {filteredDonors.length === 0 ? <p className="blood-empty">No matching donor found.</p> : (
          <div className="blood-admin-card-grid">
            {filteredDonors.map((donor) => (
              <article className="blood-donor" key={donor.id}>
                <div className="blood-donor__main"><strong>{donor.blood_group}</strong><span><b>{donor.full_name}</b><small>{donor.phone}</small><small>{donor.address}</small></span><em className="available">Registered</em></div>
                <div className="blood-donor__actions"><button type="button" onClick={() => printBloodDonorSlip(donor)}>Print donor slip</button><button className="blood-delete-button" disabled={busyId === donor.id} type="button" onClick={() => removeDonor(donor)}>{busyId === donor.id ? "Deleting…" : "Delete donor card"}</button></div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
