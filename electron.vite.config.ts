import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron",
      rollupOptions: {
        input: path.resolve(__dirname, "electron-main.ts"),
      },
    },
  },
  preload: {
    build: {
      outDir: "dist-electron",
      rollupOptions: {
        input: path.resolve(__dirname, "preload.ts"),
      },
    },
  },
  renderer: {
    root: ".",
    build: {
      outDir: "dist",
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  },
});
