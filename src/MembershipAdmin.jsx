import { useEffect, useState } from "react";
import { deleteMembership, fetchMemberships, prepareMembershipPhoto, updateMembership } from "./membershipService";
import MembershipCard from "./MembershipCard";

const fields = [
  ["full_name", "Full name"], ["father_name", "Father's name"], ["phone", "Phone"],
  ["whatsapp", "WhatsApp"], ["cnic", "CNIC"], ["age", "Age"],
  ["occupation", "Occupation"], ["address", "Address / Mohalla"],
];

export default function MembershipAdmin() {
  const [members, setMembers] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); const [cardMember, setCardMember] = useState(null); const [editing, setEditing] = useState(false); const [draft, setDraft] = useState(null); const [saving, setSaving] = useState(false);
  const load = () => fetchMemberships().then(setMembers).catch((err) => setError(err.message));
  useEffect(load, []);
  const visible = members.filter((m) => `${m.full_name} ${m.membership_number} ${m.phone}`.toLowerCase().includes(search.toLowerCase()));
  const open = (member, edit = false) => { setSelected(member); setDraft({ ...member, interest_text: (member.interest_areas || []).join(", ") }); setEditing(edit); setError(""); };
  const close = () => { setSelected(null); setDraft(null); setEditing(false); };
  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSaving(true); setError("");
    try {
      const photoData = await prepareMembershipPhoto(file);
      setDraft((current) => ({ ...current, photo_data: photoData }));
    } catch (err) { setError(err.message); } finally { setSaving(false); event.target.value = ""; }
  };
  const save = async () => {
    setSaving(true); setError("");
    try {
      const updated = await updateMembership(selected.id, {
        full_name: draft.full_name.trim(), father_name: draft.father_name.trim(), phone: draft.phone.trim(),
        whatsapp: draft.whatsapp?.trim() || null, cnic: draft.cnic?.trim() || null,
        age: draft.age ? Number(draft.age) : null, occupation: draft.occupation?.trim() || null,
        address: draft.address.trim(), interest_areas: draft.interest_text.split(",").map((item) => item.trim()).filter(Boolean),
        photo_data: draft.photo_data || null,
      });
      setMembers((all) => all.map((item) => item.id === updated.id ? updated : item)); setSelected(updated); setEditing(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const remove = async () => {
    if (!window.confirm(`Permanently delete membership ${selected.membership_number}? This cannot be undone. The person will have to register again as a new member.`)) return;
    setSaving(true); setError("");
    try {
      await deleteMembership(selected.id);
      setMembers((all) => all.filter((item) => item.id !== selected.id)); close();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const approve = async (member) => {
    setSaving(true); setError("");
    try {
      const updated = await updateMembership(member.id, { status: "approved" });
      setMembers((all) => all.map((item) => item.id === updated.id ? updated : item));
      if (selected?.id === updated.id) setSelected(updated);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const pendingCount = members.filter((member) => member.status === "pending").length;
  return <section className="panel membership-admin"><div className="membership-admin__head"><div><h2>Website Members</h2><p>New applications remain pending until an administrator approves them.</p></div><strong>{pendingCount} Pending · {members.length} Total</strong></div>
    <input type="search" placeholder="Search name, member number or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
    {error && <p className="membership-error">{error}</p>}
    <div className="membership-admin__table"><table><thead><tr><th>Member #</th><th>Name</th><th>Phone</th><th>Address</th><th>Interests</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((m) => <tr key={m.id}><td><b>{m.status === "pending" ? "Awaiting approval" : m.membership_number}</b></td><td><div className="membership-admin__person">{m.photo_data ? <img src={m.photo_data} alt="" /> : <span>{m.full_name?.charAt(0)}</span>}<div>{m.full_name}<small>{m.father_name}</small></div></div></td><td>{m.phone}</td><td>{m.address}</td><td>{(m.interest_areas || []).join(", ") || "—"}</td><td><span className={m.status === "pending" ? "membership-pending" : "membership-approved"}>{m.status === "pending" ? "Pending" : "Approved"}</span></td><td><div className="membership-actions"><button onClick={() => open(m)}>View</button><button onClick={() => open(m, true)}>Edit</button>{m.status === "pending" ? <button className="membership-action-approve" disabled={saving} onClick={() => approve(m)}>Approve</button> : <button onClick={() => setCardMember(m)}>Card</button>}</div></td></tr>)}</tbody></table>{!visible.length && <p>No members found.</p>}</div>
    {selected && <div className="membership-manage-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="membership-manage-card"><header><div><small>{selected.membership_number}</small><h3>{editing ? "Edit Membership" : "Member Details"}</h3></div><button onClick={close}>×</button></header>
      <div className="membership-manage-profile">{(editing ? draft?.photo_data : selected.photo_data) ? <img src={editing ? draft.photo_data : selected.photo_data} alt={editing ? draft.full_name : selected.full_name} /> : <span>{(editing ? draft?.full_name : selected.full_name)?.charAt(0)}</span>}<div><b>{editing ? draft?.full_name : selected.full_name}</b><small>{selected.status === "pending" ? "Pending approval" : "Active Member"}</small>{editing && <label className="membership-photo-change"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} onChange={changePhoto} /><span>{saving ? "Preparing photo…" : "Change Photo"}</span></label>}</div></div>
      <div className="membership-manage-fields">{fields.map(([key, label]) => <label key={key}><span>{label}</span>{editing ? (key === "address" ? <textarea rows="2" value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} /> : <input type={key === "age" ? "number" : "text"} value={draft[key] || ""} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} />) : <strong>{selected[key] || "—"}</strong>}</label>)}
        <label className="membership-manage-wide"><span>Areas of interest</span>{editing ? <input value={draft.interest_text} onChange={(e) => setDraft({ ...draft, interest_text: e.target.value })} /> : <strong>{(selected.interest_areas || []).join(", ") || "—"}</strong>}</label>
        <label><span>Joined</span><strong>{new Date(selected.created_at).toLocaleDateString("en-GB")}</strong></label>
      </div>
      {error && <p className="membership-error">{error}</p>}
      <footer>{editing ? <><button className="membership-action-secondary" onClick={() => setEditing(false)}>Cancel Edit</button><button className="membership-action-save" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save Changes"}</button></> : <><button className="membership-action-edit" onClick={() => setEditing(true)}>Edit Details</button>{selected.status === "pending" ? <button className="membership-action-approve" disabled={saving} onClick={() => approve(selected)}>{saving ? "Approving…" : "Approve Membership"}</button> : <button className="membership-action-card" onClick={() => setCardMember(selected)}>View / Print Card</button>}<button className="membership-action-break" disabled={saving} onClick={remove}>{saving ? "Deleting…" : "Delete Membership"}</button></>}</footer>
    </section></div>}
    {cardMember && <div className="membership-manage-overlay membership-card-overlay" onMouseDown={(event) => event.target === event.currentTarget && setCardMember(null)}><section className="membership-manage-card membership-manage-card--id"><header><div><small>{cardMember.membership_number}</small><h3>Membership Card — Front &amp; Back</h3></div><button onClick={() => setCardMember(null)}>×</button></header><MembershipCard member={cardMember} /><footer><button className="membership-action-secondary" onClick={() => setCardMember(null)}>Close</button></footer></section></div>}
  </section>;
}
