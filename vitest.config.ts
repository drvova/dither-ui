import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import { defineConfig } from "vitest/config"
import { utilityMap } from "./src/shared/lib/utility-map"

export default defineConfig({
  plugins: [vue(), utilityMap(fileURLToPath(new URL(".", import.meta.url)))],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@dither-kit": fileURLToPath(new URL("./dither-kit", import.meta.url)),
    },
  },
  test: {
    environment: "node", // component specs opt into jsdom via @vitest-environment
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/components/setup.ts"],
  },
})
