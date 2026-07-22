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
    name: "Mosque 3 — Name Pending",
    nameUr: "مسجد نمبر 3 — نام بعد میں شامل کریں",
    description: "Independent mosque account. The admin can change this name in Project Manager.",
    descriptionUr: "مسجد کا الگ حساب۔ ایڈمن Project Manager سے نام تبدیل کرسکتا ہے۔",
    icon: "🕌",
    isActive: true,
  },
  {
    id: "mosque-4",
    name: "Mosque 4 — Name Pending",
    nameUr: "مسجد نمبر 4 — نام بعد میں شامل کریں",
    description: "Independent mosque account. The admin can change this name in Project Manager.",
    descriptionUr: "مسجد کا الگ حساب۔ ایڈمن Project Manager سے نام تبدیل کرسکتا ہے۔",
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
  return String(id || "").startsWith(`${MOSQUE_PARENT_ID}-`);
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
  return systems.filter((system) => (
    !isMosqueChild(system) && !String(system?.id || "").startsWith("welfare-")
  ));
}

export function mosqueChildSystems(systems = []) {
  const children = systems.filter((system) => isMosqueChild(system));
  const order = new Map(defaultMosqueSystems.map((system, index) => [system.id, index]));
  return children.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export function mosqueParentRecords(records = []) {
  return records.filter((record) => isMosqueParent(record.systemId) || isMosqueChild(record.systemId));
}
