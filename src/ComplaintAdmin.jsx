import { useCallback, useEffect, useMemo, useState } from "react";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
  fetchAdminComplaints,
  subscribeComplaints,
  updateAdminComplaint,
  uploadComplaintImage,
} from "./complaintService";
import "./ComplaintSystem.css";

function categoryName(id) {
  return COMPLAINT_CATEGORIES.find((item) => item.id === id)?.en || id || "Other";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function ComplaintAdminCard({ item, onSaved }) {
  const [draft, setDraft] = useState({
    status: item.status || "received",
    admin_reply: item.admin_reply || "",
    before_photo_url: item.before_photo_url || "",
    after_photo_url: item.after_photo_url || "",
    resolved_at: item.resolved_at || null,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setDraft({
      status: item.status || "received",
      admin_reply: item.admin_reply || "",
      before_photo_url: item.before_photo_url || "",
      after_photo_url: item.after_photo_url || "",
      resolved_at: item.resolved_at || null,
    });
  }, [item]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const uploadEvidence = async (key, file) => {
    if (!file) return;
    setUploading(key);
    setMessage("");
    try {
      const url = await uploadComplaintImage(file, `admin-evidence/${item.complaint_no}`);
      update(key, url);
      setMessage("Image uploaded. Press Save Update to publish it.");
    } catch (error) {
      setMessage(`Image upload failed: ${error.message}`);
    } finally {
      setUploading("");
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateAdminComplaint(item.id, draft);
      setMessage("Complaint updated successfully.");
      await onSaved();
    } catch (error) {
      setMessage(`Update failed: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const mapsUrl = item.latitude != null && item.longitude != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`
    : "";

  return (
    <article className="complaint-admin-card">
      <div className="complaint-admin-card__head">
        <div><span>{categoryName(item.category)}</span><h3>{item.complaint_no}</h3><small>{formatDate(item.created_at)}</small></div>
        <b className={`complaint-status complaint-status--${item.status}`}>{COMPLAINT_STATUSES.find((status) => status.id === item.status)?.en || item.status}</b>
      </div>

      <div className="complaint-admin-meta">
        <div><small>Name</small><b>{item.name || "Anonymous"}</b></div>
        <div><small>Phone</small><b>{item.phone || "Not provided"}</b></div>
        <div><small>Location</small><b>{item.location_text || (mapsUrl ? "GPS location" : "Not provided")}</b></div>
      </div>

      <div className="complaint-admin-description"><small>Complaint</small><p>{item.description}</p></div>
      <div className="complaint-admin-media">
        {item.photo_url && <a href={item.photo_url} target="_blank" rel="noreferrer"><img src={item.photo_url} alt="Complaint evidence" /><span>Original photo ↗</span></a>}
        {mapsUrl && <a className="complaint-map-link" href={mapsUrl} target="_blank" rel="noreferrer">⌖ Open GPS in Google Maps</a>}
      </div>

      <div className="complaint-admin-editor">
        <label><span>Status</span><select value={draft.status} onChange={(event) => update("status", event.target.value)}>{COMPLAINT_STATUSES.map((status) => <option value={status.id} key={status.id}>{status.en}</option>)}</select></label>
        <label><span>Public reply / update</span><textarea rows="3" maxLength="1500" value={draft.admin_reply} onChange={(event) => update("admin_reply", event.target.value)} placeholder="e.g. Team has inspected the location and work is in progress." /></label>
        <div className="complaint-evidence-editor">
          <label className="complaint-evidence-upload"><span>Before photo</span>{draft.before_photo_url && <img src={draft.before_photo_url} alt="Before" />}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => uploadEvidence("before_photo_url", event.target.files?.[0])} /><i>{uploading === "before_photo_url" ? "Uploading…" : "Choose image"}</i></label>
          <label className="complaint-evidence-upload"><span>After photo</span>{draft.after_photo_url && <img src={draft.after_photo_url} alt="After" />}<input type="file" accept="image/*" disabled={Boolean(uploading)} onChange={(event) => uploadEvidence("after_photo_url", event.target.files?.[0])} /><i>{uploading === "after_photo_url" ? "Uploading…" : "Choose image"}</i></label>
        </div>
        {message && <p className="complaint-admin-message">{message}</p>}
        <button className="complaint-primary" type="button" onClick={save} disabled={saving || Boolean(uploading)}>{saving ? "Saving…" : "Save Update"}</button>
      </div>
    </article>
  );
}

export default function ComplaintAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await fetchAdminComplaints());
      setError("");
    } catch (loadError) {
      console.error("Complaint admin load failed", loadError);
      setError("Complaint database is not ready. Run RUN-COMPLAINT-SYSTEM.sql in Supabase SQL Editor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeComplaints(load);
    const poller = window.setInterval(load, 15000);
    return () => { unsubscribe(); window.clearInterval(poller); };
  }, [load]);

  const counts = useMemo(() => ({
    all: items.length,
    received: items.filter((item) => item.status === "received").length,
    in_progress: items.filter((item) => item.status === "in_progress").length,
    resolved: items.filter((item) => item.status === "resolved").length,
  }), [items]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;
      return [item.complaint_no, item.name, item.phone, item.category, item.description, item.location_text]
        .some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [items, search, status]);

  return (
    <section className="complaint-admin panel" id="complaint-admin">
      <div className="complaint-admin-heading">
        <div><span>PUBLIC SERVICE</span><h2>Complaint Management</h2><p>Track, reply to and resolve public complaints without mixing them with the Suggestion Box.</p></div>
        <button type="button" onClick={load}>↻ Refresh</button>
      </div>

      <div className="complaint-admin-stats">
        {[{ id: "all", label: "All" }, ...COMPLAINT_STATUSES.map((item) => ({ id: item.id, label: item.en }))].map((item) => (
          <button type="button" className={status === item.id ? "active" : ""} key={item.id} onClick={() => setStatus(item.id)}><span>{item.label}</span><b>{counts[item.id] || 0}</b></button>
        ))}
      </div>

      <label className="complaint-admin-search"><span>⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search complaint no., name, phone, category or issue" /></label>

      {loading && <div className="complaint-admin-state">Loading complaints…</div>}
      {!loading && error && <div className="complaint-admin-state complaint-admin-state--error">{error}</div>}
      {!loading && !error && !filtered.length && <div className="complaint-admin-state">No complaints found.</div>}
      {!loading && !error && filtered.length > 0 && <div className="complaint-admin-list">{filtered.map((item) => <ComplaintAdminCard item={item} key={item.id} onSaved={load} />)}</div>}
    </section>
  );
}
