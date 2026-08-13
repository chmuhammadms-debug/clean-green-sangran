import { supabase } from "./supabase";
import { mergeSiteSettings } from "./siteSettings";

function decodeStoredMedia(value) {
  if (!value) return "";
  if (typeof value !== "string") return value.url || value.data || "";

  try {
    const decoded = JSON.parse(value);
    return typeof decoded === "string" ? decoded : decoded?.url || decoded?.data || value;
  } catch {
    return value;
  }
}

function encodeStoredMedia(value) {
  if (!value) return null;

  // The existing Supabase receipt/photo columns use JSON in some deployments.
  // Double encoding preserves a URL/data URL as a JSON string there, while the
  // reader above also keeps this compatible with deployments that use text.
  return JSON.stringify(String(value));
}

export async function fetchSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("settings").eq("id", "public").maybeSingle();
  if (error) throw error;
  return mergeSiteSettings(data?.settings || {});
}

export async function saveSiteSettings(settings) {
  const { data: authData } = await supabase.auth.getUser();
  const row = { id: "public", settings: mergeSiteSettings(settings), updated_at: new Date().toISOString(), updated_by: authData.user?.id || null };
  const { error } = await supabase.from("site_settings").upsert(row, { onConflict: "id" });
  if (error) throw error;
  return row.settings;
}

export async function fetchDatabaseData() {
  const [{ data: projects, error: projectError }, { data: records, error: recordError }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
  ]);

  if (projectError) throw projectError;
  if (recordError) throw recordError;

  const slugById = new Map((projects || []).map((project) => [project.id, project.slug]));
  return {
    systems: (projects || []).map((project) => ({
      id: project.slug,
      databaseId: project.id,
      name: project.name,
      description: project.description || "",
      icon: project.icon || "📁",
      isActive: project.is_active !== false,
    })),
    transactions: (records || []).map((record) => ({
      id: record.app_id || record.id,
      databaseId: record.id,
      systemId: slugById.get(record.project_id),
      type: record.transaction_type === "donation" ? "income" : "expense",
      person: record.donor_name,
      amount: Number(record.amount),
      date: record.transaction_date,
      method: record.payment_method,
      details: record.purpose || "",
      slipName: record.receipt_name || "",
      slipData: decodeStoredMedia(record.receipt_url),
      donorPhoto: decodeStoredMedia(record.donor_photo_url),
      paymentStatus: record.payment_status,
    })).filter((record) => record.systemId),
  };
}

export async function fetchPublicDatabaseData() {
  const [{ data: projects, error: projectError }, { data: records, error: recordError }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, description, icon").eq("is_active", true).order("created_at"),
    supabase.from("transactions")
      // Public pages do not render private receipt/photo attachments. Selecting
      // only the visible columns keeps the mobile response small and reliable.
      .select("id, app_id, project_id, transaction_type, donor_name, amount, payment_method, purpose, transaction_date")
      .eq("is_public", true)
      .eq("payment_status", "verified")
      .order("transaction_date", { ascending: false }),
  ]);
  if (projectError) throw projectError;
  if (recordError) throw recordError;
  const slugById = new Map((projects || []).map((project) => [project.id, project.slug]));
  return {
    systems: (projects || []).map((project) => ({
      id: project.slug, name: project.name, description: project.description || "", icon: project.icon || "📁",
    })),
    transactions: (records || []).map((record) => ({
      id: record.app_id || record.id,
      systemId: slugById.get(record.project_id),
      type: record.transaction_type === "donation" ? "income" : "expense",
      person: record.donor_name,
      amount: Number(record.amount),
      date: record.transaction_date,
      method: record.payment_method,
      details: record.purpose || "",
      slipName: "",
      slipData: "",
      donorPhoto: "",
    })).filter((record) => record.systemId),
  };
}

export async function deleteDatabaseTransaction(recordId) {
  const id = String(recordId || "").trim();
  if (!id) throw new Error("Record ID is required.");

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("app_id", id);
  if (error) throw error;
}

export async function deleteDatabaseProject(projectSlug) {
  const slug = String(projectSlug || "").trim();
  if (!slug) throw new Error("Project ID is required.");

  const { data: project, error: lookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (!project) return;

  const { count: transactionCount, error: transactionError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("project_id", project.id);
  if (transactionError) throw transactionError;
  if (transactionCount) {
    throw new Error(`This project has ${transactionCount} financial record(s). Delete or move those records before deleting the project.`);
  }

  const { error: projectError } = await supabase
    .from("projects")
    .delete()
    .eq("id", project.id);
  if (projectError) throw projectError;
}

export async function syncDatabaseData(systems, transactions) {
  const projectRows = systems.map((system) => ({
    slug: String(system.id),
    name: system.name,
    description: system.description || system.englishName || "Community management system",
    icon: system.icon || "📁",
    is_active: system.isActive !== false,
  }));

  const { error: projectError } = await supabase.from("projects").upsert(projectRows, { onConflict: "slug" });
  if (projectError) throw projectError;

  const { data: savedProjects, error: lookupError } = await supabase.from("projects").select("id, slug");
  if (lookupError) throw lookupError;
  const projectIdBySlug = new Map(savedProjects.map((project) => [project.slug, project.id]));

  const transactionRows = transactions.map((record) => ({
    app_id: String(record.id),
    project_id: projectIdBySlug.get(String(record.systemId)),
    transaction_type: record.type === "income" ? "donation" : "expense",
    donor_name: record.person || "Anonymous",
    amount: Number(record.amount),
    payment_method: record.method || "Cash",
    payment_status: record.paymentStatus || "verified",
    purpose: record.details || "",
    receipt_name: record.slipName || "",
    receipt_url: encodeStoredMedia(record.slipData),
    donor_photo_url: record.type === "income" ? encodeStoredMedia(record.donorPhoto) : null,
    is_public: true,
    transaction_date: record.date,
  })).filter((record) => record.project_id);

  if (transactionRows.length) {
    const { error: upsertError } = await supabase.from("transactions").upsert(transactionRows, { onConflict: "app_id" });
    if (upsertError) throw upsertError;
  }
}
