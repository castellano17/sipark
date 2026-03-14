import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "html2canvas": path.resolve(__dirname, "./node_modules/jspdf/dist/jspdf.es.min.js"),
      "dompurify": path.resolve(__dirname, "./node_modules/jspdf/dist/jspdf.es.min.js")
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      external: ["html2canvas"]
    }
  },
});
