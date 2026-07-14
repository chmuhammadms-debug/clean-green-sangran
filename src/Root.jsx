import { useEffect, useState } from "react";
import App from "./App";
import PublicDashboard from "./PublicDashboard";
import { fetchSiteSettings, saveSiteSettings } from "./dataService";
import { DEFAULT_SITE_SETTINGS } from "./siteSettings";

function Root() {
  const [adminMode, setAdminMode] = useState(false);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadSettings = async () => {
    try { setSiteSettings(await fetchSiteSettings()); } catch (error) { console.warn("Website settings not ready", error); }
  };
  useEffect(() => { loadSettings(); }, []);

  const publishSettings = async (nextSettings) => {
    setSavingSettings(true);
    try { setSiteSettings(await saveSiteSettings(nextSettings)); }
    finally { setSavingSettings(false); }
  };

  if (!adminMode) {
    return <PublicDashboard onAdminLogin={() => setAdminMode(true)} siteSettings={siteSettings} onSettingsChanged={loadSettings} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAdminMode(false)}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "18px",
          zIndex: 1000,
          padding: "11px 16px",
          color: "white",
          fontWeight: 700,
          background: "#2563eb",
          border: 0,
          borderRadius: "10px",
          boxShadow: "0 8px 22px rgba(37, 99, 235, 0.3)",
          cursor: "pointer",
        }}
      >
        View Public Website
      </button>
      <App siteSettings={siteSettings} onSaveSiteSettings={publishSettings} savingSiteSettings={savingSettings} />
    </>
  );
}

export default Root;
