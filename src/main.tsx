import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import AppRouter from "./routes/AppRouter";
import AppThemeProvider from "./theme/AppThemeProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppThemeProvider>
      <AppRouter />
    </AppThemeProvider>
  </React.StrictMode>
);

// Opcional: Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Error registrando SW:", err);
    });
  });
}
