import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker so the store installs on phones and opens offline.
// Skipped in development and inside the editor preview, where a cached worker served stale code.
const inPreview = window.self !== window.top || location.hostname.includes("id-preview");
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD && !inPreview) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    if ("caches" in window) caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}
