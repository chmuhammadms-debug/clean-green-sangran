import { supabase } from "./supabase";

export const PLANT_CATEGORIES = [
  { id: "fruit", en: "Fruit tree", ur: "پھل دار" },
  { id: "shade", en: "Shade tree", ur: "سایہ دار" },
  { id: "flower", en: "Flowering plant", ur: "پھول دار" },
  { id: "vegetable", en: "Vegetable / kitchen garden", ur: "سبزی / کچن گارڈن" },
  { id: "other", en: "Other", ur: "دیگر" },
];

function normalisePlants(plants = []) {
  return plants
    .map((plant) => ({
      plant_name: String(plant.plant_name || "").trim(),
      category: String(plant.category || "other"),
      quantity: Math.max(1, Number(plant.quantity) || 1),
    }))
    .filter((plant) => plant.plant_name);
}

function householdPayload(values) {
  return {
    household_name: String(values.household_name || "").trim(),
    guardian_name: String(values.guardian_name || "").trim(),
    phone: String(values.phone || "").trim(),
    address: String(values.address || "").trim(),
    street: String(values.street || "").trim(),
    survey_date: values.survey_date,
    notes: String(values.notes || "").trim(),
    updated_at: new Date().toISOString(),
  };
}

const householdSelection = `
  id,
  household_name,
  guardian_name,
  phone,
  address,
  street,
  survey_date,
  notes,
  created_at,
  updated_at,
  plantation_plants ( id, plant_name, category, quantity )
`;

export async function fetchPlantationHouseholds() {
  const { data, error } = await supabase
    .from("plantation_households")
    .select(householdSelection)
    .order("survey_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((record) => ({
    ...record,
    plants: (record.plantation_plants || []).sort((a, b) =>
      a.plant_name.localeCompare(b.plant_name)
    ),
  }));
}

export async function createPlantationHousehold(values) {
  const plants = normalisePlants(values.plants);
  const { data: household, error: householdError } = await supabase
    .from("plantation_households")
    .insert(householdPayload(values))
    .select("id")
    .single();

  if (householdError) throw householdError;

  const { error: plantError } = await supabase.from("plantation_plants").insert(
    plants.map((plant) => ({ ...plant, household_id: household.id }))
  );

  if (plantError) {
    await supabase.from("plantation_households").delete().eq("id", household.id);
    throw plantError;
  }

  return household.id;
}

export async function updatePlantationHousehold(id, values) {
  const plants = normalisePlants(values.plants);
  const { error: householdError } = await supabase
    .from("plantation_households")
    .update(householdPayload(values))
    .eq("id", id);

  if (householdError) throw householdError;

  const { error: deleteError } = await supabase
    .from("plantation_plants")
    .delete()
    .eq("household_id", id);
  if (deleteError) throw deleteError;

  const { error: plantError } = await supabase.from("plantation_plants").insert(
    plants.map((plant) => ({ ...plant, household_id: id }))
  );
  if (plantError) throw plantError;

  return id;
}

export async function deletePlantationHousehold(id) {
  const { error } = await supabase.from("plantation_households").delete().eq("id", id);
  if (error) throw error;
  return id;
}

export async function fetchPublicPlantationStats() {
  const { data, error } = await supabase.rpc("get_public_plantation_stats");
  if (error) throw error;
  return {
    households: Number(data?.households) || 0,
    total_plants: Number(data?.total_plants) || 0,
    species: Array.isArray(data?.species) ? data.species : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    updated_at: data?.updated_at || null,
  };
}
