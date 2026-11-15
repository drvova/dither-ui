#!/usr/bin/env node
// dither-add: adds dither-kit components to a project, in the styling system
// the project uses. One file, Node's built-ins only, served by the site at
// add/dither-add.mjs and run straight from it:
//
//   curl -fsSL https://dither-ui.com/add/dither-add.mjs | node --input-type=module - add DitherButton
//
// It reads the site's manifest (add/manifest.json: every file of the kit a
// copy can hold, its content hash and the files it imports, each
// component's whole file set per layer, the index statements) and writes
// the component with every kit file it needs into one folder of the
// project, with that folder's own index naming only what was added. A file
// the reader changed since it was written is never replaced without
// --force: the run stops, shows the difference and writes nothing.
//
//   add <component...>   add components (and update the ones already added)
//   list                 every component the site has, the added ones marked
//   diff [component...]  what differs between the copy and the site
//
//   --styling tailwind|css|modules|stylex   --dir <path>   --from <url|folder>
//   --dry-run   --force
//
// The first add writes dither-kit.json beside package.json: the folder,
// the styling system and the site, the defaults of every later run. What
// was written is recorded in <dir>/.dither-add.json, which is how a file
// the reader changed is told from one that is the site's.
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative, resolve, sep } from "node:path"

/** The site the files come from when nothing names another. */
const SITE = "https://dither-ui.com/"
/** The manifest, beside this script on the site. */
const MANIFEST = "add/manifest.json"
/** The project's settings, written once by the first add. */
const CONFIG = "dither-kit.json"
/** What was written, inside the copy. */
const LOCK = ".dither-add.json"
const STYLINGS = ["tailwind", "css", "modules", "stylex"]
const DEFAULTS = { dir: "src/dither-kit", styling: "tailwind", from: SITE }

const HELP = `dither-add: adds dither-kit components to your project

  add <component...>   add components, with every kit file they need
  list                 the components you can add
  diff [component...]  what changed between your copy and the site

  --styling <system>   tailwind, css, modules or stylex (default tailwind)
  --dir <path>         where the kit goes (default src/dither-kit)
  --from <url|folder>  the site or a built copy of it (default ${SITE})
  --dry-run            say what would change, write nothing
  --force              replace files you changed

The first add writes ${CONFIG} with your choices: later runs read it.`

class Stop extends Error {}

/** The command line: the command, its names, its options. */
function parseArgs(argv) {
  const out = { command: undefined, names: [], dryRun: false, force: false, help: false }
  const takes = { "--styling": "styling", "--dir": "dir", "--from": "from" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--dry-run") out.dryRun = true
    else if (a === "--force") out.force = true
    else if (a === "--help" || a === "-h") out.help = true
    else if (a in takes) {
      const v = argv[++i]
      if (v === undefined || v.startsWith("--")) throw new Stop(`${a} needs a value`)
      out[takes[a]] = v
    } else if (a.startsWith("--")) throw new Stop(`unknown option ${a}`)
    else if (out.command === undefined) out.command = a
    else out.names.push(a)
  }
  if (out.styling !== undefined && !STYLINGS.includes(out.styling))
    throw new Stop(`--styling takes ${STYLINGS.join(", ")}, not ${out.styling}`)
  return out
}

const sha = (text) => createHash("sha256").update(text).digest("hex")
const readText = async (path) => (existsSync(path) ? readFile(path, "utf8") : null)
const readJson = async (path) => {
  const text = await readText(path)
  if (text === null) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Stop(`${path} is not JSON`)
  }
}

/** Where files are read from: the site over HTTP, or a folder holding a
 * build of it. */
function sourceOf(from, cwd) {
  if (/^https?:\/\//.test(from)) {
    const base = from.endsWith("/") ? from : `${from}/`
    return {
      label: base,
      async read(path) {
        const url = new URL(path, base)
        let res
        try {
          res = await fetch(url)
        } catch (e) {
          throw new Stop(`could not reach ${url.href}: ${e.cause?.message ?? e.message}`)
        }
        if (!res.ok) throw new Stop(`${url.href} answered ${res.status}`)
        return res.text()
      },
    }
  }
  const root = resolve(cwd, from)
  return {
    label: root,
    async read(path) {
      const text = await readText(join(root, ...path.split("/")))
      if (text === null) throw new Stop(`${path} is not in ${root}`)
      return text
    },
  }
}

/** A component as the reader wrote its name: the kit's export name, any
 * case, with or without its Dither prefix, in kebab case or not. */
