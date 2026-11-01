import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root";
import "./index.css";

// A separate install identity preserves the admin shortcut's launch destination.
if (window.location.hash === "#admin") {
  document.title = "CGS Admin | Clean & Green Sangran";
  document.querySelector('link[rel="manifest"]')?.setAttribute("href", "/admin.webmanifest");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js"));
}
