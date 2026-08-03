import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, URL } from "node:url"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import { SECTIONS } from "./src/pages/docs/groups"
import { SITE_URL } from "./src/pages/docs/seo"

/* The docs deep links are the site's indexable surface beyond the three route
   entries. Emit a sitemap covering every section from the same GROUPS source
   the sidebar renders, so new sections never drift out of the sitemap. */
function sitemap(): Plugin {
  return {
    name: "sitemap",
    closeBundle() {
      const urls = [
        { loc: `${SITE_URL}/`, priority: "1.0" },
        { loc: `${SITE_URL}/docs`, priority: "0.9" },
        { loc: `${SITE_URL}/studio`, priority: "0.8" },
        ...SECTIONS.map((s) => ({ loc: `${SITE_URL}/docs/${s.id}`, priority: "0.7" })),
      ]
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(
          (u) =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
        ),
        "</urlset>",
        "",
      ].join("\n")
      writeFileSync(resolve(import.meta.dirname, "dist/sitemap.xml"), xml)
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? "/",
  plugins: [vue(), tailwindcss(), sitemap()],
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
