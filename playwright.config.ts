import { defineConfig } from "@playwright/test";
const basePath = process.env.TEST_BASE_PATH || "/sanctuary-presenter/";
export default defineConfig({
  testDir: "tests",
  use: { baseURL: `http://127.0.0.1:4173${basePath}` },
  webServer: {
    command: "npm run preview -- --port 4173",
    url: `http://127.0.0.1:4173${basePath}`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
