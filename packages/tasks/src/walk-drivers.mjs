// What the browser walk (`walk.mjs`) stands on: the server it reads the built
// site from, the browsers it drives, and a PNG reader for its screenshots.
//
// One driver shape for every engine, `{ go, run, shot, drain, close }`, so the
// walk is written once: Chromium through Playwright (its CDP), WebKit
// (WebKitGTK's `WebKitWebDriver` + `MiniBrowser`) and Firefox (`geckodriver`)
// through plain W3C WebDriver over HTTP. Every check is a script run in the
// page, which is all WebDriver gives; what the page threw is kept by a
// recorder the server puts first in every HTML page's head.
import { spawn } from "node:child_process"
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs"
import http from "node:http"
import { extname, join, normalize, resolve } from "node:path"
import { inflateSync } from "node:zlib"

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wasm": "application/wasm",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
}

/** The recorder: first script of every page. It keeps what the page throws,
 * what it logs as an error or a warning and every resource that fails to
 * load, sets the theme the walk asked for (and the docs' styling back to
 * Tailwind, which a walk's runs switch) before the app reads it, and
 * carries the helpers the walk's page scripts share. */
const recorder = (theme) => `<script>(function(){
var W=window.__walk={errors:[],logs:[],failed:[]};
try{localStorage.setItem("dither-theme",${JSON.stringify(theme)});localStorage.setItem("dither-sounds","off");localStorage.setItem("dither-styling","tailwind")}catch(e){}
function text(v){try{return v&&v.stack?String(v.stack).split("\\n").slice(0,4).join(" | "):typeof v==="object"?JSON.stringify(v):String(v)}catch(e){return String(v)}}
addEventListener("error",function(e){
  var t=e.target
  if(t&&t!==window&&t.nodeType===1){W.failed.push(t.tagName.toLowerCase()+" "+(t.currentSrc||t.src||t.href||""));return}
  W.errors.push("error: "+e.message+" @ "+(e.filename||"")+":"+(e.lineno||0)+(e.error&&e.error.stack?" | "+String(e.error.stack).split("\\n").slice(0,3).join(" | "):""))
},true)
addEventListener("unhandledrejection",function(e){W.errors.push("rejection: "+text(e.reason))})
;["error","warn"].forEach(function(k){var was=console[k];console[k]=function(){W.logs.push(k+": "+[].map.call(arguments,text).join(" ").slice(0,500));return was.apply(console,arguments)}})
W.sleep=function(ms){return new Promise(function(r){setTimeout(r,ms)})}
W.frames=function(n){return new Promise(function(r){var i=0;(function f(){++i>=n?r():requestAnimationFrame(f)})()})}
W.until=async function(test,ms,step){var end=Date.now()+(ms||5000);for(;;){var v;try{v=await test()}catch(e){v=null}if(v)return v;if(Date.now()>end)return null;await W.sleep(step||50)}}
/* A canvas's state, read without touching its own context: drawn onto a
   scratch 2D canvas and sampled. "painted": some pixel differs from the
   rest or carries ink; "blank": every sampled pixel transparent or one flat
   colour; "unread": the read was refused or came back empty where the
   context is WebGL (the caller then looks at a screenshot). */
W.canvas=function(c){
  var r=c.getBoundingClientRect(),cs=getComputedStyle(c)
  var info={w:c.width,h:c.height,rect:[Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)],at:[Math.round(r.left+scrollX),Math.round(r.top+scrollY)],cls:String(c.className&&c.className.baseVal!==undefined?c.className.baseVal:c.className).slice(0,80)}
  if(!c.width||!c.height||r.width<2||r.height<2||cs.display==="none"||cs.visibility==="hidden"||!c.getClientRects().length){info.state="hidden";return info}
  try{
    var w=Math.min(c.width,256),h=Math.min(c.height,256),s=document.createElement("canvas");s.width=w;s.height=h
    var g=s.getContext("2d",{willReadFrequently:true});g.drawImage(c,0,0,w,h)
    var d=g.getImageData(0,0,w,h).data,ink=0,first=-1,varied=false
    for(var i=0;i<d.length;i+=4){if(d[i+3]){ink++;var v=(d[i]<<16)|(d[i+1]<<8)|d[i+2]|(d[i+3]<<24);if(first===-1)first=v;else if(v!==first)varied=true}}
    info.ink=ink/(w*h)
    info.state=ink===0?"blank":(varied||ink<w*h)?"painted":"flat"
  }catch(e){info.state="unread";info.why=String(e&&e.message||e)}
  return info
}
/* A blank canvas may be a surface that prints only under a pointer (a
   chart's pointer layer, a heat trail): move one across it and read again.
   Painted then, its state is "pointer". */
W.poke=async function(c){
  var r=c.getBoundingClientRect(),last=null
  function at(i){var x=Math.min(innerWidth-2,Math.max(1,r.left+r.width*i/7)),y=Math.min(innerHeight-2,Math.max(1,r.top+r.height*(0.3+0.4*i/7)));return{x:x,y:y}}
  function send(el,type,p,more){var init=Object.assign({bubbles:true,cancelable:true,composed:true,clientX:p.x,clientY:p.y,screenX:p.x,screenY:p.y,pointerId:1,pointerType:"mouse",isPrimary:true,button:0,buttons:0},more||{});el.dispatchEvent(/^pointer/.test(type)?new PointerEvent(type,init):new MouseEvent(type,init))}
  async function sweep(buttons){
    var live=null
    for(var i=1;i<=6;i++){
      var p=at(i),el=document.elementFromPoint(p.x,p.y)||c
      if(!last){send(el,"pointerover",p);send(el,"pointerenter",p,{bubbles:false});send(el,"mouseover",p);send(el,"mouseenter",p,{bubbles:false})}
      if(buttons&&i===1){send(el,"pointerdown",p,{buttons:1});send(el,"mousedown",p,{buttons:1})}
      send(el,"pointermove",p,{buttons:buttons});send(el,"mousemove",p,{buttons:buttons})
      last=el
      await W.frames(2)
      /* a trail fades behind the pointer: read it while it is there */
      live=W.canvas(c)
      if(live.state==="painted")break
      live=null
    }
    if(buttons){var q=at(6);send(last,"pointerup",q);send(last,"mouseup",q);send(last,"click",q)}
    if(live)return live
    await W.sleep(120)
    return W.canvas(c)
  }
  /* first a pointer passing over, then one pressed and dragged (a pad drawn on, a click's spark) */
  var s=await sweep(0)
  if(s.state==="blank")s=await sweep(1)
  var gone={x:-10,y:-10}
  send(last,"pointerout",gone);send(last,"pointerleave",gone,{bubbles:false});send(last,"mouseout",gone);send(last,"mouseleave",gone,{bubbles:false})
  if(s.state==="painted")s.state="pointer"
  return s
}
/* A blank canvas lying over a painted one is a layer of the same surface (a
   chart's pointer layer, drawn only under a pointer), not an empty surface. */
W.layers=function(list){
  list.forEach(function(c){
    if(c.state!=="blank")return
    /* where each stands on the page: the list may have been read across a scroll */
    var a=c.at.concat(c.rect.slice(2)),over=list.some(function(p){
      if(p.state!=="painted")return false
      var b=p.at.concat(p.rect.slice(2)),w=Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]),h=Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1])
      return w>0&&h>0&&w*h>=0.6*a[2]*a[3]
    })
    if(over)c.state="layer"
  })
  return list
}
})()</script>`

