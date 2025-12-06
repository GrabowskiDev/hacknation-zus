import React from "react";
import ReactDOM from "react-dom/client";
import OfficialView from "@/components/official_helper/OfficialView"; // Twój widok urzędnika
import "./index.css"; // Importujemy te same style globalne (Tailwind)

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OfficialView />
  </React.StrictMode>
);
