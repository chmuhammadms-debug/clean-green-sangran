import welfareGeneralCover from "./assets/projects/welfare/general.svg";
import welfareFiltrationCover from "./assets/projects/welfare/filtration.svg";
import welfareSportsCover from "./assets/projects/welfare/sports.svg";
import welfareEducationCover from "./assets/projects/welfare/education.svg";
import welfareHealthCover from "./assets/projects/welfare/health.svg";
import welfareSanitationCover from "./assets/projects/welfare/sanitation.svg";
import welfareInfrastructureCover from "./assets/projects/welfare/infrastructure.svg";
import welfareVolunteersCover from "./assets/projects/welfare/volunteers.svg";
import welfareEmergencyCover from "./assets/projects/welfare/emergency.svg";

export const WELFARE_PARENT_ID = "welfare";

export const defaultWelfareSystems = [
  {
    id: "welfare-general",
    name: "Community Welfare Support",
    nameUr: "اجتماعی فلاح و معاونت",
    description: "Transparent support for deserving families, emergencies and shared community needs.",
    descriptionUr: "مستحق خاندانوں، ہنگامی ضروریات اور اجتماعی فلاح کے لیے شفاف معاونت۔",
    icon: "🤝",
    coverImage: welfareGeneralCover,
    galleryUrls: [welfareGeneralCover],
    isActive: true,
  },
  {
    id: "welfare-filtration",
    name: "Water Filtration Plant",
    nameUr: "واٹر فلٹریشن پلانٹ",
    description: "A community project for safe, clean and accessible drinking water in Sangran.",
    descriptionUr: "سنگراں میں صاف، محفوظ اور آسانی سے دستیاب پینے کے پانی کا اجتماعی منصوبہ۔",
    icon: "🚰",
    coverImage: welfareFiltrationCover,
    galleryUrls: [welfareFiltrationCover],
    isActive: true,
  },
  {
    id: "welfare-sports",
    name: "Sports & Youth Activities",
    nameUr: "کھیل اور نوجوانوں کی سرگرمیاں",
    description: "Healthy sports, youth engagement and positive community activities for every age group.",
    descriptionUr: "ہر عمر کے لیے صحت مند کھیل، نوجوانوں کی شمولیت اور مثبت اجتماعی سرگرمیاں۔",
    icon: "🏆",
    coverImage: welfareSportsCover,
    galleryUrls: [welfareSportsCover],
    isActive: true,
  },
  {
    id: "welfare-education",
    name: "Education & Scholarship Support",
    nameUr: "تعلیم اور وظائف معاونت",
    description: "School support, scholarships, learning resources and opportunities for deserving students.",
    descriptionUr: "مستحق طلبہ کے لیے تعلیمی معاونت، وظائف، کتب اور بہتر مواقع۔",
    icon: "📚",
    coverImage: welfareEducationCover,
    galleryUrls: [welfareEducationCover],
    isActive: true,
  },
  {
    id: "welfare-health",
    name: "Medical Camps & Health Support",
    nameUr: "طبی کیمپ اور صحت معاونت",
    description: "Medical camps, medicines, screenings and dignified health assistance for the community.",
    descriptionUr: "طبی کیمپ، ادویات، معائنہ اور گاؤں کے لیے باعزت صحت معاونت۔",
    icon: "⚕️",
    coverImage: welfareHealthCover,
    galleryUrls: [welfareHealthCover],
    isActive: true,
  },
  {
    id: "welfare-sanitation",
    name: "Cleanliness & Waste Management",
    nameUr: "صفائی اور کچرا انتظام",
    description: "Clean streets, waste collection, dustbins and organised community cleanliness drives.",
    descriptionUr: "صاف گلیاں، کچرا جمع کرنے، ڈسٹ بن اور اجتماعی صفائی مہم کا منظم نظام۔",
    icon: "♻️",
    coverImage: welfareSanitationCover,
    galleryUrls: [welfareSanitationCover],
    isActive: true,
  },
  {
    id: "welfare-infrastructure",
    name: "Streetlights, Roads & Drainage",
    nameUr: "سٹریٹ لائٹس، سڑکیں اور نکاسی",
    description: "Community records for streetlights, road repairs, lanes and drainage improvements.",
    descriptionUr: "سٹریٹ لائٹس، سڑک و گلی مرمت اور نکاسیٔ آب کی بہتری کا اجتماعی منصوبہ۔",
    icon: "💡",
    coverImage: welfareInfrastructureCover,
    galleryUrls: [welfareInfrastructureCover],
    isActive: true,
  },
  {
    id: "welfare-volunteers",
    name: "Skills, Jobs & Youth Volunteers",
    nameUr: "ہنر، روزگار اور نوجوان رضاکار",
    description: "A volunteer and skills network connecting young people with service, training and work opportunities.",
    descriptionUr: "نوجوانوں کو رضاکارانہ خدمت، تربیت، ہنر اور روزگار کے مواقع سے جوڑنے کا نظام۔",
    icon: "🙌",
    coverImage: welfareVolunteersCover,
    galleryUrls: [welfareVolunteersCover],
    isActive: true,
  },
  {
    id: "welfare-emergency",
    name: "Emergency & Disaster Relief",
    nameUr: "ہنگامی اور آفات امداد",
    description: "Rapid, transparent assistance for emergencies, accidents, fires, floods and urgent family needs.",
    descriptionUr: "حادثات، آگ، سیلاب اور خاندانوں کی فوری ضرورت کے لیے تیز اور شفاف امداد۔",
    icon: "🛟",
    coverImage: welfareEmergencyCover,
    galleryUrls: [welfareEmergencyCover],
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
  const defaultsById = new Map(defaultWelfareSystems.map((system) => [system.id, system]));
  const mergedSystems = safeSystems.map((system) => {
    const defaults = defaultsById.get(String(system.id));
    if (!defaults) return system;
    return {
      ...defaults,
      ...system,
      nameUr: system.nameUr || defaults.nameUr,
      descriptionUr: system.descriptionUr || defaults.descriptionUr,
      coverImage: system.coverImage || defaults.coverImage,
      galleryUrls: Array.isArray(system.galleryUrls) && system.galleryUrls.length
        ? system.galleryUrls
        : defaults.galleryUrls,
    };
  });
  const existingIds = new Set(mergedSystems.map((system) => String(system.id)));
  return [
    ...mergedSystems,
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
