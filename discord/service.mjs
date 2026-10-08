// dither-ui Discord interaction service — Components V2.
//
// Serves Discord's interaction webhook: a /component slash command posts a
// Components V2 message (text + the section's og card + buttons), and the
// buttons (Re-roll / Invert / Docs) UPDATE that message in place — the embed
// itself is the interactive component demo. Stateless: the button custom_id
// carries (section, seed, invert), so any node can answer any click.
//
// Discord setup (one time, in the developer portal):
//   1. New application -> General Information: copy the PUBLIC KEY.
//   2. Settings -> Interactions Endpoints: set the endpoint to this service
//      (https://<host>/interactions). Discord sends a PING; this file
//      answers it, which is what the "Save Changes" validation needs.
//   3. Register one slash command named "component" with one string option
//      "section" (POST /applications/<id>/commands with a bot token, or the
//      portal's editor — see README).
// No bot token is required: interactions answer inline, nothing polls.
//
// Env:
//   DISCORD_PUBLIC_KEY  required — the application's public key (hex).
//   PORT                default 8787.
//   PUBLIC_BASE         public base URL serving this process (for re-rolled
//                       preview URLs). Empty -> re-rolls respond with text
//                       only (the initial card still uses the site og png).
//   DIST                dist folder to serve og assets from (default ../dist).
//
// Run: node discord/service.mjs
import { createServer } from "node:http"
import { createPublicKey, verify as cryptoVerify } from "node:crypto"
import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const PORT = Number(process.env.PORT || 8787)
const PUBLIC_BASE = (process.env.PUBLIC_BASE || "").replace(/\/$/, "")
const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || ""
// Discord's dashboard public key is the RAW 32-byte Ed25519 point (hex);
// the crypto APIs want a KeyObject, so wrap the point in the fixed 12-byte
// Ed25519 SPKI DER prefix (a full SPKI paste of 44 bytes passes through).
const PUBLIC_KEY_OBJ = (() => {
  if (!PUBLIC_KEY) return null
  const raw = Buffer.from(PUBLIC_KEY, "hex")
  const der = raw.length === 32
    ? Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw])
    : raw
  return createPublicKey({ key: der, format: "der", type: "spki" })
})()
const DIST = process.env.DIST || join(dirname(fileURLToPath(import.meta.url)), "..", "dist")
const SITE = "https://dither-ui.com"
// IsComponentsV2 message flag (bit 15) — the only way components render
// standalone without content cohabitation.
const IS_COMPONENTS_V2 = 1 << 15
// The ember accent, as Discord's int color.
const EMBER = 0xff9632

let SECTIONS = null // id -> manifest record
let renderPage = null // lazily launched playwright page (og renderer)

/* ------------------------------ helpers ---------------------------------- */

async function loadSections() {
  if (SECTIONS) return SECTIONS
  try {
    const raw = await readFile(join(DIST, "og", "sections.json"), "utf8")
    SECTIONS = new Map(JSON.parse(raw).map((s) => [s.id, s]))
  } catch {
    SECTIONS = new Map()
  }
  return SECTIONS
}

// Fuzzy section match: exact id, then label prefix, then id prefix.
function findSection(query) {
  const q = String(query || "").trim().toLowerCase()
  if (!q || !SECTIONS) return undefined
  const all = [...SECTIONS.values()]
  return (
    all.find((s) => s.id === q) ||
    all.find((s) => s.label.toLowerCase().startsWith(q)) ||
    all.find((s) => s.id.startsWith(q))
  )
}

function parseCustomId(id) {
  // dith:<sectionId>:<seed>:<inv>
  const [, id_, seed, inv] = String(id).split(":")
  return { id: id_, seed: Number(seed) || 0, inv: inv === "1" ? 1 : 0 }
}

function encodeCustomId(sectionId, seed, inv) {
  return `dith:${sectionId}:${seed}:${inv}`
}

/* --------------------------- og card rendering ---------------------------- */

// The site's built /og/index.html renderer, reused per seed/invert. Renders
// on demand and caches the PNG bytes in memory.
const previewCache = new Map() // key -> Buffer

async function renderPreview(sectionId, seed, inv) {
  const key = `${sectionId}:${seed}:${inv}`
  if (previewCache.has(key)) return previewCache.get(key)
  const html = await readFile(join(DIST, "og", "index.html"), "utf8").catch(() => null)
  if (!html) return null
  // The og page fetches ./sections.json — serve it via the file:// module
  // path is not possible with fetch(); instead inline the manifest into the
  // page and short-circuit the fetch.
  const sections = await loadSections()
  const withData = html.replace(
    "fetch(\"./sections.json\").then(r=>r.json())",
    `Promise.resolve().then(()=>(${JSON.stringify([...sections.values()])}))`,
  )
  if (!renderPage) {
    const { chromium } = await import("playwright-core")
    const exe =
      process.env.CHROME_PATH ||
      "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    const browser = await chromium.launch({ executablePath: exe })
    renderPage = await browser.newPage({ viewport: { width: 1200, height: 630 } })
    // Graceful shutdown: the browser must close BEFORE the loop drops, or
    // libuv asserts on the half-closed async handle under process managers.
    let closing = false
    const shutdown = () => {
      if (closing) return
      closing = true
      browser.close().catch(() => {}).finally(() => process.exit(0))
    }
    process.on("SIGINT", shutdown)
    process.on("SIGTERM", shutdown)
  }
  const page = renderPage
  await page.route("**/og/index.html**", (route) => route.fulfill({ body: withData, contentType: "text/html" }))
  await page.goto(
    `http://og.local/og/index.html?id=${encodeURIComponent(sectionId)}&seed=${seed}&inv=${inv}`,
    { waitUntil: "networkidle" },
  )
  await page.waitForFunction(() => document.title === "og-ready", undefined, { timeout: 10_000 })
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } })
  const buf = Buffer.from(png)
  previewCache.set(key, buf)
  if (previewCache.size > 256) previewCache.delete(previewCache.keys().next().value)
  return buf
}

