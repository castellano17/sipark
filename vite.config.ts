import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    },
  },
  optimizeDeps: {
    exclude: ['html2canvas', 'jspdf']
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      plugins: [
        {
          name: 'ignore-jspdf-deps',
          resolveId(source) {
            if (source === 'html2canvas' || source === 'dompurify') {
              return { id: source, external: true };
            }
            return null;
          }
        }
      ]
    }
  },
});
