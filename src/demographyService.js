import { supabase } from "./supabase";

export const DEMOGRAPHY_PROJECT_ID = "add5240d-073b-4bf8-a7f4-6d71084229f9";

export function isDemographyProject(project) {
  if (!project) return false;
  const haystack = [project.id, project.databaseId, project.slug, project.name, project.title]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return project.id === DEMOGRAPHY_PROJECT_ID ||
    project.databaseId === DEMOGRAPHY_PROJECT_ID ||
    project.id === "project-1786914142749" ||
    haystack.includes("demograph") ||
    haystack.includes("census") ||
    haystack.includes("mardam") ||
    haystack.includes("مردم");
}

const EMPTY_SUMMARY = {
  households: 0,
  total_population: 0,
  adult_men: 0,
  adult_women: 0,
  boys: 0,
  girls: 0,
  children: 0,
  senior_citizens: 0,
  persons_with_disabilities: 0,
  registered_voters: 0,
  overseas_residents: 0,
  mohalla_breakdown: [],
  updated_at: null,
};

export async function fetchPublicCensusSummary() {
  const { data, error } = await supabase
    .from("census_public_summary")
    .select("*")
    .eq("id", "sangran")
    .maybeSingle();
  if (error) throw error;
  return { ...EMPTY_SUMMARY, ...(data || {}) };
}

export async function fetchCensusHouseholds() {
  const { data, error } = await supabase
    .from("census_households")
    .select("*")
    .order("household_no", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

const numberFields = [
  "adult_men", "adult_women", "boys", "girls", "senior_citizens",
  "persons_with_disabilities", "registered_voters", "overseas_residents",
];

export async function saveCensusHousehold(record) {
  const payload = {
    household_no: String(record.household_no || "").trim() || null,
    household_head: String(record.household_head || "").trim(),
    father_name: String(record.father_name || "").trim() || null,
    phone: String(record.phone || "").trim() || null,
    mohalla: String(record.mohalla || "Other").trim() || "Other",
    address: String(record.address || "").trim() || null,
    notes: String(record.notes || "").trim() || null,
    is_verified: Boolean(record.is_verified),
  };
  numberFields.forEach((key) => {
    payload[key] = Math.max(0, Number.parseInt(record[key], 10) || 0);
  });
  if (!payload.household_head) throw new Error("Household head name is required.");

  let query;
  if (record.id) {
    query = supabase.from("census_households").update(payload).eq("id", record.id);
  } else {
    query = supabase.from("census_households").insert(payload);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function deleteCensusHousehold(id) {
  const { error } = await supabase.from("census_households").delete().eq("id", id);
  if (error) throw error;
}
