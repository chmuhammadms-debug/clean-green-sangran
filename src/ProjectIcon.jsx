import bloodBankIcon from "./blood-bank-icon.png";

export function isBloodBankProject(project = {}) {
  const searchableText = [
    project.id,
    project.slug,
    project.name,
    project.nameEn,
    project.nameUr,
    project.englishName,
    project.urduName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchableText.includes("blood") || /بلڈ|خون/.test(searchableText);
}

export function ensureSingleBloodBankSystem(systems = [], fallbackSystem = null) {
  const list = Array.isArray(systems) ? systems : [];
  const normalizedSystems = [];
  const seenIds = new Set();
  let bloodBankAdded = false;

  list.forEach((project) => {
    if (!project) return;

    if (isBloodBankProject(project)) {
      if (bloodBankAdded) return;

      const normalizedBloodBank = {
        ...(fallbackSystem || {}),
        ...project,
        id: fallbackSystem?.id || "blood-bank",
      };

      normalizedSystems.push(normalizedBloodBank);
      seenIds.add(String(normalizedBloodBank.id));
      bloodBankAdded = true;
      return;
    }

    const projectId = String(project.id ?? "");
    if (projectId && seenIds.has(projectId)) return;
    if (projectId) seenIds.add(projectId);
    normalizedSystems.push(project);
  });

  if (!bloodBankAdded && fallbackSystem) {
    normalizedSystems.unshift({
      ...fallbackSystem,
      id: fallbackSystem.id || "blood-bank",
    });
  }

  return normalizedSystems;
}

function WaterFiltrationIcon({ size, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Water Filtration Plant">
      <defs><linearGradient id="water-icon-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#38bdf8" /><stop offset="1" stopColor="#0369a1" /></linearGradient></defs>
      <rect x="8" y="7" width="48" height="50" rx="14" fill="#e0f2fe" />
      <path d="M20 18h24v8H20zM24 27h16v7H24z" fill="#075985" />
      <path d="M32 31c-7 9-10 13-10 18a10 10 0 0 0 20 0c0-5-3-9-10-18Z" fill="url(#water-icon-gradient)" />
      <path d="M28 48c1.2 2.5 3 3.7 5.6 3.7" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function SportsIcon({ size, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Sports and Youth Activities">
      <rect x="7" y="7" width="50" height="50" rx="15" fill="#fef3c7" />
      <path d="M22 17h20v9c0 8-4 13-10 15-6-2-10-7-10-15v-9Z" fill="#f59e0b" />
      <path d="M22 21h-7c0 8 3 13 10 14M42 21h7c0 8-3 13-10 14" fill="none" stroke="#b45309" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 40v7M24 52h16" fill="none" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <path d="m32 21 2 4 5 .7-3.5 3.4.8 4.9-4.3-2.3-4.3 2.3.8-4.9-3.5-3.4 5-.7 2-4Z" fill="#fff7ed" />
    </svg>
  );
}

function WelfareCategoryIcon({ type, size, className }) {
  const colors = {
    education: ["#ede9fe", "#6d28d9"],
    health: ["#ffe4e6", "#be123c"],
    sanitation: ["#dcfce7", "#15803d"],
    infrastructure: ["#fef3c7", "#b45309"],
    volunteers: ["#e0f2fe", "#0369a1"],
    emergency: ["#ffedd5", "#c2410c"],
  };
  const [background, stroke] = colors[type] || colors.volunteers;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={type}>
      <rect x="7" y="7" width="50" height="50" rx="15" fill={background} />
      {type === "education" && <><path d="M17 21h12c3 0 5 2 5 5v22c0-4-3-6-7-6H17V21Zm30 0H35v27c0-4 3-6 7-6h5V21Z" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" /><path d="M23 28h6M40 28h3" stroke={stroke} strokeWidth="3" strokeLinecap="round" /></>}
      {type === "health" && <><path d="M32 48S17 39 17 27c0-6 4-10 10-10 3 0 5 2 5 4 1-2 3-4 6-4 6 0 10 4 10 10 0 12-16 21-16 21Z" fill="none" stroke={stroke} strokeWidth="3.5" /><path d="M32 24v13M25.5 30.5h13" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" /></>}
      {type === "sanitation" && <><path d="M23 24h20l-2 24H25l-2-24Zm-3 0h26M28 19h10" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M30 31v10M36 31v10M48 17v6M45 20h6" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" /></>}
      {type === "infrastructure" && <><path d="M20 48V25a12 12 0 0 1 24 0v23M14 48h36" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" /><path d="M26 25h12M32 25v23M27 48l5-9 5 9" fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" /><circle cx="32" cy="20" r="4" fill={stroke} /></>}
      {type === "volunteers" && <><circle cx="32" cy="23" r="6" fill="none" stroke={stroke} strokeWidth="3.5" /><circle cx="18" cy="27" r="4" fill="none" stroke={stroke} strokeWidth="3" /><circle cx="46" cy="27" r="4" fill="none" stroke={stroke} strokeWidth="3" /><path d="M20 47c1-9 5-13 12-13s11 4 12 13M10 45c1-7 4-10 9-10M54 45c-1-7-4-10-9-10" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" /></>}
      {type === "emergency" && <><path d="M32 15c5 4 10 5 15 6v10c0 10-6 17-15 20-9-3-15-10-15-20V21c5-1 10-2 15-6Z" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinejoin="round" /><path d="M32 24v15M25 31.5h14" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" /></>}
    </svg>
  );
}

export default function ProjectIcon({ project, size = 32, className = "" }) {
  if (isBloodBankProject(project)) {
    return (
      <img
        src={bloodBankIcon}
        alt="Blood Bank"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: "contain",
          display: "inline-block",
          flex: "0 0 auto",
          verticalAlign: "middle",
        }}
      />
    );
  }

  if (String(project?.id || "") === "welfare-filtration") {
    return <WaterFiltrationIcon size={size} className={className} />;
  }

  if (String(project?.id || "") === "welfare-sports") {
    return <SportsIcon size={size} className={className} />;
  }

  const welfareIconType = {
    "welfare-education": "education",
    "welfare-health": "health",
    "welfare-sanitation": "sanitation",
    "welfare-infrastructure": "infrastructure",
    "welfare-volunteers": "volunteers",
    "welfare-emergency": "emergency",
  }[String(project?.id || "")];

  if (welfareIconType) {
    return <WelfareCategoryIcon type={welfareIconType} size={size} className={className} />;
  }

  return (
    <span className={className} aria-hidden="true">
      {project?.icon || "📁"}
    </span>
  );
}
