function systemId(systemOrId) {
  return String(typeof systemOrId === "object" ? systemOrId?.id : systemOrId || "");
}

export function workParentId(systemOrId, profiles = {}) {
  const id = systemId(systemOrId);
  const directParent = typeof systemOrId === "object" ? systemOrId?.parentProjectId : "";
  const savedParent = profiles?.[id]?.parentProjectId;
  const parentId = savedParent || directParent || "";
  return String(parentId).trim() || null;
}

export function isWorkItem(systemOrId, profiles = {}) {
  const id = systemId(systemOrId);
  return Boolean(workParentId(systemOrId, profiles))
    || id.startsWith("work-")
    || id.startsWith("mosque-work-");
}

export function workItemsFor(systems = [], parentProjectId, profiles = {}) {
  const parentId = String(parentProjectId || "");
  return systems.filter(
    (system) =>
      system.isActive !== false
      && workParentId(system, profiles) === parentId
  );
}

export function recordsForProject(
  records = [],
  systems = [],
  projectId,
  profiles = {},
  childProjectIds = []
) {
  const parentIds = new Set([
    String(projectId || ""),
    ...childProjectIds.map((id) => String(id)),
  ]);
  const workIds = systems
    .filter((system) => parentIds.has(String(workParentId(system, profiles) || "")))
    .map((system) => String(system.id));
  const includedIds = new Set([...parentIds, ...workIds]);
  return records.filter((record) => includedIds.has(String(record.systemId)));
}

export function createWorkItemId(parentProjectId) {
  const parentKey = String(parentProjectId || "project")
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "project";
  return `work-${parentKey}-${Date.now()}`;
}