/** Serve a built site as a static host does: a folder is its `index.html`,
 * an address nothing answers is `404.html` with a 404. Every HTML page gets
 * the recorder; every answer of 400 or more is kept in `refused`. */
export async function serve(root, { theme = "dark" } = {}) {
  const base = resolve(root)
  const state = { theme, refused: [] }
  const missing = join(base, "404.html")
  const server = http.createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname)
    let file = normalize(join(base, path))
    if (!file.startsWith(base)) file = missing
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html")
    let status = 200
    if (!existsSync(file)) {
      status = 404
      file = missing
      state.refused.push({ status, url: req.url })
    }
    const type = TYPES[extname(file)] ?? "application/octet-stream"
    if (type.startsWith("text/html")) {
      const html = readFileSync(file, "utf8").replace(/<head([^>]*)>/i, (m) => m + recorder(state.theme))
      res.writeHead(status, { "content-type": type, "cache-control": "no-store" })
      res.end(html)
      return
    }
    const size = statSync(file).size
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? "")
    if (range) {
      const from = Number(range[1])
      const to = range[2] ? Number(range[2]) : size - 1
      res.writeHead(206, {
        "content-type": type,
        "content-range": `bytes ${from}-${to}/${size}`,
        "content-length": to - from + 1,
        "accept-ranges": "bytes",
      })
      createReadStream(file, { start: from, end: to }).pipe(res)
      return
    }
    res.writeHead(status, { "content-type": type, "content-length": size, "accept-ranges": "bytes" })
    createReadStream(file).pipe(res)
  })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    state,
    /** The refused requests since the last call. */
    refused: () => state.refused.splice(0),
    close: () => new Promise((r) => server.close(r)),
  }
}

