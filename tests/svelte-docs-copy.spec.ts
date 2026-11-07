// The Svelte docs' own copy keeps the site's bans: no em dash in what a
// reader sees, and no uppercase, tracked or faded label (the gallery
// headings and the sidebar's groups were all three). Template text only:
// scripts, styles and code samples are code, and a demo's own strings (a
// marquee's dots) are the product.
import { readdirSync, readFileSync } from "node:fs"
import { describe, expect, it } from "rstack/test"

const DIR = "svelte-site/src/docs"
const templates = readdirSync(DIR)
  .filter((f) => f.endsWith(".svelte"))
  .map((f) => {
    const src = readFileSync(`${DIR}/${f}`, "utf8")
    const tpl = src
      .slice(src.lastIndexOf("</script>"))
      .replace(/<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>/g, "")
    return [f, tpl] as const
  })

describe("the Svelte docs' copy", () => {
  it("has no em dash in what a reader sees", () => {
    for (const [f, tpl] of templates) expect(tpl.includes("—"), f).toBe(false)
  })
  it("prints a prop with no default as none, never a dash", () => {
    for (const f of readdirSync(DIR).filter((f) => f.endsWith(".svelte")))
      expect(/default: "\u2014"/.test(readFileSync(`${DIR}/${f}`, "utf8")), f).toBe(false)
    expect(readFileSync(`${DIR}/PropsTable.svelte`, "utf8")).toContain('{r.default || "none"}')
  })
  it("sets no label in capitals, tracked or faded below the muted ink", () => {
    for (const [f, tpl] of templates) {
      expect(/\buppercase\b/.test(tpl), `${f}: uppercase`).toBe(false)
      // a demo field's own placeholder (`placeholder:`) is the product's look
      expect(/(?<![:\w-])text-muted-foreground\/\d+/.test(tpl), `${f}: a faded muted ink`).toBe(false)
    }
  })
})
