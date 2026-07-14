import { useState } from "react";
import App from "./App";
import PublicDashboard from "./PublicDashboard";

function Root() {
  const [adminMode, setAdminMode] = useState(false);

  if (!adminMode) {
    return <PublicDashboard onAdminLogin={() => setAdminMode(true)} />;
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
      <App />
    </>
  );
}

export default Root;
