// @rstest-environment jsdom
// The rise: a headline's words come up one after another on the glide, then
// what stands with it; the prerendered bytes wait for it (the head script)
// and let go by themselves if the app never comes; reduced motion stands
// everything where it is. Every riser on the landing stands inside a `v-rise`.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { mount } from "@vue/test-utils"
import { parse } from "@vue/compiler-sfc"
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { defineComponent } from "vue"
import { GLIDE_BEZIER } from "../dither-kit/engine/dither-paint"
import RiseWords from "../src/pages/landing/RiseWords.vue"
import { RISE, riseDelays, vRise } from "../src/shared/lib/rise"
import { RISE_HEAD_SCRIPT, RISE_LIVE, RISE_WAIT } from "../src/shared/lib/rise-wait"

let reduced = false
let seen: ((entries: { isIntersecting: boolean }[]) => void) | null = null
let animated: { el: Element; delay: number; easing: string }[] = []

beforeEach(() => {
  reduced = false
  seen = null
  animated = []
  window.matchMedia = ((q: string) => ({ matches: reduced && q.includes("reduce") })) as typeof window.matchMedia
  globalThis.IntersectionObserver = class {
    constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
      seen = cb
    }
    observe() {}
    disconnect() {}
  } as unknown as typeof IntersectionObserver
  Element.prototype.animate = function (this: Element, _k: unknown, o: KeyframeAnimationOptions) {
    animated.push({ el: this, delay: Number(o.delay), easing: String(o.easing) })
    return {} as Animation
  }
  document.documentElement.className = RISE_WAIT
  delete document.documentElement.dataset.rise
})
afterEach(() => {
  document.documentElement.className = ""
  rs.useRealTimers()
})

const mountHead = () =>
  mount(
    defineComponent({
      directives: { rise: vRise },
      template: `<div v-rise><h2><RiseWords text="Every component, live." /></h2><p data-rise>lede</p><a data-rise>more</a></div>`,
    }),
    { global: { components: { RiseWords } }, attachTo: document.body },
  )

describe("the rise", () => {
  it("staggers the words, then the blocks after the last word", () => {
    expect(riseDelays(["word", "word", "word", "block", "block"])).toEqual([0, 60, 120, 240, 330])
    expect(riseDelays(["block", "block"])).toEqual([0, RISE.block])
    expect(RISE.easing).toBe(`cubic-bezier(${GLIDE_BEZIER.join(", ")})`)
  })

  it("keeps the headline one line of text, its words each their own box", () => {
    const w = mountHead()
    expect(w.find("h2").text()).toBe("Every component, live.")
    expect(w.findAll('[data-rise="word"]').map((s) => s.text())).toEqual(["Every", "component,", "live."])
    w.unmount()
  })

  it("rises each riser once it comes into view, on the glide", () => {
    const w = mountHead()
    expect(document.documentElement.dataset.rise).toBe(RISE_LIVE)
    expect(animated).toEqual([])
    seen!([{ isIntersecting: true }])
    expect(animated.map((a) => a.delay)).toEqual([0, 60, 120, 240, 330])
    expect(new Set(animated.map((a) => a.easing))).toEqual(new Set([RISE.easing]))
    expect(w.findAll("[data-rise]").every((e) => e.attributes("data-risen") === "")).toBe(true)
    w.unmount()
  })

  it("stands everything where it is under reduced motion", () => {
    reduced = true
    const w = mountHead()
    expect(seen).toBe(null)
    expect(animated).toEqual([])
    expect(w.findAll("[data-rise]").every((e) => e.attributes("data-risen") === "")).toBe(true)
    w.unmount()
  })

  it("keeps a riser out of sight until it comes into view", () => {
    document.documentElement.className = ""
    const w = mountHead()
    const items = w.findAll<HTMLElement>("[data-rise]")
    expect(items.every((e) => e.element.style.opacity === "0")).toBe(true)
    seen!([{ isIntersecting: false }])
    expect(animated).toEqual([])
    seen!([{ isIntersecting: true }])
    expect(items.every((e) => e.element.style.opacity === "")).toBe(true)
    w.unmount()
  })
})

describe("the wait", () => {
  const run = () => new Function(RISE_HEAD_SCRIPT)()

  it("holds the risers until the app comes, and lets go if it never does", () => {
    rs.useFakeTimers()
    document.documentElement.className = ""
    run()
    expect(document.documentElement.classList.contains(RISE_WAIT)).toBe(true)
    rs.advanceTimersByTime(3000)
    expect(document.documentElement.classList.contains(RISE_WAIT)).toBe(false)
  })

  it("stays with the app once it has taken over", () => {
    rs.useFakeTimers()
    document.documentElement.className = ""
    run()
    document.documentElement.dataset.rise = RISE_LIVE
    rs.advanceTimersByTime(3000)
    expect(document.documentElement.classList.contains(RISE_WAIT)).toBe(true)
  })

  it("holds nothing under reduced motion", () => {
    reduced = true
    document.documentElement.className = ""
    run()
    expect(document.documentElement.classList.contains(RISE_WAIT)).toBe(false)
  })

  it("is what the stylesheet hides behind", () => {
    const css = readFileSync(join(__dirname, "../src/app/styles.css"), "utf8")
    expect(css).toContain(`.${RISE_WAIT} [data-rise]:not([data-risen]) {`)
  })
})

describe("the landing's risers", () => {
  type Node = { type: number; tag?: string; props?: { name: string }[]; children?: Node[] }
  const dir = join(__dirname, "../src/pages/landing")

  it("each stand inside a v-rise, or the wait would hide them for good", () => {
    const strays: string[] = []
    const walk = (n: Node, file: string, inside: boolean) => {
      if (n.type !== 1) return n.children?.forEach((c) => walk(c, file, inside))
      const here = inside || !!n.props?.some((p) => p.name === "rise")
      const rises = n.tag === "RiseWords" || n.props?.some((p) => p.name === "data-rise")
      if (rises && !here) strays.push(`${file}: <${n.tag}>`)
      n.children?.forEach((c) => walk(c, file, here))
    }
    let risers = 0
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".vue") && f !== "RiseWords.vue")) {
      const source = readFileSync(join(dir, file), "utf8")
      risers += (source.match(/data-rise|<RiseWords/g) ?? []).length
      const ast = parse(source).descriptor.template?.ast as Node | undefined
      if (ast) walk(ast, file, false)
    }
    expect(risers).toBeGreaterThan(10)
    expect(strays).toEqual([])
  })
})
