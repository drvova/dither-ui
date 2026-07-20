import { fileURLToPath, URL } from "node:url"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [svelte(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@dither-kit-svelte": fileURLToPath(
        new URL("../dither-kit-svelte/index.ts", import.meta.url)
      ),
    },
  },
})
