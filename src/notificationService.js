import { supabase } from "./supabase";

export async function submitSuggestion({ name, phone, category, message }) {
  const { data, error } = await supabase.rpc("submit_public_suggestion", {
    p_name: String(name || "").trim(),
    p_phone: String(phone || "").trim(),
    p_category: String(category || "general").trim(),
    p_message: String(message || "").trim(),
  });
  if (error) throw error;
  return data;
}

export async function fetchAdminNotifications() {
  const { data, error } = await supabase
    .from("admin_notifications")
    .select("id, event_type, title, message, source_table, source_id, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id) {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("is_read", false);
  if (error) throw error;
}

export async function deleteAdminNotification(id) {
  const { error } = await supabase.from("admin_notifications").delete().eq("id", id);
  if (error) throw error;
}

export function subscribeAdminNotifications(onChange) {
  const channel = supabase
    .channel(`admin-notifications-${Date.now()}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "admin_notifications" },
      onChange,
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