// ---------------------------------------------------------------- PNG

/** A PNG's pixels as RGBA (8-bit truecolour, with or without alpha, not
 * interlaced: what every engine's screenshot is). */
export function decodePng(buf) {
  let at = 8
  let width = 0
  let height = 0
  let channels = 4
  const data = []
  while (at < buf.length) {
    const len = buf.readUInt32BE(at)
    const kind = buf.toString("latin1", at + 4, at + 8)
    const body = buf.subarray(at + 8, at + 8 + len)
    if (kind === "IHDR") {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      const depth = body[8]
      const colour = body[9]
      if (depth !== 8 || (colour !== 2 && colour !== 6) || body[12] !== 0)
        throw new Error(`unsupported PNG (depth ${depth}, colour ${colour}, interlace ${body[12]})`)
      channels = colour === 6 ? 4 : 3
    } else if (kind === "IDAT") data.push(body)
    else if (kind === "IEND") break
    at += 12 + len
  }
  const raw = inflateSync(Buffer.concat(data))
  const stride = width * channels
  const out = new Uint8Array(width * height * 4)
  let prev = new Uint8Array(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = Uint8Array.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0
      const b = prev[x]
      const c = x >= channels ? prev[x - channels] : 0
      let add = 0
      if (filter === 1) add = a
      else if (filter === 2) add = b
      else if (filter === 3) add = (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        add = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      line[x] = (line[x] + add) & 255
    }
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4
      out[o] = line[x * channels]
      out[o + 1] = line[x * channels + 1]
      out[o + 2] = line[x * channels + 2]
      out[o + 3] = channels === 4 ? line[x * channels + 3] : 255
    }
    prev = line
  }
  return { width, height, data: out }
}

/** How many distinct colours a rectangle of a decoded screenshot holds
 * (CSS pixels, scaled by `ratio`), capped: 1 means a flat, empty region. */
export function coloursIn(png, [x, y, w, h], ratio = 1) {
  const seen = new Set()
  const x0 = Math.max(0, Math.round(x * ratio))
  const y0 = Math.max(0, Math.round(y * ratio))
  const x1 = Math.min(png.width, Math.round((x + w) * ratio))
  const y1 = Math.min(png.height, Math.round((y + h) * ratio))
  for (let py = y0; py < y1; py++)
    for (let px = x0; px < x1; px++) {
      const o = (py * png.width + px) * 4
      seen.add((png.data[o] << 16) | (png.data[o + 1] << 8) | png.data[o + 2])
      if (seen.size > 64) return seen.size
    }
  return seen.size
}

// ---------------------------------------------------------------- drivers

/** The windows the walk looks through: a desktop, and an iPhone (its size,
 * touch, its user agent). */
export const DEVICES = {
  desktop: { width: 1366, height: 900 },
  phone: {
    width: 390,
    height: 844,
    ratio: 3,
    touch: true,
    agent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
  },
}

/** Chromium through Playwright. The browser's own reports (page errors, the
 * console, failed requests) are kept beside the recorder's: `drain()`. */
