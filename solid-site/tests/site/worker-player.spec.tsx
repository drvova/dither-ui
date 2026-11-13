// The Studio's service worker and the player, as this site builds them
// (`standalone.ts`): the worker's rules over this build's own paths (the
// rules of `tests/install.spec.ts` at the root, which pins the same module
// for the Vue build), the list of files the worker keeps, the player's
// route, and the two files a video export fetches and carries inline.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { MetaProvider } from "@solidjs/meta"
import { cleanup, render } from "@solidjs/testing-library"
import { afterEach, describe, expect, it } from "vitest"
import { buildKeep, cacheName, inApp, KEEP_DEFINE, OFFLINE, pageAssets, strategyFor } from "@/app/offline"
import { compositionHtml, DEFAULT_VIDEO } from "@/features/export-video/composition"
import { type BuiltChunk, PLAYER_ROUTE, studioFiles } from "../../standalone"
import { addArtboard } from "../../src/entities/editor"
import { playerAssetUrls, playerUrl } from "../../src/features/export-video"
import Play from "../../src/routes/play"

const read = (path: string) => readFileSync(join(import.meta.dirname, "../..", path), "utf8")

afterEach(cleanup)

describe("the service worker's rules", () => {
  const site = new URL("https://dither-ui.com/")
  const ask = (mode = "no-cors", method = "GET", range = false) => ({ method, mode, range })
  const at = (path: string) => new URL(path, site)

  it("registers on the Studio only", () => {
    expect(inApp("/studio")).toBe(true)
    expect(inApp("/studio/")).toBe(true)
    for (const path of ["/", "/docs", "/docs/slider", "/studios", "/play"]) expect(inApp(path)).toBe(false)
  })

  it("answers pages network first, this build's hashed chunks from the cache, the rest stale while it refreshes", () => {
    expect(strategyFor(at("studio/"), site, ask("navigate"))).toBe("page")
    expect(strategyFor(at("_build/assets/studio-1a2b.js"), site, ask())).toBe("static")
    // the name alone is no promise: only the build's own folder holds hashed files
    expect(strategyFor(at("static/js/index.1a2b.js"), site, ask())).toBe("asset")
    expect(strategyFor(at("favicon.svg"), site, ask())).toBe("asset")
    expect(strategyFor(at("kit/src/solid/files.json"), site, ask())).toBe("asset")
  })

  it("leaves the film, the cards, the player, other origins, writes and range reads to the network", () => {
    for (const path of ["trailer/dither-ui.mp4", "og/home.gif", "embed/home.json", "play/", "play/player.js", "sw.js"])
      expect(strategyFor(at(path), site, ask())).toBe("network")
    expect(strategyFor(new URL("https://fonts.example/a.woff2"), site, ask())).toBe("network")
    expect(strategyFor(at("_build/assets/a.js"), site, ask("cors", "POST"))).toBe("network")
    expect(strategyFor(at("_build/assets/a.mp4"), site, ask("no-cors", "GET", true))).toBe("network")
  })

  it("keeps to the site when it is served under a base path", () => {
    const base = new URL("https://drvova.github.io/dither-ui/")
    expect(strategyFor(new URL("https://drvova.github.io/other/x.js"), base, ask())).toBe("network")
    expect(strategyFor(new URL("_build/assets/a.js", base), base, ask())).toBe("static")
    expect(strategyFor(new URL("https://drvova.github.io/_build/assets/a.js"), base, ask())).toBe("network")
  })

  it("keeps the build assets the app's page loads, and only those", () => {
    const html = `<script type="module" src="/_build/assets/entry-client-1.js"></script>
      <link rel="modulepreload" href="/_build/assets/studio-2.js"><link href="/_build/assets/app-3.css" rel="stylesheet">
      <link rel="icon" href="/favicon.svg"><a href="/docs/">docs</a><img src="https://cdn.example/x.png">`
    expect(pageAssets(html, at(OFFLINE.app), site)).toEqual([
      at("_build/assets/entry-client-1.js").href,
      at("_build/assets/studio-2.js").href,
      at("_build/assets/app-3.css").href,
    ])
  })

  it("names its caches by version, so a new one drops the old", () => {
    expect(cacheName("pages")).toBe(`dither-ui-pages-v${OFFLINE.version}`)
    expect(new Set(Object.keys(OFFLINE.caches).map((k) => cacheName(k as keyof typeof OFFLINE.caches))).size).toBe(3)
  })
})

