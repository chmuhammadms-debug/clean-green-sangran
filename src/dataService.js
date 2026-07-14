import { supabase } from "./supabase";

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
      slipData: record.receipt_url || "",
      paymentStatus: record.payment_status,
    })).filter((record) => record.systemId),
  };
}

export async function fetchPublicDatabaseData() {
  const [{ data: projects, error: projectError }, { data: records, error: recordError }] = await Promise.all([
    supabase.from("projects").select("id, slug, name, description, icon").eq("is_active", true).order("created_at"),
    supabase.from("transactions")
      .select("id, project_id, transaction_type, donor_name, amount, payment_method, payment_status, purpose, transaction_date")
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
      id: record.id,
      systemId: slugById.get(record.project_id),
      type: record.transaction_type === "donation" ? "income" : "expense",
      person: record.donor_name,
      amount: Number(record.amount),
      date: record.transaction_date,
      method: record.payment_method,
      details: record.purpose || "",
    })).filter((record) => record.systemId),
  };
}

export async function syncDatabaseData(systems, transactions) {
  const projectRows = systems.map((system) => ({
    slug: String(system.id),
    name: system.name,
    description: system.description || system.englishName || "Community management system",
    icon: system.icon || "📁",
    is_active: true,
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
    receipt_url: record.slipData || null,
    is_public: true,
    transaction_date: record.date,
  })).filter((record) => record.project_id);

  if (transactionRows.length) {
    const { error: upsertError } = await supabase.from("transactions").upsert(transactionRows, { onConflict: "app_id" });
    if (upsertError) throw upsertError;
  }

  const { data: databaseRecords, error: listError } = await supabase.from("transactions").select("id, app_id");
  if (listError) throw listError;
  const activeIds = new Set(transactions.map((record) => String(record.id)));
  const deletedIds = databaseRecords.filter((record) => record.app_id && !activeIds.has(record.app_id)).map((record) => record.id);
  if (deletedIds.length) {
    const { error: deleteError } = await supabase.from("transactions").delete().in("id", deletedIds);
    if (deleteError) throw deleteError;
  }
}
