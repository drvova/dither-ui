// Codemod: add the frameRate knob across every shared-runtime consumer.
// Strict: each anchor must appear exactly once per file, else the file is
// reported and skipped (never guessed). CRLF preserved. --dry = report only.
import { execSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"

const DRY = process.argv.includes("--dry")
const KIT = "dither-kit"
const SVELTE = "dither-kit-svelte"

const report: string[] = []
const fail: string[] = []

const gitFiles = (glob: string): string[] =>
  execSync(`git ls-files "${glob}"`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean)

function insertOnce(file: string, src: string, anchorRe: string, insertLine: string, guard: string, label: string): string {
  if (guard && src.includes(guard)) {
    report.push(`skip(${label},present): ${file}`)
    return src
  }
  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const lines = src.split(/\r\n|\n/)
  const re = new RegExp(anchorRe)
  const hits: number[] = []
  lines.forEach((l, i) => {
    if (re.test(l)) hits.push(i)
  })
  if (hits.length !== 1) {
    fail.push(`${file} [${label}] anchor hits=${hits.length} (${anchorRe})`)
    return src
  }
  lines.splice(hits[0] + 1, 0, insertLine)
  report.push(`edit(${label}): ${file}`)
  return lines.join(eol)
}

// --- A. Vue components: props iface / defaults / runtime options --------------
const vueFiles = gitFiles(`${KIT}/*.vue`).filter((f) =>
  readFileSync(f, "utf8").includes("useDitherBackground"),
)

for (const file of vueFiles) {
  const faulty = file.includes("FaultyTerminal")
  const ifaceAnchor = faulty ? "^    pause\\?: boolean$" : "^    paused\\?: boolean$"
  const defaultsAnchor = faulty ? "^    pause: false,$" : "^    paused: false,$"
  const optsAnchor = faulty ? "^  paused: \\(\\) => props\\.pause,$" : "^  paused: \\(\\) => props\\.paused,$"
  let src = readFileSync(file, "utf8")
  src = insertOnce(file, src, ifaceAnchor, "    frameRate?: number", "frameRate?: number", "iface")
  src = insertOnce(file, src, defaultsAnchor, "    frameRate: 0,", "    frameRate: 0,", "defaults")
  src = insertOnce(file, src, optsAnchor, "  frameRate: () => props.frameRate,", "frameRate: () => props.frameRate,", "opts")
  if (!DRY) writeFileSync(file, src)
}

// --- B. registry: insert the slider before bool("paused") ---------------------
{
  const file = "src/entities/widget/model/registry.ts"
  const src = readFileSync(file, "utf8")
  const indexExports = readFileSync(`${KIT}/index.ts`, "utf8")
  const basenameByExport = new Map<string, string>()
  for (const m of indexExports.matchAll(/export \{([\s\S]*?)\} from "\.\/(\w+)\.vue"/g)) {
    const name = m[1].match(/default as (\w+)/)?.[1]
    if (name) basenameByExport.set(name, m[2])
  }
  const consumerBasenames = new Set(
    vueFiles.map((f) => f.replace(/\\/g, "/").split("/").pop()!.replace(/\.vue$/, "")),
  )
  const inScope = [...basenameByExport.entries()]
    .filter(([, base]) => consumerBasenames.has(base))
    .map(([exp]) => exp)

  const eol = src.includes("\r\n") ? "\r\n" : "\n"
  const lines = src.split(/\r\n|\n/)
  let inserted = 0
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/is: "(\w+)"/)
    if (!m || !inScope.includes(m[1])) continue
    if (lines[i].includes('number("frameRate"')) {
      report.push(`skip(reg,present): ${m[1]}`)
      continue
    }
    const idx =
      lines[i].indexOf('bool("paused")') !== -1
        ? lines[i].indexOf('bool("paused")')
        : lines[i].indexOf('bool("pause")') // FaultyTerminal's prop is `pause`
    if (idx === -1) {
      fail.push(`registry ${m[1]}: no paused/pause anchor`)
      continue
    }
    lines[i] = lines[i].slice(0, idx) + 'number("frameRate", 0, 0, 60, 1), ' + lines[i].slice(idx)
    inserted++
    report.push(`edit(reg): ${m[1]}`)
  }
  if (!DRY && inserted) writeFileSync(file, lines.join(eol))
  report.push(`registry: ${inserted} edited / ${inScope.length} in scope`)
}

