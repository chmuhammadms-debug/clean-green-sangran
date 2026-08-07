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

const mosqueWorkTemplates = [
  {
    key: "minaret",
    name: "Minaret Construction & Renovation",
    nameUr: "مینار کی تعمیر و مرمت",
    description: "Planning, materials, labour and progress records for minaret construction and renovation.",
    descriptionUr: "مسجد کے مینار کی تعمیر و مرمت، سامان، مزدوری اور پیش رفت کا مکمل ریکارڈ۔",
    icon: "🗼",
  },
  {
    key: "tiles",
    name: "Tile Work",
    nameUr: "ٹائلز کا کام",
    description: "Floor and wall tile work with its own budget, expenses, photos and progress record.",
    descriptionUr: "فرش اور دیواروں کی ٹائلز، بجٹ، اخراجات، تصاویر اور کام کی پیش رفت کا الگ ریکارڈ۔",
    icon: "◫",
  },
  {
    key: "solar",
    name: "Solar System",
    nameUr: "سولر سسٹم",
    description: "Solar panels, inverter, batteries, installation and maintenance project records.",
    descriptionUr: "سولر پینلز، انورٹر، بیٹری، تنصیب اور دیکھ بھال کے منصوبے کا مکمل ریکارڈ۔",
    icon: "☀️",
  },
  {
    key: "washroom",
    name: "Washroom Construction & Improvement",
    nameUr: "واش روم کی تعمیر و بہتری",
    description: "Construction, plumbing, sanitation and improvement work for mosque washrooms.",
    descriptionUr: "مسجد کے واش روم کی تعمیر، پلمبنگ، صفائی اور بہتری کے کام کا الگ ریکارڈ۔",
    icon: "🚻",
  },
];

export const defaultMosqueWorkProjects = defaultMosqueSystems.flatMap((mosque) => (
  mosqueWorkTemplates.map((template) => ({
    id: `mosque-work-${mosque.id.replace(/^mosque-/, "")}-${template.key}`,
    parentMosqueId: mosque.id,
    name: `${mosque.name} — ${template.name}`,
    nameUr: `${mosque.nameUr} — ${template.nameUr}`,
    description: template.description,
    descriptionUr: template.descriptionUr,
    icon: template.icon,
    isActive: true,
    status: "proposed",
  }))
));

const defaultMosqueAccountsById = new Map(defaultMosqueSystems.map((system) => [system.id, system]));
const defaultMosqueProjectsById = new Map(defaultMosqueWorkProjects.map((project) => [project.id, project]));

function systemId(systemOrId) {
  return String(typeof systemOrId === "object" ? systemOrId?.id : systemOrId || "");
}

export function isMosqueParent(systemOrId) {
  return systemId(systemOrId) === MOSQUE_PARENT_ID;
}

// Kept for existing callers: a mosque child is one of the four mosque accounts.
export function isMosqueChild(systemOrId) {
  return defaultMosqueAccountsById.has(systemId(systemOrId));
}

export const isMosqueAccount = isMosqueChild;

export function mosqueProjectParentId(systemOrId, profiles = {}) {
  const id = systemId(systemOrId);
  const directParent = typeof systemOrId === "object" ? systemOrId?.parentMosqueId : "";
  const savedParent = profiles?.[id]?.parentMosqueId;
  if (defaultMosqueAccountsById.has(directParent)) return directParent;
  if (defaultMosqueAccountsById.has(savedParent)) return savedParent;

  const defaultProject = defaultMosqueProjectsById.get(id);
  if (defaultProject) return defaultProject.parentMosqueId;
  if (!id.startsWith("mosque-work-")) return null;

  return [...defaultMosqueAccountsById.keys()]
    .sort((a, b) => b.length - a.length)
    .find((mosqueId) => id.startsWith(`mosque-work-${mosqueId.replace(/^mosque-/, "")}-`)) || null;
}

export function isMosqueProject(systemOrId, profiles = {}) {
  return Boolean(mosqueProjectParentId(systemOrId, profiles));
}

export function defaultMosqueProjectFor(systemOrId) {
  return defaultMosqueProjectsById.get(systemId(systemOrId)) || null;
}

export function ensureMosqueSystems(systems = []) {
  const safeSystems = Array.isArray(systems) ? systems : [];
  const defaults = [...defaultMosqueSystems, ...defaultMosqueWorkProjects];
  const defaultsById = new Map(defaults.map((system) => [system.id, system]));
  const mergedSystems = safeSystems.map((system) => {
    const fallback = defaultsById.get(String(system.id));
    if (!fallback) return system;
    return {
      ...fallback,
      ...system,
      nameUr: system.nameUr || fallback.nameUr,
      descriptionUr: system.descriptionUr || fallback.descriptionUr,
      parentMosqueId: system.parentMosqueId || fallback.parentMosqueId,
    };
  });
  const existingIds = new Set(mergedSystems.map((system) => String(system.id)));
  return [...mergedSystems, ...defaults.filter((system) => !existingIds.has(system.id))];
}

export function topLevelSystems(systems = []) {
  return systems.filter((system) => (
    !isMosqueChild(system)
    && !isMosqueProject(system)
    && !String(system?.id || "").startsWith("welfare-")
  ));
}

export function mosqueChildSystems(systems = []) {
  const order = new Map(defaultMosqueSystems.map((system, index) => [system.id, index]));
  return systems
    .filter((system) => isMosqueChild(system))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export function mosqueProjectsFor(systems = [], mosqueId, profiles = {}) {
  const defaultOrder = new Map(defaultMosqueWorkProjects.map((project, index) => [project.id, index]));
  return systems
    .filter((system) => mosqueProjectParentId(system, profiles) === mosqueId)
    .sort((a, b) => (defaultOrder.get(a.id) ?? 999) - (defaultOrder.get(b.id) ?? 999));
}

export function mosqueAccountRecords(records = [], systems = [], mosqueId, profiles = {}) {
  const projectIds = new Set(mosqueProjectsFor(systems, mosqueId, profiles).map((project) => project.id));
  return records.filter((record) => record.systemId === mosqueId || projectIds.has(record.systemId));
}

export function mosqueParentRecords(records = []) {
  return records.filter((record) => (
    isMosqueParent(record.systemId)
    || isMosqueChild(record.systemId)
    || isMosqueProject(record.systemId)
  ));
}

export function createMosqueProjectId(mosqueId) {
  const mosqueKey = String(mosqueId).replace(/^mosque-/, "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  return `mosque-work-${mosqueKey}-${Date.now()}`;
}
