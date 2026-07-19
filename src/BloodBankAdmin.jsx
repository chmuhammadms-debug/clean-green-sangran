import { useEffect, useMemo, useState } from "react";
import {
  BLOOD_GROUPS,
  assignDonorToBloodRequest,
  deleteBloodAssignment,
  deleteBloodDonor,
  deleteBloodRequest,
  fetchBloodDonors,
  fetchBloodRequestReport,
  printBloodDonorSlip,
  printBloodRequestReport,
  regenerateBloodRequestCode,
  setBloodDonorAvailability,
  updateBloodAssignmentStatus,
} from "./bloodBankService";
import "./BloodBank.css";

function searchable(value) {
  return String(value || "").toLowerCase().replace(/positive|پازیٹو|مثبت/g, "+").replace(/negative|نیگیٹو|منفی/g, "-").replace(/\s+/g, "").trim();
}

function activeAssignment(request) {
  return (request.assignments || []).find((item) => item.status === "donated")
    || (request.assignments || []).find((item) => item.status === "selected")
    || null;
}

export default function BloodBankAdmin() {
  const [tab, setTab] = useState("patients");
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [requestStatus, setRequestStatus] = useState("all");
  const [selectedDonors, setSelectedDonors] = useState({});
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = async () => {
    setLoading(true); setMessage("");
    try {
      const [donorRows, requestRows] = await Promise.all([fetchBloodDonors(), fetchBloodRequestReport()]);
      setDonors(donorRows);
      setRequests(requestRows);
    } catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const filteredDonors = useMemo(() => {
    const query = searchable(search);
    return donors.filter((donor) => {
      const matchesGroup = group === "all" || donor.blood_group === group;
      const haystack = searchable([donor.full_name, donor.phone, donor.address, donor.blood_group].join(" "));
      return matchesGroup && (!query || haystack.includes(query));
    });
  }, [donors, group, search]);

  const filteredRequests = useMemo(() => {
    const query = searchable(search);
    return requests.filter((request) => {
      const assignment = activeAssignment(request);
      const matchesStatus = requestStatus === "all" || request.status === requestStatus || assignment?.status === requestStatus;
      const haystack = searchable([
        request.patient_name, request.attendant_name, request.phone, request.hospital_address,
        request.blood_group, request.status, assignment?.donor?.full_name, assignment?.donor?.phone,
      ].join(" "));
      return matchesStatus && (group === "all" || request.blood_group === group) && (!query || haystack.includes(query));
    });
  }, [requests, group, requestStatus, search]);

  const removeDonor = async (donor) => {
    if (!window.confirm(`Delete donor record for ${donor.full_name}?\nKya aap yeh donor record delete karna chahte hain?`)) return;
    setBusyId(donor.id); setMessage("");
    try { await deleteBloodDonor(donor.id); await loadData(); setMessage("Donor record deleted successfully."); }
    catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const changeDonorAvailability = async (donor, isAvailable) => {
    setBusyId(donor.id); setMessage("");
    try {
      await setBloodDonorAvailability(donor.id, isAvailable);
      await loadData();
      setMessage(isAvailable ? "Donor is active and available again." : "Donor has been marked unavailable.");
    } catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const removeRequest = async (request) => {
    if (!window.confirm(`Delete the complete patient request for ${request.patient_name}?`)) return;
    setBusyId(request.id); setMessage("");
    try { await deleteBloodRequest(request.id); await loadData(); setMessage("Patient request deleted successfully."); }
    catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const assignDonor = async (request) => {
    const donorId = selectedDonors[request.id];
    if (!donorId) { setMessage("Please select a matching donor first."); return; }
    setBusyId(request.id); setMessage("");
    try { await assignDonorToBloodRequest(request.id, donorId); await loadData(); setMessage("Donor confirmed for this patient. Management may now coordinate both parties."); }
    catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const changeAssignment = async (request, status) => {
    const assignment = activeAssignment(request);
    if (!assignment) return;
    setBusyId(assignment.id); setMessage("");
    try { await updateBloodAssignmentStatus(assignment.id, status); await loadData(); setMessage(`Donation status changed to ${status}.`); }
    catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const removeAssignment = async (request) => {
    const assignment = activeAssignment(request);
    if (!assignment || !window.confirm("Remove this donor from the patient request?")) return;
    setBusyId(assignment.id); setMessage("");
    try { await deleteBloodAssignment(assignment.id); await loadData(); setMessage("Donor removed from patient request."); }
    catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  const regenerateApprovalCode = async (request) => {
    if (!window.confirm(`Generate a new approval code for ${request.patient_name}?\nThe previous code will stop working.`)) return;
    setBusyId(`code-${request.id}`); setMessage("");
    try {
      const result = await regenerateBloodRequestCode(request.id);
      await loadData();
      setMessage(`New management approval code: ${result.approval_code}`);
    } catch (error) { setMessage(error.message); }
    finally { setBusyId(""); }
  };

  return (
    <section className="blood-admin">
      <div className="blood-admin__hero">
        <div><span>COMPLETE BLOOD BANK CONTROL</span><h2>Blood Bank Management / بلڈ بینک انتظام</h2><p>Check donors and patients, connect a donor with a patient, confirm completed donations, print reports and delete records.</p></div>
        <div className="blood-admin__stats"><b>{donors.length}</b><span>Donors · {requests.length} patients</span></div>
      </div>

      <div className="blood-admin-tabs">
        <button className={tab === "patients" ? "active" : ""} onClick={() => setTab("patients")}>Patient requests / مریض</button>
        <button className={tab === "donors" ? "active" : ""} onClick={() => setTab("donors")}>Donor records / ڈونرز</button>
      </div>

      <div className="blood-admin__filters">
        <label><span>Search complete data / مکمل ریکارڈ تلاش کریں</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Patient, donor, blood group, phone or address" /></label>
        <label><span>Blood group / بلڈ گروپ</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="all">All blood groups</option>{BLOOD_GROUPS.map((item) => <option key={item}>{item}</option>)}</select></label>
        {tab === "patients" && <label><span>Status / حالت</span><select value={requestStatus} onChange={(event) => setRequestStatus(event.target.value)}><option value="all">All statuses</option><option value="open">Open</option><option value="selected">Donor selected</option><option value="donated">Blood donated</option><option value="fulfilled">Fulfilled</option><option value="closed">Closed</option></select></label>}
      </div>

      <div className="blood-group-chips">
        <button className={group === "all" ? "active" : ""} onClick={() => setGroup("all")}>All</button>
        {BLOOD_GROUPS.map((item) => <button className={group === item ? "active" : ""} key={item} onClick={() => setGroup(item)}>{item}<small>{donors.filter((donor) => donor.blood_group === item).length}</small></button>)}
      </div>
      {message && <p className="blood-message">{message}</p>}
      {loading && <div className="blood-loading"><span className="blood-spinner" /> Loading complete Blood Bank data…</div>}

      {!loading && tab === "patients" && <section className="blood-patient-admin">
        <div className="blood-donor-list__title"><div><h3>Patient–donor report / مریض اور ڈونر رپورٹ</h3><span>{filteredRequests.length} result(s)</span></div><button className="blood-report-print" type="button" onClick={() => printBloodRequestReport(filteredRequests)}>Print full report</button></div>
        {filteredRequests.length === 0 ? <p className="blood-empty">No matching patient request found. If requests exist publicly, run the new SQL file for admin access.</p> : <div className="blood-patient-grid">
          {filteredRequests.map((request) => {
            const assignment = activeAssignment(request);
            const matchingDonors = donors.filter((donor) => donor.blood_group === request.blood_group && donor.is_available !== false);
            return <article className="blood-patient-card" key={request.id}>
              <header><b>{request.blood_group}</b><div><span>{request.status.toUpperCase()} · {(request.approval_status || "pending").toUpperCase()}</span><h3>{request.patient_name}</h3><p>{request.units} unit(s) · required {request.needed_on}</p></div></header>
              <div className="blood-patient-details"><p><span>Contact person</span><b>{request.attendant_name}</b></p><p><span>Phone</span><b>{request.phone}</b></p><p className="wide"><span>Hospital / address</span><b>{request.hospital_address}</b></p>{request.notes && <p className="wide"><span>Notes</span><b>{request.notes}</b></p>}</div>
              <section className={`blood-admin-approval ${request.approval_status === "approved" ? "approved" : "pending"}`}>
                <div><span>MANAGEMENT APPROVAL CODE</span><strong>{request.approval_code || "Not generated"}</strong><small>{request.approval_status === "approved" ? `Verified${request.approved_at ? ` · ${new Date(request.approved_at).toLocaleString()}` : ""}` : `Pending · expires ${request.access_code_expires_at ? new Date(request.access_code_expires_at).toLocaleString() : "after 24 hours"}`}</small></div>
                <div><button type="button" onClick={() => navigator.clipboard?.writeText(request.approval_code || "")}>Copy code</button><button type="button" disabled={busyId === `code-${request.id}`} onClick={() => regenerateApprovalCode(request)}>{busyId === `code-${request.id}` ? "Generating…" : "New OTP"}</button></div>
              </section>
              {assignment?.donor ? <div className={`blood-assignment-summary ${assignment.status}`}><div><span>{assignment.status === "donated" ? "BLOOD DONATED BY · COMPLETED" : "DONOR CONFIRMED BY MANAGEMENT"}</span><h4>{assignment.donor.full_name}</h4><p>{assignment.donor.blood_group} · {assignment.donor.phone}</p>{assignment.donated_at && <small>Donation date: {new Date(assignment.donated_at).toLocaleString()}</small>}</div><div className="blood-assignment-actions">{assignment.status !== "donated" && <><button disabled={busyId === assignment.id} onClick={() => changeAssignment(request, "donated")}>Confirm blood donated &amp; complete</button><button disabled={busyId === assignment.id} onClick={() => removeAssignment(request)}>Cancel confirmed donor</button></>}</div></div>
                : <div className="blood-admin-assign"><select value={selectedDonors[request.id] || ""} onChange={(event) => setSelectedDonors((current) => ({ ...current, [request.id]: event.target.value }))}><option value="">Select matching active donor</option>{matchingDonors.map((donor) => <option key={donor.id} value={donor.id}>{donor.full_name} · {donor.phone}</option>)}</select><button disabled={busyId === request.id} onClick={() => assignDonor(request)}>Confirm donor</button></div>}
              <footer><small>Request: {new Date(request.created_at).toLocaleString()}</small><button className="blood-delete-button" disabled={busyId === request.id} onClick={() => removeRequest(request)}>Delete complete patient record</button></footer>
            </article>;
          })}
        </div>}
      </section>}

      {!loading && tab === "donors" && <div className="blood-donor-list blood-donor-list--wide">
        <div className="blood-donor-list__title"><h3>Donor records / ڈونر ریکارڈ</h3><span>{filteredDonors.length} result(s)</span></div>
        {filteredDonors.length === 0 ? <p className="blood-empty">No matching donor found.</p> : <div className="blood-admin-card-grid">
          {filteredDonors.map((donor) => <article className={`blood-donor ${donor.is_available === false ? "blood-donor--inactive" : ""}`} key={donor.id}><div className="blood-donor__main"><strong>{donor.blood_group}</strong><span><b>{donor.full_name}</b><small>{donor.phone}</small><small>{donor.address}</small>{donor.last_donated_at && <small className="blood-donor__last-date">Last donated: {new Date(donor.last_donated_at).toLocaleString()}</small>}{donor.next_available_on && <small>Next eligible date: {donor.next_available_on}</small>}</span><em className={donor.is_available === false ? "unavailable" : "available"}>{donor.is_available === false ? "INACTIVE" : "ACTIVE"}</em></div><div className="blood-donor__actions"><button type="button" onClick={() => printBloodDonorSlip(donor)}>Print donor slip</button><button type="button" disabled={busyId === donor.id} onClick={() => changeDonorAvailability(donor, donor.is_available === false)}>{donor.is_available === false ? "Reactivate donor" : "Mark unavailable"}</button><button className="blood-delete-button" disabled={busyId === donor.id} type="button" onClick={() => removeDonor(donor)}>{busyId === donor.id ? "Working…" : "Delete donor card"}</button></div></article>)}
        </div>}
      </div>}
    </section>
  );
}
