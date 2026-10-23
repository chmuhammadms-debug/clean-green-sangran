export function readPublicRoute(location = window.location) {
  const match = location.hash.match(/^#\/(project|mosque)\/([^/?#]+)$/);
  if (match) {
    try { return { project: decodeURIComponent(match[2]), records: false }; }
    catch { return { project: null, records: false }; }
  }
  if (location.hash === "#/directory") return { project: "service-directory", records: false };
  if (location.hash === "#/records") return { project: null, records: true };
  return { project: location.hash ? null : new URLSearchParams(location.search).get("project"), records: false };
}

export function writePublicRoute({ project = null, records = false }) {
  const url = new URL(window.location.href);
  url.searchParams.delete("project");
  url.searchParams.delete("event");
  url.hash = records ? "/records" : project === "service-directory" ? "/directory"
    : project ? `/${project.startsWith("mosque-") ? "mosque" : "project"}/${encodeURIComponent(project)}` : "";
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
}
