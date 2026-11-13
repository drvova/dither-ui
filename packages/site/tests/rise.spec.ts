// @rstest-environment jsdom
// The rise: a headline's words come up one after another on the glide, then
// what stands with it; the prerendered bytes wait for it (the head script)
// and let go by themselves if the app never comes; reduced motion stands
// everything where it is. Every riser on the landing stands inside a `v-rise`.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it, rs } from "rstack/test"
import { GLIDE_BEZIER } from "@dither-ui/kit/engine/dither-paint.ts"
import { RISE, riseDelays } from "../src/shared/lib/rise"
import { RISE_HEAD_SCRIPT, RISE_LIVE, RISE_WAIT } from "../src/shared/lib/rise-wait"

let reduced = false
let animated: { el: Element; delay: number; easing: string }[] = []

beforeEach(() => {
  reduced = false
  animated = []
  window.matchMedia = ((q: string) => ({ matches: reduced && q.includes("reduce") })) as typeof window.matchMedia
  globalThis.IntersectionObserver = class {
    constructor() {}
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

describe("the rise", () => {
  it("staggers the words, then the blocks after the last word", () => {
    expect(riseDelays(["word", "word", "word", "block", "block"])).toEqual([0, 60, 120, 240, 330])
    expect(riseDelays(["block", "block"])).toEqual([0, RISE.block])
    expect(RISE.easing).toBe(`cubic-bezier(${GLIDE_BEZIER.join(", ")})`)
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