function resolveName(name, components) {
  const names = Object.keys(components)
  if (names.includes(name)) return name
  const lower = names.filter((n) => n.toLowerCase() === name.toLowerCase())
  if (lower.length === 1) return lower[0]
  const plain = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")
  const short = (s) => plain(s).replace(/^dither/, "")
  const found = names.filter((n) => plain(n) === plain(name) || short(n) === short(name))
  if (found.length === 1) return found[0]
  if (found.length > 1) throw new Stop(`${name} could be ${found.join(" or ")}: name one`)
  const near = names.filter((n) => short(n).includes(short(name))).slice(0, 6)
  throw new Stop(`no component ${name}${near.length ? `; did you mean ${near.join(", ")}?` : ""} (list shows them all)`)
}

/** Every file a set of components needs in a layer: the styling system's
 * own files, then each component's. */
function filesFor(manifest, styling, wanted) {
  const { layer, base } = manifest.stylings[styling]
  const files = new Set(base)
  for (const name of wanted) {
    const component = manifest.components[name]
    if (!component) throw new Stop(`${name}, added before, is not on the site any more`)
    const set = component[layer]
    if (!set) throw new Stop(`${name} has no ${styling} version`)
    for (const f of set) files.add(f)
  }
  return [...files].sort()
}

/** The copy's index: the kit index's statements for the files it holds. */
function indexFor(manifest, styling, files) {
  const { path, statements } = manifest.index[manifest.stylings[styling].layer]
  const held = new Set(files)
  const lines = statements.filter((s) => held.has(s.file)).map((s) => s.text)
  const text = [
    "// Written by dither-add: the kit's index for the components added here.",
    "// Run it again to add more; it rewrites this file.",
    ...lines,
  ].join("\n")
  return { path, text: `${text}\n` }
}

/** A line diff of two texts as unified hunks, three lines of context. */
function unifiedDiff(a, b, from, to) {
  const x = a.replace(/\n$/, "").split("\n")
  const y = b.replace(/\n$/, "").split("\n")
  let start = 0
  while (start < x.length && start < y.length && x[start] === y[start]) start++
  let end = 0
  while (end < x.length - start && end < y.length - start && x[x.length - 1 - end] === y[y.length - 1 - end]) end++
  const xs = x.slice(start, x.length - end)
  const ys = y.slice(start, y.length - end)
  if (xs.length * ys.length > 4e7)
    return `--- ${from}\n+++ ${to}\n(too large to show: ${xs.length} lines against ${ys.length})\n`
  // The longest common run of the middle: lcs[i][j] is the run of xs[i..]
  // and ys[j..], read back from the start as removals, then additions.
  const w = ys.length + 1
  const lcs = new Uint32Array((xs.length + 1) * w)
  for (let i = xs.length - 1; i >= 0; i--)
    for (let j = ys.length - 1; j >= 0; j--)
      lcs[i * w + j] =
        xs[i] === ys[j] ? lcs[(i + 1) * w + j + 1] + 1 : Math.max(lcs[(i + 1) * w + j], lcs[i * w + j + 1])
  const ops = x.slice(0, start).map((line) => [" ", line])
  let i = 0
  let j = 0
  while (i < xs.length || j < ys.length) {
    if (i < xs.length && j < ys.length && xs[i] === ys[j]) {
      ops.push([" ", xs[i]])
      i++
      j++
    } else if (i < xs.length && (j === ys.length || lcs[(i + 1) * w + j] >= lcs[i * w + j + 1]))
      ops.push(["-", xs[i++]])
    else ops.push(["+", ys[j++]])
  }
  for (let k = x.length - end; k < x.length; k++) ops.push([" ", x[k]])
  // Hunks: each change with three lines around it, near ones merged.
  const changed = ops.map((o, n) => (o[0] === " " ? -1 : n)).filter((n) => n >= 0)
  if (!changed.length) return ""
  const out = [`--- ${from}`, `+++ ${to}`]
  let n = 0
  while (n < changed.length) {
    let last = n
    while (last + 1 < changed.length && changed[last + 1] - changed[last] <= 7) last++
    const lo = Math.max(0, changed[n] - 3)
    const hi = Math.min(ops.length, changed[last] + 4)
    let ax = 1
    let by = 1
    for (let k = 0; k < lo; k++) {
      if (ops[k][0] !== "+") ax++
      if (ops[k][0] !== "-") by++
    }
    const body = ops.slice(lo, hi)
    const al = body.filter((o) => o[0] !== "+").length
    const bl = body.filter((o) => o[0] !== "-").length
    out.push(`@@ -${al ? ax : ax - 1},${al} +${bl ? by : by - 1},${bl} @@`, ...body.map(([op, line]) => `${op}${line}`))
    n = last + 1
  }
  return `${out.join("\n")}\n`
}

