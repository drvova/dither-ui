import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import { llmsTxt, ogCardPage, robotsTxt, sectionsManifest, sitemapXml } from "./src/pages/docs/crawler-files"

/* The docs deep links are the site's indexable surface beyond the three route
   entries. All three crawler files (sitemap, robots, llms.txt) are generated
   from the same GROUPS/SITE_URL sources the app renders — new sections are
   never hand-registered, and a dead reference fails the build. */
function crawlFiles(): Plugin {
  return {
    name: "crawl-files",
    closeBundle() {
      const out = resolve(import.meta.dirname, "dist")
      writeFileSync(resolve(out, "sitemap.xml"), sitemapXml())
      writeFileSync(resolve(out, "robots.txt"), robotsTxt())
      writeFileSync(resolve(out, "llms.txt"), llmsTxt())
      // The og engine's surface: the 1200x630 card renderer + the section
      // manifest (also the prerender's data contract for per-section pages).
      const og = resolve(out, "og")
      mkdirSync(og, { recursive: true })
      writeFileSync(resolve(og, "index.html"), ogCardPage())
      writeFileSync(resolve(og, "sections.json"), sectionsManifest())
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [vue(), tailwindcss(), crawlFiles()],
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
        // The player route; its single-file bundle is a second build
        // (vite.player.config.ts) because this one shares chunks.
        play: resolve(import.meta.dirname, "play/index.html"),
      },
    },
  },
})