describe("what the worker keeps at install", () => {
  const chunk = (fileName: string, rest: Partial<BuiltChunk> = {}): BuiltChunk => ({
    fileName,
    isEntry: false,
    moduleIds: [],
    imports: [],
    dynamicImports: [],
    assets: [],
    ...rest,
  })
  const chunks = [
    chunk("a/entry.js", { isEntry: true, imports: ["a/solid.js"], dynamicImports: ["a/landing.js", "a/studio.js"] }),
    chunk("a/solid.js", { assets: ["a/app.css"] }),
    chunk("a/landing.js", {
      moduleIds: ["/x/src/routes/index.tsx"],
      imports: ["a/solid.js"],
      assets: ["a/landing.css"],
    }),
    chunk("a/studio.js", {
      moduleIds: ["/x/src/routes/studio.tsx?pick=default"],
      imports: ["a/solid.js", "a/editor.js", "a/gone.js"],
      dynamicImports: ["a/video.js"],
      assets: ["a/studio.css"],
    }),
    chunk("a/editor.js", { assets: ["a/mono.woff2"] }),
    chunk("a/video.js", { dynamicImports: ["a/score.js"] }),
    chunk("a/score.js"),
    chunk("a/docs.js", { moduleIds: ["/x/src/routes/docs/index.tsx"] }),
  ]

  it("lists the entry, the Studio's route and all the Studio reaches, lazily or not, with their styles and fonts", () => {
    expect(studioFiles(chunks, "/src/routes/studio.tsx")).toEqual([
      "a/app.css",
      "a/editor.js",
      "a/entry.js",
      "a/mono.woff2",
      "a/score.js",
      "a/solid.js",
      "a/studio.css",
      "a/studio.js",
      "a/video.js",
    ])
  })

  it("fails the build when no chunk holds the Studio's route", () => {
    expect(() => studioFiles(chunks, "/src/routes/app.tsx")).toThrow(/Studio's route/)
  })

  it("reaches the worker through one constant the worker reads and the build defines", () => {
    // Nothing defines it under a spec, as in any build that has no list.
    expect(buildKeep()).toEqual([])
    expect(read("../src/app/offline.ts")).toContain(`declare const ${KEEP_DEFINE}:`)
    expect(read("../src/app/sw.ts")).toContain("buildKeep()")
    expect(read("standalone.ts")).toContain("[KEEP_DEFINE]: JSON.stringify(keep)")
    // The Studio's route is the app the worker is scoped to.
    expect(read(`src/routes/${OFFLINE.app.replace(/\/$/, "")}.tsx`)).toContain("registerOffline(")
  })
})

describe("the player's page and bundle", () => {
  it("gives the stage and mounts the player in it, with the clock's two doors open", () => {
    const page = render(() => (
      <MetaProvider>
        <Play />
      </MetaProvider>
    ))
    const stage = page.container.querySelector("#dither-stage")!
    expect(stage.querySelector(".play-empty")).not.toBeNull()
    expect(window.ditherClock?.directed()).toBe(false)
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: 1.5 } }))
    expect(window.ditherClock?.time()).toBe(1.5)
    window.ditherClock?.release()
    expect(Object.keys(window.__hf?.buildReady ?? {})).toContain("dither-ui")
    expect(document.querySelector('meta[name="robots"]')?.getAttribute("content")).toBe("noindex, nofollow")
    page.unmount()
  })

  it("is a page of the build at the address a preview link opens", () => {
    const a = addArtboard("button")
    expect(new URL(playerUrl(a, "dark")).pathname).toBe(`${PLAYER_ROUTE}/`)
    expect(read("vite.config.ts")).toMatch(/routes: \[[^\]]*PLAYER_ROUTE/)
    // The worker leaves the player to the network.
    expect(inApp(PLAYER_ROUTE)).toBe(false)
  })

  it("builds the two files an export fetches, and a composition carries them inline", () => {
    expect(playerAssetUrls().map((f) => new URL(f.url).pathname)).toEqual(["/play/player.js", "/play/player.css"])
    const plugin = read("standalone.ts")
    for (const { path } of playerAssetUrls()) expect(plugin).toContain(path.replace(/\.\w+$/, ""))
    const a = addArtboard("button")
    const html = compositionHtml(a, DEFAULT_VIDEO, { js: 'mount("</script>")', css: ".x{color:red}" })
    expect(html).toContain("<style>.x{color:red}</style>")
    expect(html).toContain('<script>mount("<\\/script>")</script>')
    expect(html).toContain(`<div id="dither-stage" data-artboard="${a.id}"`)
    expect(html).not.toMatch(/<(script|link)[^>]+(src|href)="(?!data:)/)
  })
})