export async function playwrightDriver({ executablePath }) {
  const { chromium } = await import("playwright-core")
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] })
  return {
    version: `Chromium ${browser.version()}`,
    async session(device = "desktop") {
      const d = DEVICES[device]
      const context = await browser.newContext({
        viewport: { width: d.width, height: d.height },
        ...(d.touch ? { deviceScaleFactor: d.ratio, isMobile: true, hasTouch: true, userAgent: d.agent } : {}),
      })
      const page = await context.newPage()
      let seen = []
      page.on("pageerror", (e) => seen.push({ kind: "pageerror", text: String(e.stack || e.message).slice(0, 600) }))
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning")
          seen.push({ kind: `console.${m.type()}`, text: m.text().slice(0, 500), url: m.location()?.url })
      })
      page.on("requestfailed", (r) =>
        seen.push({ kind: "requestfailed", text: `${r.failure()?.errorText ?? "failed"} ${r.url()}` }),
      )
      page.on("response", (r) => {
        if (r.status() >= 400) seen.push({ kind: "response", text: `${r.status()} ${r.url()}` })
      })
      return {
        go: (url) => page.goto(url, { waitUntil: "load", timeout: 60000 }),
        run: (body, arg) =>
          page.evaluate(([b, a]) => new Function("arg", `return (async()=>{${b}\n})()`)(a), [body, arg ?? null]),
        shot: () => page.screenshot(),
        async press(key, times = 1) {
          for (let i = 0; i < times; i++) await page.keyboard.press(key)
        },
        drain: () => seen.splice(0),
        close: () => context.close(),
      }
    },
    close: () => browser.close(),
  }
}

async function freePort() {
  const s = http.createServer()
  await new Promise((r) => s.listen(0, "127.0.0.1", r))
  const { port } = s.address()
  await new Promise((r) => s.close(r))
  return port
}

const XVFB = ["/usr/bin/Xvfb", "/usr/local/bin/Xvfb", "/opt/X11/bin/Xvfb"].find((p) => existsSync(p))

/** A display of its own for one browser window: an Xvfb server on the first
 * free number (it writes the number to the descriptor it is given). A
 * window that shares a display with others lies under them, and a browser
 * stops the frames of a window nobody can see. */
async function ownDisplay() {
  const proc = spawn(XVFB, ["-displayfd", "3", "-screen", "0", "1600x1200x24", "-nolisten", "tcp"], {
    stdio: ["ignore", "ignore", "ignore", "pipe"],
  })
  const number = await new Promise((done, fail) => {
    let text = ""
    proc.stdio[3].on("data", (d) => {
      text += d
      if (text.includes("\n")) done(text.trim())
    })
    proc.on("exit", () => fail(new Error("Xvfb did not start")))
    proc.on("error", fail)
  })
  return { name: `:${number}`, close: () => proc.kill() }
}

/** The keys the walk presses, as WebDriver names them (Playwright takes
 * the names themselves). */
const WEBDRIVER_KEYS = { Tab: "", Enter: "", Escape: "", Shift: "" }

/** A browser behind a W3C WebDriver server: one driver process a session
 * (WebKitWebDriver holds one session at a time). `capabilities` names the
 * browser, told whether it has a display of its own and the device it
 * stands for (over WebDriver a phone is its window's size and its user
 * agent: no touch); `command` starts the
 * driver on a port. Where the machine has Xvfb each session's browser gets
 * a display of its own; elsewhere it has the one the walk was started on,
 * if any. */
