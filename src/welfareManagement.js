export const WELFARE_PARENT_ID = "welfare";

export const defaultWelfareSystems = [
  {
    id: "welfare-general",
    name: "Community Welfare Support",
    nameUr: "اجتماعی فلاح و معاونت",
    description: "Transparent support for deserving families, emergencies and shared community needs.",
    descriptionUr: "مستحق خاندانوں، ہنگامی ضروریات اور اجتماعی فلاح کے لیے شفاف معاونت۔",
    icon: "🤝",
    isActive: true,
  },
  {
    id: "welfare-filtration",
    name: "Water Filtration Plant",
    nameUr: "واٹر فلٹریشن پلانٹ",
    description: "A community project for safe, clean and accessible drinking water in Sangran.",
    descriptionUr: "سنگراں میں صاف، محفوظ اور آسانی سے دستیاب پینے کے پانی کا اجتماعی منصوبہ۔",
    icon: "🚰",
    isActive: true,
  },
  {
    id: "welfare-sports",
    name: "Sports & Youth Activities",
    nameUr: "کھیل اور نوجوانوں کی سرگرمیاں",
    description: "Healthy sports, youth engagement and positive community activities for every age group.",
    descriptionUr: "ہر عمر کے لیے صحت مند کھیل، نوجوانوں کی شمولیت اور مثبت اجتماعی سرگرمیاں۔",
    icon: "🏆",
    isActive: true,
  },
];

export function isWelfareParent(systemOrId) {
  const id = typeof systemOrId === "object" ? systemOrId?.id : systemOrId;
  return String(id || "") === WELFARE_PARENT_ID;
}

export function isWelfareChild(systemOrId) {
  const id = typeof systemOrId === "object" ? systemOrId?.id : systemOrId;
  return String(id || "").startsWith(`${WELFARE_PARENT_ID}-`);
}

export function ensureWelfareSystems(systems = []) {
  const safeSystems = Array.isArray(systems) ? systems : [];
  const existingIds = new Set(safeSystems.map((system) => String(system.id)));
  return [
    ...safeSystems,
    ...defaultWelfareSystems.filter((system) => !existingIds.has(system.id)),
  ];
}

export function welfareChildSystems(systems = []) {
  const children = systems.filter((system) => isWelfareChild(system));
  const order = new Map(defaultWelfareSystems.map((system, index) => [system.id, index]));
  return children.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export function welfareParentRecords(records = []) {
  return records.filter((record) => isWelfareParent(record.systemId) || isWelfareChild(record.systemId));
}
