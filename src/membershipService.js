import { supabase } from "./supabase";

export async function registerMembership(form) {
  const { data, error } = await supabase.rpc("register_membership", {
    p_full_name: form.fullName.trim(),
    p_father_name: form.fatherName.trim(),
    p_phone: form.phone.trim(),
    p_whatsapp: form.whatsapp.trim() || null,
    p_cnic: form.cnic.trim() || null,
    p_address: form.address.trim(),
    p_occupation: form.occupation.trim() || null,
    p_age: form.age ? Number(form.age) : null,
    p_interest_areas: form.interests,
  });
  if (error) throw error;
  const member = Array.isArray(data) ? data[0] : data;
  if (!member) throw new Error("Membership could not be created.");
  return member;
}

export async function fetchMemberships() {
  const { data, error } = await supabase.from("memberships").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