/* --------------------------- Components V2 build -------------------------- */

function componentsFor(section, seed, inv) {
  const mediaUrl = seed === 0 && inv === 0
    ? `${SITE}/og/${section.id}.png`
    : PUBLIC_BASE
      ? `${PUBLIC_BASE}/preview/${section.id}/${seed}/${inv}.png`
      : `${SITE}/og/${section.id}.png`
  return [
    {
      type: 17, // Container
      accent_color: EMBER,
      components: [
        { type: 10, content: `## ${section.label}` }, // TextDisplay
        { type: 10, content: `${section.description}\n-# ${section.group} · dither-ui docs` },
        { type: 13, items: [{ media: { url: mediaUrl } }] }, // MediaGallery
        {
          type: 1, // ActionRow
          components: [
            {
              type: 2, // Button
              style: 1, // Primary
              label: "Re-roll seed",
              custom_id: encodeCustomId(section.id, seed === 0 ? 1 : seed + 1 + (seed % 7), inv),
              emoji: { name: "🎲" },
            },
            {
              type: 2,
              style: 2, // Secondary
              label: inv ? "Day mode" : "Night mode",
              custom_id: encodeCustomId(section.id, seed, inv ? 0 : 1),
            },
            { type: 2, style: 5, label: "Open docs", url: section.url }, // Link
          ],
        },
      ],
    },
  ]
}

function responseFor(section, seed, inv, isNew) {
  return {
    type: isNew ? 4 : 7,
    data: {
      flags: IS_COMPONENTS_V2,
      components: componentsFor(section, seed, inv),
    },
  }
}

const NOT_FOUND = {
  type: 4,
  data: {
    flags: IS_COMPONENTS_V2,
    components: [
      { type: 17, accent_color: EMBER, components: [
        { type: 10, content: "## Unknown section" },
        { type: 10, content: "Try `/component` with a docs section id or label — e.g. `slider`, `avatar`, `charts`." },
      ] },
    ],
  },
}

/* ------------------------------ http server ------------------------------- */

function verifySignature(req, body) {
  const sig = req.headers["x-signature-ed25519"]
  const ts = req.headers["x-signature-timestamp"]
  if (!sig || !ts || !PUBLIC_KEY_OBJ) return false
  try {
    // Ed25519 signs raw (no digest) — node rejects a named algorithm here
    // (ERR_CRYPTO_INVALID_DIGEST); null is the correct one-shot form.
    return cryptoVerify(
      null,
      Buffer.concat([Buffer.from(String(ts)), body]),
      PUBLIC_KEY_OBJ,
      Buffer.from(String(sig), "hex"),
    )
  } catch {
    return false
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x")

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "content-type": "text/plain" })
    res.end("ok")
    return
  }

  // Re-rolled preview images (public, referenced by Components V2 media).
  const pv = url.pathname.match(/^\/preview\/([\w-]+)\/(\d+)\/(\d)\.png$/)
  if (req.method === "GET" && pv) {
    const sections = await loadSections()
    const section = sections.get(pv[1])
    if (!section) {
      res.writeHead(404)
      res.end()
      return
    }
    const png = await renderPreview(pv[1], Number(pv[2]), Number(pv[3])).catch(() => null)
    if (!png) {
      res.writeHead(500)
      res.end()
      return
    }
    res.writeHead(200, { "content-type": "image/png", "cache-control": "public, max-age=86400" })
    res.end(png)
    return
  }

  if (req.method !== "POST" || url.pathname !== "/interactions") {
    res.writeHead(404)
    res.end()
    return
  }

  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const body = Buffer.concat(chunks)

  if (!verifySignature(req, body)) {
    res.writeHead(401)
    res.end("invalid signature")
    return
  }

  const interaction = JSON.parse(body.toString("utf8"))

  // Discord's webhook validation ping.
  if (interaction.type === 1) {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ type: 1 }))
    return
  }

  const sections = await loadSections()

  // Slash command: /component section:<name>
  if (interaction.type === 2 && interaction.data?.name === "component") {
    const query = (interaction.data.options ?? []).find((o) => o.name === "section")?.value
    const section = findSection(query)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(section ? responseFor(section, 0, 0, true) : NOT_FOUND))
    return
  }

  // Button click: re-roll / invert, updating the message in place.
  if (interaction.type === 3 && typeof interaction.data?.custom_id === "string" && interaction.data.custom_id.startsWith("dith:")) {
    const { id, seed, inv } = parseCustomId(interaction.data.custom_id)
    const section = sections.get(id)
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify(section ? responseFor(section, seed, inv, false) : NOT_FOUND))
    return
  }

  res.writeHead(400)
  res.end()
})

// Boot: load the manifest eagerly so a bad build fails loudly at start.
await loadSections().then((m) => {
  if (m.size === 0) console.error("discord: no sections loaded — run the site build first (dist/og/sections.json missing)")
  else console.log(`discord: ${m.size} sections loaded`)
  if (!process.env.DISCORD_PUBLIC_KEY) console.error("discord: DISCORD_PUBLIC_KEY not set — every interaction will 401 (set it to the application's public key)")
})
server.listen(PORT, () => console.log(`discord: interactions on :${PORT} (POST /interactions)`))
