import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In development, /api calls are proxied to the Spring Boot server (no CORS problems).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://localhost:8080", changeOrigin: true } },
  },
});
