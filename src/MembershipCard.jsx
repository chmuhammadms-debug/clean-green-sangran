const value = (item) => item || "—";

export default function MembershipCard({ member, language = "en", showActions = true }) {
  const ur = language === "ur";
  const joined = member?.created_at ? new Date(member.created_at).toLocaleDateString("en-GB") : "—";
  const printCard = () => window.print();

  return <div className="membership-card-view">
    <div className="membership-card-print-area">
      <div className="member-card-side">
        <span className="member-card-side__label">FRONT</span>
        <article className="member-id-card member-id-card--front">
          <div className="member-id-card__brand"><img src="/logo-icon-2026.png" alt="" /><div><b>CLEAN &amp; GREEN</b><em>SANGRAN</em></div><small>COMMUNITY MEMBER</small></div>
          <div className="member-id-card__body">
            <div className="member-id-card__photo">{member?.photo_data ? <img src={member.photo_data} alt={member.full_name} /> : <b>{member?.full_name?.charAt(0) || "M"}</b>}</div>
            <div className="member-id-card__details">
              <small>MEMBER NAME</small><h3>{value(member?.full_name)}</h3>
              <div className="member-id-card__number"><div><small>MEMBERSHIP NUMBER</small><strong>{value(member?.membership_number)}</strong></div><p><span>✓</span> APPROVED MEMBER</p></div>
              <dl className="member-id-card__front-info">
                <div><dt>{ur ? "موبائل" : "Mobile"}</dt><dd>{value(member?.phone)}</dd></div>
                <div><dt>{ur ? "شمولیت" : "Joined"}</dt><dd>{joined}</dd></div>
              </dl>
            </div>
          </div>
          <footer><span>Serving our village together</span><b>{new Date().getFullYear()}</b></footer>
        </article>
      </div>

      <div className="member-card-side">
        <span className="member-card-side__label">BACK</span>
        <article className="member-id-card member-id-card--back">
          <div className="member-id-card__brand"><img src="/logo-icon-2026.png" alt="" /><div><b>MEMBER DETAILS</b><em>CLEAN &amp; GREEN SANGRAN</em></div><small>{value(member?.membership_number)}</small></div>
          <dl className="member-id-card__back-info">
            <div><dt>Father's name</dt><dd>{value(member?.father_name)}</dd></div>
            <div><dt>Mobile</dt><dd>{value(member?.phone)}</dd></div>
            <div><dt>WhatsApp</dt><dd>{value(member?.whatsapp)}</dd></div>
            <div><dt>CNIC</dt><dd>{value(member?.cnic)}</dd></div>
            <div><dt>Age</dt><dd>{value(member?.age)}</dd></div>
            <div><dt>Occupation</dt><dd>{value(member?.occupation)}</dd></div>
            <div className="member-id-card__wide"><dt>Address / Mohalla</dt><dd>{value(member?.address)}</dd></div>
            <div className="member-id-card__wide"><dt>Areas of interest</dt><dd>{member?.interest_areas?.join(", ") || "—"}</dd></div>
            <div><dt>Joined</dt><dd>{joined}</dd></div>
            <div><dt>Status</dt><dd>Active Member</dd></div>
          </dl>
          <footer><span>This card belongs to a registered community member</span><b>{value(member?.membership_number)}</b></footer>
        </article>
      </div>
    </div>
    {showActions && <div className="membership-card-actions"><button type="button" onClick={printCard}>{ur ? "پرنٹ / PDF محفوظ کریں" : "Print / Save PDF"}</button></div>}
  </div>;
}
