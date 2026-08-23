import { useEffect, useState } from "react";
import { cancelMembership, fetchMemberships, reactivateMembership, updateMembership } from "./membershipService";

const fields = [
  ["full_name", "Full name"], ["father_name", "Father's name"], ["phone", "Phone"],
  ["whatsapp", "WhatsApp"], ["cnic", "CNIC"], ["age", "Age"],
  ["occupation", "Occupation"], ["address", "Address / Mohalla"],
];

const isCancelled = (member) => member?.status === "rejected" || member?.status === "cancelled";

export default function MembershipAdmin() {
  const [members, setMembers] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(null); const [saving, setSaving] = useState(false);
  const load = () => fetchMemberships().then(setMembers).catch((err) => setError(err.message));
  useEffect(load, []);
  const visible = members.filter((m) => `${m.full_name} ${m.membership_number} ${m.phone}`.toLowerCase().includes(search.toLowerCase()));
  const open = (member, edit = false) => { setSelected(member); setDraft({ ...member, interest_text: (member.interest_areas || []).join(", ") }); setEditing(edit); setError(""); };
  const close = () => { setSelected(null); setDraft(null); setEditing(false); };
  const save = async () => {
    setSaving(true); setError("");
    try {
      const updated = await updateMembership(selected.id, {
        full_name: draft.full_name.trim(), father_name: draft.father_name.trim(), phone: draft.phone.trim(),
        whatsapp: draft.whatsapp?.trim() || null, cnic: draft.cnic?.trim() || null,
        age: draft.age ? Number(draft.age) : null, occupation: draft.occupation?.trim() || null,
        address: draft.address.trim(), interest_areas: draft.interest_text.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setMembers((all) => all.map((item) => item.id === updated.id ? updated : item)); setSelected(updated); setEditing(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const changeStatus = async () => {
    const cancelling = !isCancelled(selected);
    if (cancelling && !window.confirm(`Cancel membership ${selected.membership_number}?`)) return;
    setSaving(true); setError("");
    try {
      const updated = cancelling ? await cancelMembership(selected.id) : await reactivateMembership(selected.id);
      setMembers((all) => all.map((item) => item.id === updated.id ? updated : item)); setSelected(updated); setDraft((current) => ({ ...current, status: updated.status }));
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  return <section className="panel membership-admin"><div className="membership-admin__head"><div><h2>Website Members</h2><p>Free memberships are approved automatically.</p></div><strong>{members.length} Members</strong></div>
    <input type="search" placeholder="Search name, member number or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
    {error && <p className="membership-error">{error}</p>}
    <div className="membership-admin__table"><table><thead><tr><th>Member #</th><th>Name</th><th>Phone</th><th>Address</th><th>Interests</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((m) => <tr key={m.id}><td><b>{m.membership_number}</b></td><td><div className="membership-admin__person">{m.photo_data ? <img src={m.photo_data} alt="" /> : <span>{m.full_name?.charAt(0)}</span>}<div>{m.full_name}<small>{m.father_name}</small></div></div></td><td>{m.phone}</td><td>{m.address}</td><td>{(m.interest_areas || []).join(", ") || "—"}</td><td><span className={isCancelled(m) ? "membership-cancelled" : "membership-approved"}>{isCancelled(m) ? "Cancelled" : "Approved"}</span></td><td><div className="membership-actions"><button onClick={() => open(m)}>View</button><button onClick={() => open(m, true)}>Edit</button></div></td></tr>)}</tbody></table>{!visible.length && <p>No members found.</p>}</div>
    {selected && <div className="membership-manage-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="membership-manage-card"><header><div><small>{selected.membership_number}</small><h3>{editing ? "Edit Membership" : "Member Details"}</h3></div><button onClick={close}>×</button></header>
      <div className="membership-manage-profile">{selected.photo_data ? <img src={selected.photo_data} alt={selected.full_name} /> : <span>{selected.full_name?.charAt(0)}</span>}<div><b>{selected.full_name}</b><small className={isCancelled(selected) ? "is-cancelled" : ""}>{isCancelled(selected) ? "Membership Cancelled" : "Active Member"}</small></div></div>
      <div className="membership-manage-fields">{fields.map(([key, label]) => <label key={key}><span>{label}</span>{editing ? (key === "address" ? <textarea rows="2" value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /> : <input type={key === "age" ? "number" : "text"} value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />) : <strong>{selected[key] || "—"}</strong>}</label>)}
        <label className="membership-manage-wide"><span>Areas of interest</span>{editing ? <input value={draft.interest_text} onChange={(e) => setDraft({ ...draft, interest_text: e.target.value })} /> : <strong>{(selected.interest_areas || []).join(", ") || "—"}</strong>}</label>
        <label><span>Joined</span><strong>{new Date(selected.created_at).toLocaleDateString("en-GB")}</strong></label>
      </div>
      {error && <p className="membership-error">{error}</p>}
      <footer>{editing ? <><button className="membership-action-secondary" onClick={() => setEditing(false)}>Cancel Edit</button><button className="membership-action-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</button></> : <><button className="membership-action-edit" onClick={() => setEditing(true)}>Edit Details</button><button className={isCancelled(selected) ? "membership-action-restore" : "membership-action-break"} disabled={saving} onClick={changeStatus}>{isCancelled(selected) ? "Reactivate Membership" : "Cancel Membership"}</button></>}</footer>
    </section></div>}
  </section>;
}
