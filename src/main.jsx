import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./cesium/Widgets/widgets.css";

Object.defineProperty(globalThis, "CESIUM_BASE_URL", {
  // `/cesium-package/` is the default path
  value: "/cesium-package/",
});


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
