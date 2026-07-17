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
