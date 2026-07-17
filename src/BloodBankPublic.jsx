import { useEffect, useState } from "react";
import {
  BLOOD_GROUPS,
  fetchBloodDonations,
  fetchPublicBloodSummary,
  getMyBloodDonorProfile,
  loginBloodDonor,
  printBloodDonorSlip,
  registerBloodDonor,
  resendDonorConfirmation,
  saveMyBloodDonorProfile,
  sendDonorPasswordReset,
} from "./bloodBankService";
import { supabase } from "./supabase";
import "./BloodBank.css";

const emptyRegistration = {
  fullName: "", phone: "", address: "", bloodGroup: "A+", email: "", password: "",
};

export default function BloodBankPublic({ language = "en" }) {
  const ur = language === "ur";
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState([]);
  const [mode, setMode] = useState("register");
  const [registration, setRegistration] = useState(emptyRegistration);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const nextProfile = await getMyBloodDonorProfile();
      setProfile(nextProfile);
      setDonations(nextProfile ? await fetchBloodDonations(nextProfile.id) : []);
      return nextProfile;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicBloodSummary().then(setSummary).catch(() => setSummary([]));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session || null);
      if (data.session) loadProfile();
      else setProfileLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) window.setTimeout(loadProfile, 0);
      else { setProfile(null); setDonations([]); setProfileLoading(false); }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submitRegistration = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      const data = await registerBloodDonor(registration);
      if (data.session) {
        await loadProfile();
        setMessage(ur ? "رجسٹریشن مکمل ہوگئی۔" : "Registration completed successfully.");
      } else {
        setMessage(ur ? "رجسٹریشن ہوگئی۔ اپنے ای میل کا تصدیقی لنک کھولیں، پھر لاگ اِن کریں۔" : "Registration received. Confirm the link in your email, then login.");
        setConfirmationEmail(registration.email.trim());
        setMode("login");
        setLogin({ email: registration.email, password: "" });
      }
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const submitLogin = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      await loginBloodDonor(login.email, login.password);
      const nextProfile = await loadProfile();
      if (nextProfile) {
        setMessage(ur ? "آپ لاگ اِن ہوگئے ہیں۔" : "You are now logged in.");
      } else {
        setMessage(ur ? "لاگ اِن ہوگیا، مگر donor profile نامکمل ہے۔ اسی ای میل سے دوبارہ رجسٹریشن نہ کریں؛ ایڈمن سے profile repair کروائیں۔" : "Login succeeded, but the donor profile is incomplete. Please ask the administrator to repair this account.");
      }
    } catch (error) {
      const notConfirmed = /confirm|confirmed/i.test(error.message || "");
      if (notConfirmed) setConfirmationEmail(login.email.trim());
      setMessage(notConfirmed
        ? (ur ? "پہلے اپنے ای میل میں Supabase کا confirmation link کھولیں، پھر لاگ اِن کریں۔" : "Open the Supabase confirmation link in your email first, then login.")
        : error.message);
    }
    finally { setBusy(false); }
  };

  const resendConfirmation = async () => {
    if (!confirmationEmail) return;
    setBusy(true); setMessage("");
    try {
      await resendDonorConfirmation(confirmationEmail);
      setMessage(ur ? "نیا confirmation link ای میل پر بھیج دیا گیا ہے۔" : "A new confirmation link has been sent to your email.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const resetPassword = async () => {
    if (!login.email.trim()) {
      setMessage(ur ? "پہلے اپنا ای میل لکھیں۔" : "Enter your email first.");
      return;
    }
    setBusy(true); setMessage("");
    try {
      await sendDonorPasswordReset(login.email);
      setMessage(ur ? "Password reset link ای میل پر بھیج دیا گیا ہے۔" : "A password reset link has been sent to your email.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      setProfile(await saveMyBloodDonorProfile(profile));
      setMessage(ur ? "آپ کا ریکارڈ محفوظ ہوگیا۔" : "Your donor record has been updated.");
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  return (
    <section className="blood-bank" dir={ur ? "rtl" : "ltr"}>
      <div className="blood-bank__intro">
        <div><span>{ur ? "زندگی بچانے والوں کا نیٹ ورک" : "A NETWORK THAT SAVES LIVES"}</span><h2>{ur ? "خون کا عطیہ—رقم نہیں، زندگی۔" : "Donate blood, not money."}</h2><p>{ur ? "اپنا محفوظ donor profile بنائیں تاکہ ضرورت کے وقت مناسب بلڈ گروپ فوری تلاش کیا جاسکے۔" : "Create a secure donor profile so the right blood group can be found quickly when the community needs it."}</p></div>
        <b className="blood-bank__drop">✚</b>
      </div>

      <div className="blood-summary" aria-label="Available blood donors by group">
        {BLOOD_GROUPS.map((group) => {
          const row = summary.find((item) => item.blood_group === group);
          return <div key={group}><b>{group}</b><span>{Number(row?.available_donors || 0)} {ur ? "دستیاب" : "available"}</span></div>;
        })}
      </div>

      {profileLoading ? (
        <div className="blood-auth-card blood-loading" role="status">
          <span className="blood-spinner" />
          <b>{ur ? "Donor dashboard تیار ہو رہا ہے…" : "Preparing your donor dashboard…"}</b>
        </div>
      ) : !session || !profile ? (
        <div className="blood-auth-card">
          <div className="blood-auth-tabs"><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>{ur ? "نیا donor رجسٹر کریں" : "Register as a donor"}</button><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{ur ? "Donor لاگ اِن" : "Donor login"}</button></div>
          {mode === "register" ? (
            <form className="blood-form" onSubmit={submitRegistration}>
              <label><span>{ur ? "پورا نام" : "Full name"}</span><input required value={registration.fullName} onChange={(event) => setRegistration({ ...registration, fullName: event.target.value })} /></label>
              <label><span>{ur ? "فون نمبر" : "Phone number"}</span><input required inputMode="tel" value={registration.phone} onChange={(event) => setRegistration({ ...registration, phone: event.target.value })} /></label>
              <label><span>{ur ? "بلڈ گروپ" : "Blood group"}</span><select value={registration.bloodGroup} onChange={(event) => setRegistration({ ...registration, bloodGroup: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
              <label className="wide"><span>{ur ? "مکمل پتہ" : "Address"}</span><textarea required rows="3" value={registration.address} onChange={(event) => setRegistration({ ...registration, address: event.target.value })} /></label>
              <label><span>Email</span><input required type="email" value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} /></label>
              <label><span>{ur ? "پاس ورڈ (کم از کم 6 حروف)" : "Password (minimum 6 characters)"}</span><input required minLength="6" type="password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} /></label>
              <button className="blood-submit wide" disabled={busy}>{busy ? "..." : (ur ? "محفوظ رجسٹریشن کریں" : "Create secure donor profile")}</button>
            </form>
          ) : (
            <form className="blood-form blood-form--login" onSubmit={submitLogin}>
              <label><span>Email</span><input required type="email" value={login.email} onChange={(event) => setLogin({ ...login, email: event.target.value })} /></label>
              <label><span>{ur ? "پاس ورڈ" : "Password"}</span><input required type="password" value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>
              <button className="blood-submit wide" disabled={busy}>{busy ? "..." : (ur ? "لاگ اِن کریں" : "Login")}</button>
              <button className="blood-link-button wide" disabled={busy} type="button" onClick={resetPassword}>{ur ? "پاس ورڈ بھول گئے؟" : "Forgot password?"}</button>
            </form>
          )}
          {confirmationEmail && <button className="blood-confirm-button" disabled={busy} type="button" onClick={resendConfirmation}>{ur ? "Confirmation email دوبارہ بھیجیں" : "Resend confirmation email"}</button>}
          {message && <p className="blood-message">{message}</p>}
        </div>
      ) : (
        <div className="blood-profile-card">
          <div className="blood-profile-card__head"><div><span>{ur ? "میرا محفوظ donor ریکارڈ" : "MY SECURE DONOR RECORD"}</span><h2>{profile.full_name}</h2></div><b>{profile.blood_group}</b></div>
          <form className="blood-form" onSubmit={saveProfile}>
            <label><span>{ur ? "پورا نام" : "Full name"}</span><input required value={profile.full_name} onChange={(event) => setProfile({ ...profile, full_name: event.target.value })} /></label>
            <label><span>{ur ? "فون نمبر" : "Phone"}</span><input required value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
            <label><span>{ur ? "بلڈ گروپ" : "Blood group"}</span><select value={profile.blood_group} onChange={(event) => setProfile({ ...profile, blood_group: event.target.value })}>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
            <label className="blood-check"><input type="checkbox" checked={profile.is_available !== false} onChange={(event) => setProfile({ ...profile, is_available: event.target.checked })} /><span>{ur ? "میں خون دینے کے لیے دستیاب ہوں" : "I am currently available to donate"}</span></label>
            <label className="wide"><span>{ur ? "مکمل پتہ" : "Address"}</span><textarea required rows="3" value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
            <div className="blood-profile-actions wide"><button className="blood-submit" disabled={busy}>{ur ? "ریکارڈ محفوظ کریں" : "Save profile"}</button><button type="button" onClick={() => printBloodDonorSlip(profile)}>{ur ? "Donor slip / PDF" : "Print donor slip"}</button><button type="button" onClick={() => supabase.auth.signOut()}>{ur ? "لاگ آؤٹ" : "Logout"}</button></div>
          </form>
          {donations.length > 0 && <div className="blood-history"><h3>{ur ? "خون کے عطیات کی تاریخ" : "Blood donation history"}</h3>{donations.map((item) => <div key={item.id}><b>{item.donation_date}</b><span>{item.units} {ur ? "یونٹ" : "unit(s)"}</span><small>{item.location || item.notes || "—"}</small></div>)}</div>}
          {message && <p className="blood-message">{message}</p>}
        </div>
      )}

      <p className="blood-privacy">🔒 {ur ? "فون اور پتہ صرف مجاز ایڈمن کو نظر آتے ہیں؛ عوام کو ذاتی معلومات نہیں دکھائی جاتیں۔" : "Phone numbers and addresses are visible only to authorised administrators, never to the public."}</p>
    </section>
  );
}
