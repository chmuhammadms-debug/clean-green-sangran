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

  return (
    <span className={className} aria-hidden="true">
      {project?.icon || "📁"}
    </span>
  );
}
