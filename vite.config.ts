import { resolve } from "node:path"
import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@dither-kit": fileURLToPath(new URL("./dither-kit", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        docs: resolve(import.meta.dirname, "docs/index.html"),
        studio: resolve(import.meta.dirname, "studio/index.html"),
      },
    },
  },
})
