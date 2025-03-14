import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa"; // Importe o plugin PWA

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate", // Atualiza automaticamente o Service Worker
      devOptions: {
        enabled: true, // Habilita o Service Worker em desenvolvimento
      },
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      manifest: {
        name: "GhostCard",
        short_name: "GhostCard",
        description: "Aplicativo para visualização segura de dados de cartões",
        theme_color: "#000",
        background_color: "#000",
        display: "standalone",
        orientation: "portrait",
        icons: [
          {
            src: "/ghost.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/ghost.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/ghost.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        start_url: "/",
        scope: "/",
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 ano
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["react-qr-scanner"],
  },
});
