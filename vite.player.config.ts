import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

/* The player as ONE file. A HyperFrames composition exported by the Studio
   must render with no network at render time, so it carries the player
   inline — Vue, the kit and the Studio's renderers in a single IIFE plus one
   stylesheet. The site build cannot produce that (its entries share chunks),
   so `npm run build` runs this config after it, into dist/play/ next to the
   `/play/` route the same entry serves. */
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@dither-kit": fileURLToPath(new URL("./dither-kit", import.meta.url)),
    },
  },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/pages/play/main.ts", import.meta.url)),
      name: "DitherPlayer",
      formats: ["iife"],
      fileName: () => "player.js",
      cssFileName: "player",
    },
    outDir: "dist/play",
    emptyOutDir: false,
    copyPublicDir: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 2000,
  },
})