// --- C. docs API tables (bottom-up insertion: later edits never shift earlier
//        table anchors) ---------------------------------------------------------
const camel = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
{
  const docsFiles = [
    "src/pages/docs/backgrounds/BackgroundsDocs.vue",
    "src/pages/docs/animations/AnimationsDocs.vue",
  ]
  const consumerKeys = new Set(
    vueFiles.map((f) => camel(f.replace(/\\/g, "/").split("/").pop()!.replace(/\.vue$/, ""))),
  )
  const hits: { file: string; key: string; open: number }[] = []
  for (const file of docsFiles) {
    const lines = readFileSync(file, "utf8").split(/\r\n|\n/)
    for (const key of consumerKeys) {
      const open = lines.findIndex((l) => new RegExp(`^  ${key}: \\[\\r?$`).test(l))
      if (open !== -1) hits.push({ file, key, open })
    }
  }
  const byFile = new Map<string, { key: string; open: number }[]>()
  for (const h of hits) {
    const list = byFile.get(h.file) ?? []
    list.push(h)
    byFile.set(h.file, list)
  }
  for (const [file, list] of byFile) {
    const src = readFileSync(file, "utf8")
    const eol = src.includes("\r\n") ? "\r\n" : "\n"
    const lines = src.split(/\r\n|\n/)
    list.sort((a, b) => b.open - a.open) // bottom-up
    for (const { key, open } of list) {
      let close = -1
      for (let i = open + 1; i < lines.length; i++) {
        if (/^ {2}\],\r?$/.test(lines[i])) {
          close = i
          break
        }
      }
      if (close === -1) {
        fail.push(`${file} ${key}: table open without close`)
        continue
      }
      const block = lines.slice(open, close).join("\n")
      if (block.includes('"frameRate"')) {
        report.push(`skip(docs,${key}): ${file}`)
        continue
      }
      const row = `    { prop: "frameRate", type: "number (fps, stop-motion)", default: "0 (smooth)" },`
      const pausedIdx = lines.slice(open, close).findIndex((l) => l.includes('{ prop: "paused"'))
      if (pausedIdx >= 0) {
        lines.splice(open + pausedIdx + 1, 0, row)
        report.push(`edit(docs,${key}): ${file}`)
      } else {
        lines.splice(close, 0, row)
        report.push(`edit(docs,${key},no-paused-row): ${file}`)
      }
    }
    if (!DRY) writeFileSync(file, lines.join(eol))
  }
  const found = new Set(hits.map((h) => h.key))
  for (const key of consumerKeys) {
    if (!found.has(key)) report.push(`MISS(docs): ${key}`)
  }
}

// --- D. Svelte backgrounds: type / destructure / bg object --------------------
{
  const svelteFiles = gitFiles(`${SVELTE}/backgrounds/*.svelte`).filter((f) =>
    readFileSync(f, "utf8").includes("use:ditherBackground"),
  )
  for (const file of svelteFiles) {
    const faulty = file.includes("FaultyTerminal")
    const typeAnchor = faulty ? "^    pause\\?: boolean$" : "^    paused\\?: boolean$"
    const destructureAnchor = faulty ? "^    pause = false,$" : "^    paused = false,$"
    const bgAnchor = faulty ? "^    paused: pause,$" : "^    paused,$"
    let src = readFileSync(file, "utf8")
    src = insertOnce(file, src, typeAnchor, "    frameRate?: number", "frameRate?: number", "sv-type")
    src = insertOnce(file, src, destructureAnchor, "    frameRate = 0,", "    frameRate = 0,", "sv-destructure")
    src = insertOnce(file, src, bgAnchor, "    frameRate,", "    frameRate,", "sv-bg")
    if (!DRY) writeFileSync(file, src)
  }
  report.push(`svelte: ${svelteFiles.length} backgrounds scanned`)
}

console.log(`--- FAIL (${fail.length}) ---`)
fail.forEach((f) => console.log("  " + f))
console.log(`--- REPORT (${report.length}) ---`)
report.forEach((r) => console.log("  " + r))
console.log(DRY ? "DRY RUN — no writes" : "WRITTEN")
