import { useEffect, useState } from "react";
import { fetchMemberships } from "./membershipService";

export default function MembershipAdmin() {
  const [members, setMembers] = useState([]); const [search, setSearch] = useState(""); const [error, setError] = useState("");
  const load = () => fetchMemberships().then(setMembers).catch((err) => setError(err.message));
  useEffect(load, []);
  const visible = members.filter((m) => `${m.full_name} ${m.membership_number} ${m.phone}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="panel membership-admin"><div className="membership-admin__head"><div><h2>Website Members</h2><p>Free memberships are approved automatically.</p></div><strong>{members.length} Members</strong></div>
    <input type="search" placeholder="Search name, member number or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
    {error && <p className="membership-error">{error}</p>}
    <div className="membership-admin__table"><table><thead><tr><th>Member #</th><th>Name</th><th>Phone</th><th>Address</th><th>Interests</th><th>Status</th></tr></thead><tbody>{visible.map((m) => <tr key={m.id}><td><b>{m.membership_number}</b></td><td><div className="membership-admin__person">{m.photo_data ? <img src={m.photo_data} alt="" /> : <span>{m.full_name?.charAt(0)}</span>}<div>{m.full_name}<small>{m.father_name}</small></div></div></td><td>{m.phone}</td><td>{m.address}</td><td>{(m.interest_areas || []).join(", ") || "—"}</td><td><span className="membership-approved">Approved</span></td></tr>)}</tbody></table>{!visible.length && <p>No members found.</p>}</div>
  </section>;
}
