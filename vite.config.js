import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { phpServerPlugin } from "./src/plugins/vite-php-dev-server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHP_SERVER_PORT = 8000;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    phpServerPlugin({
      port: PHP_SERVER_PORT,
      host: "127.0.0.1",
    }),
  ],
  build: {
    assetsDir: "__",
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom", "axios"],
        },
      },
    },
    chunkSizeWarningLimit: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@srcjson": path.resolve(__dirname, "./srcjson"),
    },
  },
  server: {
    host: true,
    open: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${PHP_SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      "/assets": {
        target: `http://127.0.0.1:${PHP_SERVER_PORT}`,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
