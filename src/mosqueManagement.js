export const MOSQUE_PARENT_ID = "mosque";

export const defaultMosqueSystems = [
  {
    id: "mosque-noor-madina",
    name: "Jamia Masjid Noor-e-Madina",
    nameUr: "جامع مسجد نورِ مدینہ",
    description: "Independent donations, expenses, receipts and reports for Jamia Masjid Noor-e-Madina.",
    descriptionUr: "جامع مسجد نورِ مدینہ کے عطیات، اخراجات، رسیدیں اور الگ شفاف حساب۔",
    icon: "🕌",
    isActive: true,
  },
  {
    id: "mosque-bilal",
    name: "Jamia Masjid Bilal",
    nameUr: "جامع مسجد بلال",
    description: "Independent donations, expenses, receipts and reports for Jamia Masjid Bilal.",
    descriptionUr: "جامع مسجد بلال کے عطیات، اخراجات، رسیدیں اور الگ شفاف حساب۔",
    icon: "🕌",
    isActive: true,
  },
  {
    id: "mosque-3",
    name: "Masjid Rehmania",
    nameUr: "مسجد رحمانیہ",
    description: "Donations, expenses, receipts and public reports for Masjid Rehmania.",
    descriptionUr: "مسجد رحمانیہ کا الگ حساب: عطیات، اخراجات اور رپورٹس۔",
    icon: "🕌",
    isActive: true,
  },
  {
    id: "mosque-4",
    name: "Masjid Khizra",
    nameUr: "مسجد خضراء",
    description: "Donations, expenses, receipts and public reports for Masjid Khizra.",
    descriptionUr: "مسجد خضراء کا الگ حساب: عطیات، اخراجات اور رپورٹس۔",
    icon: "🕌",
    isActive: true,
  },
];

export function isMosqueParent(systemOrId) {
  const id = typeof systemOrId === "object" ? systemOrId?.id : systemOrId;
  return String(id || "") === MOSQUE_PARENT_ID;
}

export function isMosqueChild(systemOrId) {
  const id = typeof systemOrId === "object" ? systemOrId?.id : systemOrId;
  const value = String(id || "");
  return value.startsWith(`${MOSQUE_PARENT_ID}-`) && !value.startsWith("mosque-work-");
}

export function ensureMosqueSystems(systems = []) {
  const safeSystems = Array.isArray(systems) ? systems : [];
  const existingIds = new Set(safeSystems.map((system) => String(system.id)));
  return [
    ...safeSystems,
    ...defaultMosqueSystems.filter((system) => !existingIds.has(system.id)),
  ];
}

export function topLevelSystems(systems = []) {
  return systems.filter((system) => {
    const id = String(system?.id || "");
    return !isMosqueChild(system)
      && !id.startsWith("welfare-")
      && !id.startsWith("work-")
      && !id.startsWith("mosque-work-");
  });
}

export function mosqueChildSystems(systems = []) {
  const children = systems.filter((system) => isMosqueChild(system));
  const order = new Map(defaultMosqueSystems.map((system, index) => [system.id, index]));
  return children.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export function mosqueParentRecords(records = []) {
  return records.filter((record) => isMosqueParent(record.systemId) || isMosqueChild(record.systemId));
}
