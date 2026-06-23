import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // O motor é puro (sem DOM), então roda no Node — rápido e isolado.
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.ts"],
  },
});
