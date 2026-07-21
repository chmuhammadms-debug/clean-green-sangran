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

  return (
    <span className={className} aria-hidden="true">
      {project?.icon || "📁"}
    </span>
  );
}
