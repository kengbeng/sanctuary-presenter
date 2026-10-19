import packageInfo from "./package.json" with { type: "json" };
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const releaseVersion = packageInfo.version;
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const base = env.VITE_BASE_PATH || "/sanctuary-presenter/";
  if (!base.startsWith("/") || !base.endsWith("/"))
    throw Error("VITE_BASE_PATH must begin and end with /");
  return {
    base,
    define: { __APP_VERSION__: JSON.stringify(releaseVersion) },
    plugins: [
      {
        name: "release-metadata",
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "release.json",
            source: JSON.stringify({
              version: releaseVersion,
              databaseSchema: 3,
              backupFormat: 5,
              channel: "rehearsal",
            }),
          });
        },
      },
      react(),
      VitePWA({
        registerType: "prompt",
        injectRegister: false,
        manifest: {
          name: "Sanctuary Presenter",
          short_name: "Sanctuary",
          id: base,
          start_url: base,
          scope: base,
          display: "standalone",
          theme_color: "#111820",
          background_color: "#000000",
          icons: [
            {
              src: "sanctuary-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "sanctuary-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "sanctuary-maskable-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,json,webmanifest}"],
          navigateFallback: "index.html",
          cleanupOutdatedCaches: true,
        },
      }),
    ],
  };
});