export function webDriver({ name, command, capabilities }) {
  const running = []
  return {
    version: name,
    async session(device = "desktop") {
      const view = DEVICES[device]
      const port = await freePort()
      const [bin, ...args] = command(port)
      const screen = XVFB ? await ownDisplay() : null
      const env = { ...process.env }
      if (screen) {
        env.DISPLAY = screen.name
        delete env.WAYLAND_DISPLAY
      }
      const proc = spawn(bin, args, { stdio: "ignore", env })
      const stop = () => {
        proc.kill()
        screen?.close()
      }
      running.push(stop)
      const at = `http://127.0.0.1:${port}`
      const call = async (method, path, body) => {
        const res = await fetch(at + path, {
          method,
          headers: { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        })
        const json = await res.json()
        if (json.value && json.value.error) throw new Error(`${json.value.error}: ${json.value.message}`)
        return json.value
      }
      let started = null
      for (let i = 0; i < 100 && !started; i++) {
        try {
          started = await call("POST", "/session", { capabilities: { alwaysMatch: capabilities(!!screen, view) } })
        } catch (e) {
          if (!/fetch failed|ECONNREFUSED/.test(String(e) + String(e.cause))) throw e
          await sleep(100)
        }
      }
      if (!started) throw new Error(`${bin} did not answer on ${port}`)
      const id = started.sessionId
      const caps = started.capabilities ?? {}
      this.version = `${caps.browserName ?? name} ${caps.browserVersion ?? ""}`.trim()
      await call("POST", `/session/${id}/window/rect`, { width: view.width, height: view.height + 100 })
      await call("POST", `/session/${id}/timeouts`, { script: 120000, pageLoad: 120000 })
      return {
        go: (url) => call("POST", `/session/${id}/url`, { url }),
        async run(body, arg) {
          const r = await call("POST", `/session/${id}/execute/async`, {
            script: `var arg=arguments[0],done=arguments[arguments.length-1];(async()=>{${body}\n})().then(function(v){done({ok:v===undefined?null:v})},function(e){done({err:String(e&&e.stack||e)})})`,
            args: [arg ?? null],
          })
          if (r && r.err) throw new Error(r.err)
          return r ? r.ok : null
        },
        shot: async () => Buffer.from(await call("GET", `/session/${id}/screenshot`), "base64"),
        async press(key, times = 1) {
          // the keyboard's own presses: what a script dispatches moves no focus
          const keys = key.split("+").map((k) => WEBDRIVER_KEYS[k] ?? k)
          const actions = []
          for (let i = 0; i < times; i++) {
            for (const k of keys) actions.push({ type: "keyDown", value: k })
            for (const k of [...keys].reverse()) actions.push({ type: "keyUp", value: k })
          }
          await call("POST", `/session/${id}/actions`, { actions: [{ type: "key", id: "keyboard", actions }] })
          await call("DELETE", `/session/${id}/actions`)
        },
        drain: () => [],
        async close() {
          await call("DELETE", `/session/${id}`).catch(() => {})
          stop()
        },
      }
    },
    async close() {
      for (const stop of running) stop()
    },
  }
}

export function webkitDriver({ driver = "/usr/bin/WebKitWebDriver", binary } = {}) {
  const mini =
    binary ??
    [
      "/usr/lib/x86_64-linux-gnu/webkit2gtk-4.1/MiniBrowser",
      "/usr/lib/aarch64-linux-gnu/webkit2gtk-4.1/MiniBrowser",
    ].find((p) => existsSync(p))
  if (!existsSync(driver) || !mini)
    throw new Error("WebKit needs WebKitGTK's WebKitWebDriver and MiniBrowser (the webkit2gtk-driver package).")
  if (!XVFB && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY)
    throw new Error("WebKitGTK needs a display: install Xvfb, or start the walk on one.")
  return webDriver({
    name: "WebKitGTK",
    command: (port) => [driver, `--port=${port}`],
    capabilities: (screen, view) => ({
      browserName: "MiniBrowser",
      "webkitgtk:browserOptions": {
        binary: mini,
        args: ["--automation", ...(view.agent ? [`--user-agent=${view.agent}`] : [])],
      },
    }),
  })
}

export function firefoxDriver({ driver = "geckodriver", binary } = {}) {
  return webDriver({
    name: "Firefox",
    command: (port) => [driver, "--port", String(port), "--log", "fatal"],
    // Headless Firefox has no GL on a machine without a GPU; on a display
    // Mesa gives it one, so it runs headless only where there is none.
    capabilities: (screen, view) => ({
      browserName: "firefox",
      "moz:firefoxOptions": {
        ...(binary ? { binary } : {}),
        args: screen || process.env.DISPLAY ? [] : ["-headless"],
        ...(view.agent ? { prefs: { "general.useragent.override": view.agent } } : {}),
      },
    }),
  })
}
