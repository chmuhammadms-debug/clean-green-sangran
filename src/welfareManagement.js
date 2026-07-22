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
  {
    id: "welfare-education",
    name: "Education & Scholarship Support",
    nameUr: "تعلیم اور وظائف معاونت",
    description: "School support, scholarships, learning resources and opportunities for deserving students.",
    descriptionUr: "مستحق طلبہ کے لیے تعلیمی معاونت، وظائف، کتب اور بہتر مواقع۔",
    icon: "📚",
    isActive: true,
  },
  {
    id: "welfare-health",
    name: "Medical Camps & Health Support",
    nameUr: "طبی کیمپ اور صحت معاونت",
    description: "Medical camps, medicines, screenings and dignified health assistance for the community.",
    descriptionUr: "طبی کیمپ، ادویات، معائنہ اور گاؤں کے لیے باعزت صحت معاونت۔",
    icon: "⚕️",
    isActive: true,
  },
  {
    id: "welfare-sanitation",
    name: "Cleanliness & Waste Management",
    nameUr: "صفائی اور کچرا انتظام",
    description: "Clean streets, waste collection, dustbins and organised community cleanliness drives.",
    descriptionUr: "صاف گلیاں، کچرا جمع کرنے، ڈسٹ بن اور اجتماعی صفائی مہم کا منظم نظام۔",
    icon: "♻️",
    isActive: true,
  },
  {
    id: "welfare-infrastructure",
    name: "Streetlights, Roads & Drainage",
    nameUr: "سٹریٹ لائٹس، سڑکیں اور نکاسی",
    description: "Community records for streetlights, road repairs, lanes and drainage improvements.",
    descriptionUr: "سٹریٹ لائٹس، سڑک و گلی مرمت اور نکاسیٔ آب کی بہتری کا اجتماعی منصوبہ۔",
    icon: "💡",
    isActive: true,
  },
  {
    id: "welfare-volunteers",
    name: "Skills, Jobs & Youth Volunteers",
    nameUr: "ہنر، روزگار اور نوجوان رضاکار",
    description: "A volunteer and skills network connecting young people with service, training and work opportunities.",
    descriptionUr: "نوجوانوں کو رضاکارانہ خدمت، تربیت، ہنر اور روزگار کے مواقع سے جوڑنے کا نظام۔",
    icon: "🙌",
    isActive: true,
  },
  {
    id: "welfare-emergency",
    name: "Emergency & Disaster Relief",
    nameUr: "ہنگامی اور آفات امداد",
    description: "Rapid, transparent assistance for emergencies, accidents, fires, floods and urgent family needs.",
    descriptionUr: "حادثات، آگ، سیلاب اور خاندانوں کی فوری ضرورت کے لیے تیز اور شفاف امداد۔",
    icon: "🛟",
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
