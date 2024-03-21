import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cesium from "vite-plugin-cesium-build";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cesium()],
});
