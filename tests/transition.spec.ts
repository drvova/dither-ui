// @rstest-environment jsdom
// The transition engine drives a view transition's snapshots through the
// wipe masks: a fake transition stands in for the browser's, a manual rAF
// for its frames, and the injected sheet is read back as the browser would.
import { afterEach, beforeEach, describe, expect, it } from "rstack/test"
import { release, seek } from "../dither-kit/engine/clock"
import { ditherTransition, ditherViewTransition } from "../dither-kit/engine/transition"

let queue: FrameRequestCallback[] = []
const flush = (t: number) => {
  const batch = queue
  queue = []
  for (const cb of batch) cb(t)
}
const reducedMotion = (matches: boolean) => {
  window.matchMedia = (() => ({ matches, addEventListener() {}, removeEventListener() {} })) as never
}

/** A transition the test resolves by hand, recording what the engine asks of it. */
function fakeTransition() {
  let begin!: () => void
  let end!: () => void
  const t = {
    skipped: false,
    ready: new Promise<void>((r) => (begin = r)),
    finished: new Promise<void>((r) => (end = r)),
    updateCallbackDone: Promise.resolve(),
    skipTransition() {
      t.skipped = true
      end()
    },
    types: new Set<string>(),
  }
  return { t, begin: () => begin(), end: () => end() }
}

const sheetRules = () => [...document.head.querySelectorAll("style")].flatMap((s) => [...(s.sheet?.cssRules ?? [])])
const ruleFor = (selector: string) =>
  sheetRules().find((r): r is CSSStyleRule => r instanceof CSSStyleRule && r.selectorText === selector)
const tick = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  queue = []
  window.requestAnimationFrame = (cb) => queue.push(cb)
  window.cancelAnimationFrame = () => {}
  reducedMotion(false)
  Object.defineProperty(window, "innerWidth", { value: 320, configurable: true })
  Object.defineProperty(window, "innerHeight", { value: 200, configurable: true })
})
afterEach(() => {
  delete (document as { startViewTransition?: unknown }).startViewTransition
  document.head.innerHTML = ""
  release()
})

describe("ditherTransition", () => {
  it("just runs the change without the API, under reduced motion and while directed", async () => {
    let runs = 0
    await ditherTransition(() => void runs++)
    expect(runs).toBe(1)
    const { t } = fakeTransition()
    let started = 0
    ;(document as { startViewTransition?: unknown }).startViewTransition = () => (started++, t)
    reducedMotion(true)
    await ditherTransition(() => void runs++)
    reducedMotion(false)
    seek(500)
    await ditherTransition(() => void runs++)
    expect(runs).toBe(3)
    expect(started).toBe(0)
  })

  it("dithers the incoming page in and ends the transition when the run ends", async () => {
    const { t, begin, end } = fakeTransition()
    let update: (() => void) | undefined
    ;(document as { startViewTransition?: unknown }).startViewTransition = (cb: () => void) => ((update = cb), t)
    let changed = false
    const done = ditherTransition(() => void (changed = true), { duration: 100, easing: "linear", cell: 4 })
    update?.()
    expect(changed).toBe(true)
    const incoming = ruleFor("::view-transition-new(root)")!
    expect(incoming.style.getPropertyValue("animation")).toContain("dk-transition-hold")
    begin()
    await tick()
    // The first frame is set before the browser paints: nothing of the new page yet.
    expect(incoming.style.getPropertyValue("mask-image")).toContain("data:image/svg+xml")
    expect(incoming.style.getPropertyValue("mask-repeat")).toBe("no-repeat")
    // The run's clock starts on its first frame, which holds the transition for the run.
    flush(1000)
    expect(incoming.style.getPropertyValue("animation")).toContain("dk-transition-run")
    flush(1050)
    expect(incoming.style.getPropertyValue("mask-repeat")).toBe("repeat")
    flush(1100)
    // Shown whole, and the hold dropped: the browser ends the transition.
    expect(incoming.style.getPropertyValue("mask-image")).toBe("none")
    expect(incoming.style.getPropertyValue("animation")).toBe("none")
    end()
    await done
    expect(document.head.querySelector("style")).toBeNull()
  })

  it("carries an ink between the two sides and names only the target", async () => {
    const { t, begin, end } = fakeTransition()
    const target = document.createElement("section")
    target.style.viewTransitionName = "mine"
    target.style.borderRadius = "8px"
    document.body.append(target)
    let named = ""
    ;(document as { startViewTransition?: unknown }).startViewTransition = () => (
      (named = target.style.viewTransitionName),
      t
    )
    const done = ditherTransition(() => {}, { target, ink: "rgb(160, 82, 6)", duration: 100, easing: "linear" })
    expect(named).toMatch(/^dk-transition-\d+$/)
    // The page itself stays out of the snapshots, live and clickable.
    expect(ruleFor(":root")!.style.getPropertyValue("view-transition-name")).toBe("none")
    expect(ruleFor("::view-transition")!.style.getPropertyValue("pointer-events")).toBe("none")
    const ground = ruleFor(`::view-transition-image-pair(${named})`)!
    expect(ground.style.getPropertyValue("background")).toBe("rgb(160, 82, 6)")
    // The ink keeps to the target's rounded shape.
    expect(ground.style.getPropertyValue("border-radius")).toBe("8px")
    begin()
    await tick()
    const outgoing = ruleFor(`::view-transition-old(${named})`)!
    const incoming = ruleFor(`::view-transition-new(${named})`)!
    // At the start the old side is whole and the new side empty.
    expect(outgoing.style.getPropertyValue("mask-image")).toBe("none")
    expect(incoming.style.getPropertyValue("mask-image")).toContain("data:image/svg+xml")
    // Midway the old side has broken up ahead of the new one: both masked.
    flush(1000)
    flush(1050)
    expect(outgoing.style.getPropertyValue("mask-image")).toContain("data:image/svg+xml")
    expect(incoming.style.getPropertyValue("mask-image")).toContain("data:image/svg+xml")
    end()
    await done
    expect(target.style.viewTransitionName).toBe("mine")
  })

  it("lets a transition skipped before it began go quietly", async () => {
    const { t, end } = fakeTransition()
    t.ready.catch(() => undefined)
    ;(document as { startViewTransition?: unknown }).startViewTransition = () => t
    const done = ditherTransition(() => {})
    end()
    await done
    await tick()
    expect(document.head.querySelector("style")).toBeNull()
  })
})

describe("ditherViewTransition", () => {
  it("drives a transition the browser started, or skips it under reduced motion", async () => {
    const a = fakeTransition()
    const run = ditherViewTransition(a.t, { direction: "right", duration: 100 })
    a.begin()
    await tick()
    const incoming = ruleFor("::view-transition-new(root)")!
    flush(1000)
    flush(1050)
    // The wipe spans the viewport the page's snapshot covers.
    expect(incoming.style.getPropertyValue("mask-size")).toBe("320px 200px")
    a.end()
    await run
    reducedMotion(true)
    const b = fakeTransition()
    await ditherViewTransition(b.t)
    expect(b.t.skipped).toBe(true)
  })
})
