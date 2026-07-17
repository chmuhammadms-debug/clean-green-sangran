import { supabase } from "./supabase";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ADMIN_EMAIL_FALLBACK = "chmuhammadms@gmail.com";

export async function isCurrentUserAdmin(user) {
  if (!user) return false;
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!error) return Boolean(data);
  return String(user.email || "").toLowerCase() === ADMIN_EMAIL_FALLBACK;
}

export async function registerBloodDonor(form) {
  const metadata = {
    registration_type: "blood_donor",
    full_name: form.fullName.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    blood_group: form.bloodGroup,
  };
  const { data, error } = await supabase.auth.signUp({
    email: form.email.trim(),
    password: form.password,
    options: {
      data: metadata,
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) throw error;

  if (data.session?.user) {
    const { error: profileError } = await supabase.from("blood_donors").upsert({
      user_id: data.session.user.id,
      email: data.session.user.email,
      full_name: metadata.full_name,
      phone: metadata.phone,
      address: metadata.address,
      blood_group: metadata.blood_group,
    }, { onConflict: "user_id" });
    if (profileError) throw profileError;
  }
  return data;
}

export async function registerPublicBloodDonor(form) {
  const { data, error } = await supabase.rpc("register_blood_donor", {
    p_full_name: form.fullName.trim(),
    p_phone: form.phone.trim(),
    p_address: form.address.trim(),
    p_blood_group: form.bloodGroup,
  });
  if (error) throw error;
  const donor = Array.isArray(data) ? data[0] : data;
  if (!donor) throw new Error("The donor record could not be created.");
  return donor;
}

export async function loginBloodDonor(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function getMyBloodDonorProfile() {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return null;
  const { data, error } = await supabase
    .from("blood_donors")
    .select("id,user_id,email,full_name,phone,address,blood_group,is_available,created_at,updated_at")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  // Accounts created before the database trigger was installed can have a
  // valid Auth login but no donor row. Repair that account from its signup
  // metadata so login always opens the donor dashboard.
  const metadata = authData.user.user_metadata || {};
  const bloodGroup = BLOOD_GROUPS.includes(metadata.blood_group)
    ? metadata.blood_group
    : "A+";
  const row = {
    user_id: authData.user.id,
    email: authData.user.email || "",
    full_name: String(metadata.full_name || "").trim(),
    phone: String(metadata.phone || "").trim(),
    address: String(metadata.address || "").trim(),
    blood_group: bloodGroup,
    is_available: true,
    updated_at: new Date().toISOString(),
  };

  if (!row.full_name || !row.phone || !row.address) return null;

  const { data: repairedProfile, error: repairError } = await supabase
    .from("blood_donors")
    .upsert(row, { onConflict: "user_id" })
    .select("id,user_id,email,full_name,phone,address,blood_group,is_available,created_at,updated_at")
    .single();
  if (repairError) throw repairError;
  return repairedProfile;
}

export async function resendDonorConfirmation(email) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
}

export async function sendDonorPasswordReset(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
  return data;
}

export async function saveMyBloodDonorProfile(profile) {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) throw new Error("Please login first.");
  const row = {
    user_id: authData.user.id,
    email: authData.user.email,
    full_name: profile.full_name.trim(),
    phone: profile.phone.trim(),
    address: profile.address.trim(),
    blood_group: profile.blood_group,
    is_available: profile.is_available !== false,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("blood_donors")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchBloodDonors() {
  const { data, error } = await supabase
    .from("blood_donors")
    .select("id,user_id,email,full_name,phone,address,blood_group,is_available,created_at,updated_at")
    .order("full_name");
  if (error) throw error;
  return data || [];
}

export async function fetchBloodDonations(donorId = null) {
  let query = supabase
    .from("blood_donations")
    .select("id,donor_id,donation_date,units,location,notes,created_at")
    .order("donation_date", { ascending: false });
  if (donorId) query = query.eq("donor_id", donorId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function recordBloodDonation({ donorId, donationDate, units, location, notes }) {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("blood_donations")
    .insert({
      donor_id: donorId,
      donation_date: donationDate,
      units: Number(units) || 1,
      location: location.trim(),
      notes: notes.trim(),
      recorded_by: authData.user?.id || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setBloodDonorAvailability(donorId, isAvailable) {
  const { data, error } = await supabase
    .from("blood_donors")
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq("id", donorId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBloodDonor(donorId) {
  const { error } = await supabase.from("blood_donors").delete().eq("id", donorId);
  if (error) throw error;
  return donorId;
}

export async function fetchPublicBloodSummary() {
  const { data, error } = await supabase.rpc("public_blood_group_summary");
  if (error) throw error;
  return data || [];
}

export async function fetchPublicBloodDonors() {
  const { data, error } = await supabase.rpc("public_blood_donor_directory");
  if (error) throw error;
  return data || [];
}

function safe(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

export function bloodDonorNumber(donor) {
  return `CGB-${String(donor?.id || "DONOR").replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function printBloodDonorSlip(donor, donation = null) {
  const popup = window.open("", "_blank", "width=780,height=900");
  if (!popup) throw new Error("Please allow pop-ups to print the donor slip.");
  popup.document.write(`<!doctype html><html><head><title>Blood Donor Slip</title><style>
    *{box-sizing:border-box}body{margin:0;padding:35px;font-family:Arial,sans-serif;color:#15251c;background:#f1f7f3}.slip{max-width:700px;margin:auto;padding:38px;border:2px solid #b91c1c;border-radius:24px;background:white}.head{display:flex;justify-content:space-between;gap:20px;align-items:center;border-bottom:2px solid #e7eee9;padding-bottom:20px}.mark{display:grid;place-items:center;width:76px;height:76px;border-radius:50%;color:white;background:#b91c1c;font-size:40px}.head h1{margin:0;color:#7f1d1d}.head p{margin:6px 0 0;color:#66756c}.group{margin:28px 0;padding:22px;border-radius:18px;text-align:center;color:white;background:#b91c1c}.group b{display:block;font-size:48px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field{padding:14px;border:1px solid #dfe8e2;border-radius:12px}.field span{display:block;margin-bottom:6px;color:#6b7b71;font-size:11px;text-transform:uppercase}.field b{overflow-wrap:anywhere}.wide{grid-column:1/-1}.foot{margin-top:28px;padding-top:18px;border-top:1px dashed #aebdb3;color:#607067;font-size:12px;text-align:center}@media print{body{padding:0;background:white}.slip{border:0}}</style></head><body><main class="slip">
    <div class="head"><div><h1>Clean &amp; Green Sangran</h1><p>Blood Bank Donor Record</p></div><div class="mark">✚</div></div>
    <div class="group"><span>Blood Group</span><b>${safe(donor.blood_group)}</b></div>
    <div class="grid"><div class="field"><span>Donor Number</span><b>${safe(bloodDonorNumber(donor))}</b></div><div class="field"><span>Name</span><b>${safe(donor.full_name)}</b></div><div class="field"><span>Phone</span><b>${safe(donor.phone)}</b></div><div class="field"><span>Availability</span><b>${donor.is_available === false ? "Not Available" : "Available"}</b></div><div class="field wide"><span>Address</span><b>${safe(donor.address)}</b></div>${donation ? `<div class="field"><span>Donation Date</span><b>${safe(donation.donation_date)}</b></div><div class="field"><span>Units</span><b>${safe(donation.units)}</b></div><div class="field wide"><span>Location / Notes</span><b>${safe(donation.location || donation.notes || "—")}</b></div>` : ""}</div>
    <p class="foot">Private donor information — for authorised community blood-bank use only.</p></main><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}
