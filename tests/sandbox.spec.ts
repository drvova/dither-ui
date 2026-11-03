// The sandbox a built tool runs in, proven in a real browser: it answers
// through `studio.run` only, reaches no network (a local server counts the
// requests that get through: none may), sees no page and no storage, and a
// tool that never ends is stopped while the page stays responsive.
import { existsSync } from "node:fs"
import { createServer, type Server } from "node:http"
import type { AddressInfo } from "node:net"
import { chromium, type Browser, type Page } from "playwright-core"
import { afterAll, beforeAll, describe, expect, it } from "rstack/test"
import { runSandboxed, SANDBOX_CALLS, SANDBOX_MS, sandboxDocument, workerSource } from "@/features/agent/sandbox"

function findChromium(): string {
  const found = [
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((p) => p && existsSync(p))
  if (!found) throw new Error("sandbox spec: no chromium found. Set CHROME_PATH.")
  return found
}

let server: Server
let hits = 0
let origin = ""
let browser: Browser
let page: Page

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === "/") {
      res.setHeader("content-type", "text/html")
      res.end("<!doctype html><title>host</title><body></body>")
      return
    }
    hits++
    res.setHeader("access-control-allow-origin", "*")
    res.end("reached")
  })
  // A socket's upgrade is a request too: it counts.
  server.on("upgrade", (_req, socket) => {
    hits++
    socket.destroy()
  })
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  browser = await chromium.launch({ executablePath: findChromium(), args: ["--no-sandbox"] })
  page = await browser.newPage()
  await page.goto(`${origin}/`)
  // The page side, as the Studio runs it: the module's own functions.
  await page.addScriptTag({
    content: `const SANDBOX_MS = ${SANDBOX_MS}; const SANDBOX_CALLS = ${SANDBOX_CALLS};
${workerSource.toString()}
${sandboxDocument.toString()}
window.runSandboxed = ${runSandboxed.toString()};
window.calls = [];
window.call = async (action, args) => (window.calls.push([action, args]), { ok: true, data: { echoed: action, args } });`,
  })
}, 60_000)

afterAll(async () => {
  await browser?.close()
  await new Promise((r) => server.close(r))
})

const run = (code: string, ms = 4000) =>
  page.evaluate(
    ([c, t]) =>
      (window as never as { runSandboxed: Function }).runSandboxed(
        c,
        { who: "test" },
        (window as never as { call: Function }).call,
        t,
      ),
    [code, ms] as const,
  )

describe("the sandbox for built tools", () => {
  it("runs the code with its args and answers its studio.run with the Studio's actions", async () => {
    const r = await run(
      `const a = await studio.run("add_screen", { name: args.who }); return { got: a.data.echoed, n: 2 }`,
    )
    expect(r).toEqual({ ok: true, data: { got: "add_screen", n: 2 } })
    expect(await page.evaluate(() => (window as never as { calls: unknown[] }).calls)).toEqual([
      ["add_screen", { name: "test" }],
    ])
  }, 20_000)

  it("reaches no network: fetch, import and sockets are refused and nothing arrives", async () => {
    hits = 0
    const r = await run(`
      const out = {};
      try { await fetch(${JSON.stringify(`${origin}/x`)}); out.fetch = "reached" } catch { out.fetch = "refused" }
      try { importScripts(${JSON.stringify(`${origin}/y.js`)}); out.importScripts = "reached" } catch { out.importScripts = "refused" }
      out.socket = await new Promise((done) => {
        try {
          const ws = new WebSocket(${JSON.stringify(`${origin.replace("http", "ws")}/z`)});
          ws.onopen = () => done("opened");
          ws.onerror = () => done("refused");
        } catch { done("refused") }
      })
      return out`)
    expect(r).toEqual({ ok: true, data: { fetch: "refused", importScripts: "refused", socket: "refused" } })
    expect(hits).toBe(0)
  }, 20_000)

  it("sees no page and none of the Studio's storage", async () => {
    await page.evaluate(() => localStorage.setItem("dither-agent-config", "secret"))
    const r = await run(`return {
      document: typeof document,
      parent: typeof parent,
      storage: typeof localStorage,
      cookies: (() => { try { return typeof indexedDB === "undefined" ? "none" : "opaque" } catch { return "none" } })(),
    }`)
    expect(r).toMatchObject({ ok: true, data: { document: "undefined", parent: "undefined", storage: "undefined" } })
  }, 20_000)

  it("stops a tool that never ends, and the page keeps answering", async () => {
    const started = Date.now()
    const r = await run(`while (true) {}`, 1500)
    expect(r).toEqual({ ok: false, error: "it ran past 1.5s and was stopped" })
    expect(Date.now() - started).toBeLessThan(6000)
    expect(await page.evaluate(() => 1 + 1)).toBe(2)
    expect(await page.evaluate(() => document.querySelectorAll("iframe").length)).toBe(0)
  }, 20_000)

  it("reports code that does not parse or throws, as an error", async () => {
    expect(await run(`return (`)).toMatchObject({ ok: false })
    expect(await run(`throw new Error("no frames")`)).toEqual({ ok: false, error: "no frames" })
  }, 20_000)
})