/** The packages the files import that the project does not declare. */
async function missingPackages(manifest, files, cwd) {
  const pkg = (await readJson(join(cwd, "package.json"))) ?? {}
  const have = new Set(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies }))
  const need = new Set(files.flatMap((f) => manifest.files[f]?.packages ?? []))
  return [...need].filter((p) => !have.has(p)).sort()
}

const show = (cwd, path) => relative(cwd, path).split(sep).join("/") || "."

/** What to do once the files stand: the one alias, the stylesheet, the
 * packages. */
function nextSteps(manifest, o, dir, missing) {
  const { layer, sheets } = manifest.stylings[o.styling]
  const alias = `${dir}/${layer}`
  const lines = [
    "",
    `Point @dither-kit at ${alias}, in your bundler and your tsconfig:`,
    `  vite.config.ts   resolve: { alias: { "@dither-kit": "/${alias}" } }`,
    `  tsconfig.json    "paths": { "@dither-kit": ["./${alias}"] }`,
  ]
  if (missing.length) lines.push("", "Install what the kit imports:", `  npm i ${missing.join(" ")}`)
  const sheet = sheets.map((s) => `${dir}/${s}`)
  if (o.styling === "tailwind")
    lines.push(
      "",
      "In your Tailwind stylesheet, after tailwindcss (the path from that file):",
      `  @import "./${sheet[0]}";`,
    )
  else if (o.styling === "stylex")
    lines.push(
      "",
      "Compile the copy with your bundler's StyleX plugin, and load the tokens and the base once:",
      ...sheet.map((s) => `  import "./${s}"`),
    )
  else
    lines.push(
      "",
      "Load the kit's stylesheet once and wrap the kit's region in .dither-kit:",
      `  import "./${sheet[0]}"`,
      `  <div class="dither-kit">...</div>`,
    )
  lines.push("", `Then: import { ${o.added.join(", ")} } from "@dither-kit"`)
  return lines
}

async function add(o, manifest, source, cwd, log) {
  if (!o.names.length) throw new Stop("add needs a component: add DitherButton (list shows them all)")
  const root = resolve(cwd, o.dir)
  const lock = (await readJson(join(root, LOCK))) ?? { components: [], files: {} }
  if (lock.styling && lock.styling !== o.styling)
    throw new Stop(`${o.dir} holds the ${lock.styling} kit: add with --styling ${lock.styling}, or name another --dir`)
  o.added = [...new Set(o.names.map((n) => resolveName(n, manifest.components)))]
  const wanted = [...new Set([...lock.components, ...o.added])].sort()
  const files = filesFor(manifest, o.styling, wanted)

  // Every file as the site has it, checked against the manifest.
  const next = new Map()
  await Promise.all(
    files.map(async (f) => {
      const entry = manifest.files[f]
      const text = await source.read(entry.src)
      if (sha(text) !== entry.hash)
        throw new Stop(`${entry.src} does not match the manifest: the site is mid-deploy, try again`)
      next.set(f, text)
    }),
  )
  const index = indexFor(manifest, o.styling, files)
  next.set(index.path, index.text)

  // Each file against the copy: new, the same, the site's to update, or the reader's.
  const plan = []
  for (const [path, text] of [...next].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const at = join(root, ...path.split("/"))
    const now = await readText(at)
    const kind =
      now === null ? "add" : sha(now) === sha(text) ? "same" : lock.files[path] === sha(now) ? "update" : "changed"
    plan.push({ path, at, text, now, kind })
  }
  const changed = plan.filter((p) => p.kind === "changed")
  const writes = plan.filter((p) => p.kind === "add" || p.kind === "update" || (o.force && p.kind === "changed"))

  const word = { add: "add", update: "update", same: "same", changed: o.force ? "replace" : "keep" }
  if (o.dryRun) {
    log(`Dry run: nothing is written. ${o.added.join(", ")} into ${o.dir} (${o.styling}):`)
    for (const p of plan) log(`  ${word[p.kind].padEnd(7)} ${o.dir}/${p.path}`)
  }
  if (changed.length && !o.force) {
    for (const p of changed) log(unifiedDiff(p.now, p.text, `${o.dir}/${p.path} (yours)`, `${o.dir}/${p.path} (site)`))
    const files = changed.length === 1 ? "1 file" : `${changed.length} files`
    if (o.dryRun) {
      log(`${files} changed by you would stop the run: add --force to replace them.`)
      return 0
    }
    log(`Stopped: ${files} changed by you, shown above. Nothing was written. Add --force to replace them.`)
    return 1
  }
  if (o.dryRun) return 0

  for (const p of writes) {
    await mkdir(dirname(p.at), { recursive: true })
    await writeFile(p.at, p.text)
  }
  const record = { styling: o.styling, version: manifest.version, components: wanted, files: {} }
  for (const p of plan) record.files[p.path] = sha(p.text)
  await mkdir(root, { recursive: true })
  await writeFile(join(root, LOCK), `${JSON.stringify(record, null, 2)}\n`)
  const config = join(cwd, CONFIG)
  if (!existsSync(config)) {
    const own = { dir: o.dir, styling: o.styling }
    if (o.from !== SITE) own.from = o.from
    await writeFile(config, `${JSON.stringify(own, null, 2)}\n`)
  }

  const counts = ["add", "update", "changed"].map((k) => [k, plan.filter((p) => p.kind === k).length])
  const said = counts
    .filter(([, n]) => n)
    .map(([k, n]) => `${n} ${k === "add" ? "added" : k === "update" ? "updated" : "replaced"}`)
  log(`${o.added.join(", ")} in ${o.dir} (${o.styling}): ${said.length ? said.join(", ") : "already up to date"}.`)
  for (const line of nextSteps(manifest, o, show(cwd, root), await missingPackages(manifest, files, cwd))) log(line)
  return 0
}

