import { supabase } from "./supabase";

export async function prepareMembershipPhoto(file) {
  if (!file) return null;
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Photo must be smaller than 8 MB.");

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Photo could not be opened."));
      element.src = imageUrl;
    });
    const maxSide = 640;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

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
    p_photo_data: form.photoData || null,
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

export async function updateMembership(id, updates) {
  const { data, error } = await supabase
    .from("memberships")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function cancelMembership(id) {
  return updateMembership(id, { status: "cancelled" });
}

export async function reactivateMembership(id) {
  return updateMembership(id, { status: "approved" });
}
