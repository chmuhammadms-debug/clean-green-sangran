import { supabase } from "./supabase";

export const COMPLAINT_CATEGORIES = [
  { id: "cleanliness", en: "Cleanliness", ur: "صفائی" },
  { id: "street-light", en: "Street Light", ur: "سٹریٹ لائٹ" },
  { id: "water", en: "Water", ur: "پانی" },
  { id: "cemetery", en: "Cemetery", ur: "قبرستان" },
  { id: "plantation", en: "Plantation", ur: "شجرکاری" },
  { id: "mosque", en: "Mosque", ur: "مسجد" },
  { id: "roads-drainage", en: "Roads / Drainage", ur: "گلی / نکاسی آب" },
  { id: "welfare", en: "Welfare", ur: "فلاحی امور" },
  { id: "other", en: "Other", ur: "دیگر" },
];

export const COMPLAINT_STATUSES = [
  { id: "received", en: "Received", ur: "موصول" },
  { id: "in_progress", en: "In Progress", ur: "کار جاری ہے" },
  { id: "resolved", en: "Resolved", ur: "حل شدہ" },
];

const COMPLAINT_BUCKET = "complaint-media";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function cleanReference(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function safeFilePart(value) {
  return String(value || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "image";
}

export async function uploadComplaintImage(file, folder = "public") {
  if (!file) return "";
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Please select an image file.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be smaller than 5 MB.");
  }

  const extension = safeFilePart(String(file.name || "image.jpg").split(".").pop() || "jpg");
  const baseName = safeFilePart(String(file.name || "image").replace(/\.[^.]+$/, ""));
  const path = `${safeFilePart(folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${baseName}.${extension}`;
  const { error } = await supabase.storage.from(COMPLAINT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(COMPLAINT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function submitPublicComplaint(values) {
  let photoUrl = "";
  if (values.photo) photoUrl = await uploadComplaintImage(values.photo, "public");

  const { data, error } = await supabase.rpc("submit_public_complaint", {
    p_name: String(values.name || "").trim(),
    p_phone: String(values.phone || "").trim(),
    p_category: String(values.category || "other").trim(),
    p_description: String(values.description || "").trim(),
    p_location_text: String(values.locationText || "").trim(),
    p_latitude: values.latitude === "" || values.latitude == null ? null : Number(values.latitude),
    p_longitude: values.longitude === "" || values.longitude == null ? null : Number(values.longitude),
    p_photo_url: photoUrl || null,
  });
  if (error) throw error;
  const record = Array.isArray(data) ? data[0] : data;
  if (!record?.complaint_no) throw new Error("Complaint reference was not returned.");
  return record;
}

export async function trackPublicComplaint(reference) {
  const { data, error } = await supabase.rpc("track_public_complaint", {
    p_complaint_no: cleanReference(reference),
  });
  if (error) throw error;
  return Array.isArray(data) ? (data[0] || null) : (data || null);
}

export async function fetchAdminComplaints() {
  const { data, error } = await supabase
    .from("complaints")
    .select("id, complaint_no, name, phone, category, description, location_text, latitude, longitude, photo_url, status, admin_reply, before_photo_url, after_photo_url, created_at, updated_at, resolved_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updateAdminComplaint(id, updates) {
  const payload = {
    status: updates.status,
    admin_reply: String(updates.admin_reply || "").trim(),
    before_photo_url: updates.before_photo_url || null,
    after_photo_url: updates.after_photo_url || null,
    resolved_at: updates.status === "resolved" ? (updates.resolved_at || new Date().toISOString()) : null,
  };
  const { error } = await supabase.from("complaints").update(payload).eq("id", id);
  if (error) throw error;
}

export function subscribeComplaints(onChange) {
  const channel = supabase
    .channel(`complaints-admin-${Date.now()}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