async function list(o, manifest, cwd, log) {
  const lock = (await readJson(join(resolve(cwd, o.dir), LOCK))) ?? { components: [] }
  const { layer } = manifest.stylings[o.styling]
  const names = Object.keys(manifest.components)
    .filter((n) => manifest.components[n][layer])
    .sort()
  for (const n of names) log(lock.components.includes(n) ? `${n} (added)` : n)
  log(`${names.length} components in ${o.styling}; add one with: add <component>`)
  return 0
}

async function diff(o, manifest, source, cwd, log) {
  const root = resolve(cwd, o.dir)
  const lock = (await readJson(join(root, LOCK))) ?? { components: [] }
  const styling = lock.styling ?? o.styling
  const names = o.names.length ? o.names.map((n) => resolveName(n, manifest.components)) : lock.components
  if (!names.length) throw new Stop(`nothing added in ${o.dir} yet: name a component`)
  let differ = 0
  for (const path of filesFor(manifest, styling, names)) {
    const entry = manifest.files[path]
    const mine = await readText(join(root, ...path.split("/")))
    if (mine === null) {
      log(`missing ${o.dir}/${path}`)
      differ++
    } else if (sha(mine) !== entry.hash) {
      log(unifiedDiff(mine, await source.read(entry.src), `${o.dir}/${path} (yours)`, `${o.dir}/${path} (site)`))
      differ++
    }
  }
  log(differ ? `${differ} of the files differ from the site.` : `Your copy of ${names.join(", ")} is the site's.`)
  return differ ? 1 : 0
}

/** One run: what the command line asks, in `cwd`, said through `log`.
 * Resolves to the exit code. */
async function run(argv, cwd = process.cwd(), log = console.log) {
  const args = parseArgs(argv)
  if (args.help || !args.command) {
    log(HELP)
    return args.command || args.help ? 0 : 1
  }
  const config = (await readJson(join(cwd, CONFIG))) ?? {}
  const o = { ...DEFAULTS, ...config, ...Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined)) }
  if (!STYLINGS.includes(o.styling))
    throw new Stop(`${CONFIG} names styling ${o.styling}: take one of ${STYLINGS.join(", ")}`)
  const source = sourceOf(o.from, cwd)
  if (!["add", "list", "diff"].includes(o.command)) throw new Stop(`unknown command ${o.command}: add, list or diff`)
  let manifest
  try {
    manifest = JSON.parse(await source.read(MANIFEST))
  } catch (e) {
    throw e instanceof Stop ? e : new Stop(`${source.label}${MANIFEST} is not a manifest`)
  }
  if (o.command === "add") return add(o, manifest, source, cwd, log)
  if (o.command === "list") return list(o, manifest, cwd, log)
  return diff(o, manifest, source, cwd, log)
}

try {
  process.exitCode = await run(process.argv.slice(2))
} catch (e) {
  if (!(e instanceof Stop)) throw e
  console.error(`dither-add: ${e.message}`)
  process.exitCode = 1
}
