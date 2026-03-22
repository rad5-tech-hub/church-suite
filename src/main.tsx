import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

async function cleanupServiceWorkerAndCache() {
  try {
    let changed = false;

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      if (registrations.length > 0) {
        await Promise.all(
          registrations.map((registration) => registration.unregister()),
        );
        changed = true;
        console.log("Old service workers removed");
      }
    }

    if ("caches" in window) {
      const cacheNames = await caches.keys();

      if (cacheNames.length > 0) {
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        changed = true;
        console.log("Old caches removed");
      }
    }

    const alreadyReloaded = sessionStorage.getItem("sw-cleanup-reloaded");

    if (changed && !alreadyReloaded) {
      sessionStorage.setItem("sw-cleanup-reloaded", "true");
      window.location.replace(window.location.href);
      return false;
    }
  } catch (error) {
    console.error("Cleanup failed:", error);
  }

  return true;
}

cleanupServiceWorkerAndCache().then((shouldRender) => {
  if (!shouldRender) return;

  createRoot(document.getElementById("root")!).render(<App />);
});
