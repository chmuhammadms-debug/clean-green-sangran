import { supabase } from "./supabase";

export const WEBSITE_MEDIA_BUCKET = "website-media";
export const MAX_WEBSITE_IMAGE_SIZE = 8 * 1024 * 1024;

function safePart(value) {
  return String(value || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function imageExtension(file) {
  const fromName = String(file?.name || "").split(".").pop();
  if (fromName && fromName !== file?.name) return safePart(fromName);
  return String(file?.type || "image/jpeg").split("/").pop() || "jpg";
}

export function validateWebsiteImage(file) {
  if (!file) throw new Error("کوئی تصویر منتخب نہیں کی گئی۔");
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("صرف JPG, PNG, WEBP یا دوسری image file منتخب کریں۔");
  }
  if (file.size > MAX_WEBSITE_IMAGE_SIZE) {
    throw new Error("تصویر 8MB سے کم ہونی چاہیے۔");
  }
}

export async function uploadWebsiteImage(file, folder = "general") {
  validateWebsiteImage(file);
  const extension = imageExtension(file);
  const baseName = safePart(String(file.name || "image").replace(/\.[^.]+$/, ""));
  const path = `${safePart(folder)}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${baseName}.${extension}`;
  const { error } = await supabase.storage.from(WEBSITE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    if (/bucket|not found/i.test(error.message || "")) {
      throw new Error("Image Storage تیار نہیں ہے۔ پہلے RUN-IMAGE-STORAGE.sql کو Supabase SQL Editor میں چلائیں۔");
    }
    throw error;
  }
  const { data } = supabase.storage.from(WEBSITE_MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path, name: file.name };
}

export async function uploadWebsiteImages(files, folder = "general") {
  const selected = Array.from(files || []);
  if (!selected.length) return [];
  return Promise.all(selected.map((file) => uploadWebsiteImage(file, folder)));
}
