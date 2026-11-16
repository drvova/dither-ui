// The kit's motion pieces (container, reveal, sequence, stage) on a
// hand-stepped browser: frames the spec flushes, a clock it sets, observers
// it fires.
import { cleanup, render } from "@solidjs/testing-library"
import { createSignal, type JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DitherAntigravity,
  DitherContainer,
  DitherLayer,
  DitherReveal,
  DitherRotatingText,
  DitherScrollVelocity,
  DitherSequence,
  DitherStage,
  DitherTextType,
  DitherTrueFocus,
} from "../../src/solid"
import { release, seek } from "../../src/engine/clock"
import { type Easing, steps } from "../../src/engine/timing"
import type { CqState } from "../../src/engine/containers"
import { paintOf, recordPaint } from "../support/paint"

/** Manual rAF: each flush runs the currently queued frames at time `t`. */
let queue = new Map<number, FrameRequestCallback>()
let nextId = 1
function flush(t: number): void {
  const batch = [...queue.entries()]
  queue.clear()
  for (const [, cb] of batch) cb(t)
}
let now = 0
/** The runtime clamps dt to 100ms, so fake time walks in 50ms steps. */
function tick(to: number): void {
  for (now += 50; now <= to; now += 50) flush(now)
}
const reducedMotion = (matches: boolean) => {
  window.matchMedia = (() => ({
    matches,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
}
const realMatchMedia = window.matchMedia
const settle = () => Promise.resolve()

type Box = { contentRect: { width: number; height: number } }
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = []
  observed: Element | null = null
  disconnected = false
  constructor(public cb: (entries: Box[]) => void) {
    FakeResizeObserver.instances.push(this)
  }
  observe(el: Element): void {
    this.observed = el
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true
  }
  fire(width: number, height = width): void {
    this.cb([{ contentRect: { width, height } }])
  }
  static get last(): FakeResizeObserver | undefined {
    return FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1]
  }
}
const resize = (width: number, height: number) => FakeResizeObserver.instances.forEach((o) => o.fire(width, height))

beforeEach(() => {
  queue = new Map()
  nextId = 1
  now = 0
  FakeResizeObserver.instances = []
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    const id = nextId++
    queue.set(id, cb)
    return id
  })
  vi.stubGlobal("cancelAnimationFrame", (id: number) => {
    queue.delete(id)
  })
  vi.stubGlobal("IntersectionObserver", undefined) // the mount path plays at once
  vi.stubGlobal("ResizeObserver", FakeResizeObserver)
  reducedMotion(false)
})
afterEach(() => {
  cleanup()
  release()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.matchMedia = realMatchMedia
})

describe("DitherContainer", () => {
  const rootOf = (container: HTMLElement) => container.firstElementChild as HTMLElement

  it("publishes the bucket, index and size vars from an observation, and lets its observer go", async () => {
    const { container, unmount } = render(() => <DitherContainer />)
    const ro = FakeResizeObserver.last!
    expect(ro.observed).toBe(rootOf(container))
    ro.fire(360) // md's min: boundaries are inclusive (the height mirrors it)
    await settle()
    // A new bucket resizes this very box: applied inside the observer's
    // delivery it is a loop the browser reports on the window, so the
    // observation waits for the next frame.
    expect(rootOf(container).getAttribute("data-cq")).toBe("xs")
    flush(0)
    await settle()
    expect(rootOf(container).getAttribute("data-cq")).toBe("md")
    expect(rootOf(container).style.getPropertyValue("--cq-i")).toBe("2")
    expect(rootOf(container).style.getPropertyValue("--cq-w")).toBe("360")
    expect(rootOf(container).style.getPropertyValue("--cq-h")).toBe("360")
    ro.fire(600)
    unmount()
    expect(ro.disconnected).toBe(true)
    expect(queue.size).toBe(0) // the frame an observation asked for goes with it
  })

  it("applies the latest of a frame's observations, once", async () => {
    const { container } = render(() => <DitherContainer />)
    const ro = FakeResizeObserver.last!
    ro.fire(200)
    ro.fire(360)
    expect(queue.size).toBe(1)
    flush(0)
    await settle()
    expect(rootOf(container).style.getPropertyValue("--cq-w")).toBe("360")
  })

  it("hands its children the width and the resolution; step quantizes only the var", async () => {
    let seen: (CqState & { width: number }) | null = null
    const { container } = render(() => (
      <DitherContainer scale={{ narrow: 0, wide: 400 }} step={8}>
        {(scope) => {
          seen = { ...scope }
          return <span>kid</span>
        }}
      </DitherContainer>
    ))
    FakeResizeObserver.last!.fire(404, 300) // 404/8 = 50.5 → 51 → 408
    flush(0)
    await settle()
    expect(seen).toEqual({ width: 404, height: 300, size: "wide", index: 1, matches: ["narrow", "wide"] })
    expect(rootOf(container).style.getPropertyValue("--cq-w")).toBe("408")
    expect(rootOf(container).style.getPropertyValue("--cq-h")).toBe("304") // 300/8 = 37.5 → 38
    expect(rootOf(container).style.getPropertyValue("--cq-i")).toBe("1")
  })

  it("stays at the zero-width bucket without ResizeObserver", async () => {
    vi.stubGlobal("ResizeObserver", undefined)
    const { container } = render(() => <DitherContainer />)
    await settle()
    expect(rootOf(container).getAttribute("data-cq")).toBe("xs")
    expect(rootOf(container).style.getPropertyValue("--cq-w")).toBe("0")
  })

  it("reads the box once when the observer stays silent", async () => {
    vi.useFakeTimers()
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(360)
    const { container } = render(() => <DitherContainer />)
    expect(rootOf(container).getAttribute("data-cq")).toBe("xs") // before the fallback: the 0-width bucket
    vi.advanceTimersByTime(1)
    await settle()
    expect(rootOf(container).getAttribute("data-cq")).toBe("md")
  })

  it("honours a custom scale's ranges (max exclusive)", async () => {
    const { container } = render(() => <DitherContainer scale={{ small: { max: 100 }, large: { min: 100 } }} />)
    FakeResizeObserver.last!.fire(99)
    flush(0)
    await settle()
    expect(rootOf(container).getAttribute("data-cq")).toBe("small")
    FakeResizeObserver.last!.fire(100)
    flush(0)
    await settle()
    expect(rootOf(container).getAttribute("data-cq")).toBe("large")
  })
})

describe("DitherReveal", () => {
  const rootOf = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-reveal]")!
  const state = (container: HTMLElement) => rootOf(container).getAttribute("data-reveal")
  const mask = (container: HTMLElement) => rootOf(container).style.maskImage || ""

  beforeEach(() => {
    now = 1000
    vi.spyOn(performance, "now").mockImplementation(() => now)
  })

  it("follows a manual progress and runs no clock of its own", async () => {
    const [progress, setProgress] = createSignal(0)
    const { container } = render(() => (
      <DitherReveal progress={progress()}>
        <div id="c">hi</div>
      </DitherReveal>
    ))
    await settle()
    expect(state(container)).toBe("hidden")
    expect(queue.size).toBe(0)
    expect(mask(container)).toContain("svg")
    setProgress(0.5)
    expect(state(container)).toBe("playing")
    expect(mask(container)).toContain("rect")
    setProgress(1)
    expect(state(container)).toBe("shown")
    expect(mask(container)).toBe("")
    expect(container.querySelector("#c")).not.toBeNull()
  })

  it("plays its duration on mount and lands shown, and again on a new restart key", async () => {
    const [key, setKey] = createSignal(0)
    const { container } = render(() => <DitherReveal duration={1} easing="linear" restartKey={key()} />)
    await settle()
    expect(queue.size).toBe(1)
    flush(1000)
    expect(state(container)).toBe("hidden")
    flush(1500)
    expect(state(container)).toBe("playing")
    flush(2000)
    expect(state(container)).toBe("shown")
    expect(queue.size).toBe(0)
    now = 2000
    setKey(1)
    expect(queue.size).toBe(1)
    flush(2000)
    expect(state(container)).toBe("hidden")
  })

  it("waits out its delay before the first play", async () => {
    const { container } = render(() => <DitherReveal duration={1} delay={0.5} easing="linear" />)
    await settle()
    flush(1400)
    expect(state(container)).toBe("hidden")
    flush(1750)
    expect(state(container)).toBe("playing")
  })

  it("reverses, and shows at once under reduced motion", async () => {
    const reversed = render(() => <DitherReveal progress={0} reverse />)
    await settle()
    expect(state(reversed.container)).toBe("shown")
    reducedMotion(true)
    const still = render(() => <DitherReveal duration={1} />)
    await settle()
    expect(state(still.container)).toBe("shown")
    expect(queue.size).toBe(0)
  })

  it("is the kit clock's when directed", async () => {
    const { container } = render(() => <DitherReveal duration={2} delay={1} easing="linear" />)
    await settle()
    seek(2000)
    expect(queue.size).toBe(0)
    expect(state(container)).toBe("playing")
    const at2 = mask(container)
    seek(3000)
    expect(state(container)).toBe("shown")
    seek(0)
    expect(state(container)).toBe("hidden")
    seek(2000)
    expect(mask(container)).toBe(at2)
  })
})

describe("Sequence", () => {
  const child = (container: HTMLElement, i: number) => container.firstElementChild!.children[i] as HTMLElement
  const root = (container: HTMLElement) => container.firstElementChild as HTMLElement
  const delayOf = (container: HTMLElement, i: number) => child(container, i).style.getPropertyValue("--seq-delay")
  const stateOf = (container: HTMLElement, i: number) => child(container, i).getAttribute("data-seq")
  const all = (container: HTMLElement) => [0, 1, 2].map((i) => stateOf(container, i))
  const three = () => (
    <>
      <div id="a" />
      <div id="b" />
      <div id="c" />
    </>
  )
  /** What the browser says as a child's `dk-seq` starts or ends. */
  const say = (el: Element, type: "animationstart" | "animationend", animationName = "dk-seq") => {
    const e = new Event(type, { bubbles: true })
    Object.defineProperty(e, "animationName", { value: animationName })
    el.dispatchEvent(e)
  }

  it("lays its stagger and timing on its children as CSS and asks no frames", () => {
    const { container } = render(() => (
      <DitherSequence stagger={0.3} duration={0.5} delay={0.4} from="end">
        {three()}
      </DitherSequence>
    ))
    expect(queue.size).toBe(0)
    expect([0, 1, 2].map((i) => delayOf(container, i))).toEqual(["1s", "0.7s", "0.4s"])
    expect(all(container)).toEqual(["before", "before", "before"])
    const group = root(container)
    expect(group.hasAttribute("data-seq-run")).toBe(true)
    expect(group.style.getPropertyValue("--seq-dur")).toBe("0.5s")
    expect(group.style.getPropertyValue("--seq-ease")).toBe("linear")
    expect(group.style.getPropertyValue("--seq-loops")).toBe("1")
    expect(group.style.getPropertyValue("--seq-dir")).toBe("normal")
    expect(group.style.getPropertyValue("--seq-end")).toBe("1")
  })

  it("reports each child's place from its animation, and says it is done once, when the last ends", () => {
    const onComplete = vi.fn()
    const { container } = render(() => (
      <DitherSequence stagger={0.3} duration={0.5} onComplete={onComplete}>
        {three()}
      </DitherSequence>
    ))
    say(child(container, 0), "animationstart")
    expect(all(container)).toEqual(["active", "before", "before"])
    say(child(container, 0), "animationstart", "dk-other") // not the sequence's
    say(child(container, 1), "animationend", "dk-other")
    expect(all(container)).toEqual(["active", "before", "before"])
    for (const i of [0, 1, 2]) say(child(container, i), "animationend")
    expect(all(container)).toEqual(["done", "done", "done"])
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("eases on a CSS timing function, timing.ts's own, or its frame rate's steps", () => {
    const [easing, setEasing] = createSignal<Easing | string>(steps(4))
    const [fps, setFps] = createSignal(0)
    const { container } = render(() => (
      <DitherSequence duration={0.5} easing={easing()} frameRate={fps()} loop={2} yoyo>
        {three()}
      </DitherSequence>
    ))
    const ease = () => root(container).style.getPropertyValue("--seq-ease")
    expect(ease()).toBe("steps(4, jump-end)")
    setEasing("ease-in-out")
    expect(ease()).toBe("ease-in-out")
    setEasing(() => (p: number) => p * p) // a function CSS cannot say plays linear
    expect(ease()).toBe("linear")
    setFps(12)
    expect(ease()).toBe("steps(6, jump-end)")
    // an even yoyo settles back where it began
    expect(root(container).style.getPropertyValue("--seq-dir")).toBe("alternate")
    expect(root(container).style.getPropertyValue("--seq-end")).toBe("0")
  })

  it("holds while paused or out of view, and replays on a new restart key", async () => {
    let fire: ((visible: boolean) => void) | null = null
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (e: Array<{ isIntersecting: boolean }>) => void) {
          fire = (visible: boolean) => cb([{ isIntersecting: visible }])
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    )
    const [paused, setPaused] = createSignal(false)
    const [key, setKey] = createSignal(0)
    const { container } = render(() => (
      <DitherSequence stagger={0.3} duration={0.5} paused={paused()} restartKey={key()}>
        {three()}
      </DitherSequence>
    ))
    const group = root(container)
    expect(group.hasAttribute("data-seq-run")).toBe(false) // waits to be seen
    fire!(true)
    expect(group.hasAttribute("data-seq-run")).toBe(true)
    expect(group.hasAttribute("data-paused")).toBe(false)
    fire!(false)
    expect(group.hasAttribute("data-paused")).toBe(true)
    fire!(true)
    setPaused(true)
    expect(group.hasAttribute("data-paused")).toBe(true)
    setPaused(false)
    say(child(container, 0), "animationend")
    expect(stateOf(container, 0)).toBe("done")
    setKey(1)
    await settle()
    expect(all(container)).toEqual(["before", "before", "before"])
    expect(queue.size).toBe(0)
  })

  it("under reduced motion, shows every child settled and is done at once", () => {
    reducedMotion(true)
    const onComplete = vi.fn()
    const { container } = render(() => (
      <DitherSequence stagger={0.3} duration={0.5} onComplete={onComplete}>
        {three()}
      </DitherSequence>
    ))
    expect(queue.size).toBe(0)
    expect(all(container)).toEqual(["done", "done", "done"])
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("with no children, completes without frames", () => {
    const onComplete = vi.fn()
    render(() => <DitherSequence onComplete={onComplete} />)
    expect(queue.size).toBe(0)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe("DitherStage and DitherLayer", () => {
  const Scene = (p: { yoyo?: boolean; paused?: boolean }) => (
    <DitherStage duration={4} paused={p.paused}>
      <DitherLayer
        keyframes={[
          { x: "-10cqw", opacity: 0 },
          { x: "10cqw", opacity: 1 },
        ]}
        duration={2}
        yoyo={p.yoyo ?? true}
        loop
      >
        {(slot) => (
          <i id="v">
            {Math.round(slot.x)}|{slot.progress}|{slot.width}
          </i>
        )}
      </DitherLayer>
    </DitherStage>
  )
  const stageOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".dither-stage")!
  const layerOf = (container: HTMLElement) => container.querySelector<HTMLElement>(".dither-layer")!
  const read = (container: HTMLElement) => container.querySelector("#v")!.textContent

  beforeEach(() => {
    now = 1000
  })

  it("drives layers from one clock in container units; the child gets px against the measured box", async () => {
    const { container, unmount } = render(() => <Scene />)
    await settle()
    resize(400, 200)
    flush(1000)
    await settle()
    const el = layerOf(container)
    expect(stageOf(container).getAttribute("data-stage")).toBe("playing")
    expect(el.style.transform).toBe("translate(-10cqw, 0px)")
    expect(el.style.opacity).toBe("0")
    expect(el.getAttribute("data-layer")).toBe("active")
    expect(read(container)).toBe("-40|0|400")
    tick(1500)
    await settle()
    expect(stageOf(container).getAttribute("data-stage-time")).toBe("0.50")
    expect(el.style.transform).toBe("translate(-5cqw, 0px)")
    expect(el.style.opacity).toBe("0.25")
    expect(el.style.getPropertyValue("--layer-x")).toBe("-20px")
    expect(el.style.getPropertyValue("--layer-p")).toBe("0.25")
    expect(read(container)).toBe("-20|0.25|400")
    // A narrower box: the same moment, the same units, fewer px.
    resize(200, 100)
    await settle()
    expect(el.style.transform).toBe("translate(-5cqw, 0px)")
    expect(read(container)).toBe("-10|0.25|200")
    unmount()
    expect(queue.size).toBe(0)
  })

  it("holds the composition's moment when directed, looping the stage's duration, and requests no frames", async () => {
    const { container } = render(() => <Scene />)
    await settle()
    resize(400, 200)
    seek(500)
    await settle()
    expect(stageOf(container).getAttribute("data-stage")).toBe("directed")
    expect(layerOf(container).style.transform).toBe("translate(-5cqw, 0px)")
    expect(queue.size).toBe(0)
    seek(1500)
    expect(layerOf(container).style.transform).toBe("translate(5cqw, 0px)")
    // yoyo: the second cycle runs back; the stage wraps at 4s
    seek(3500)
    expect(layerOf(container).style.transform).toBe("translate(-5cqw, 0px)")
    seek(4500)
    expect(stageOf(container).getAttribute("data-stage-time")).toBe("0.50")
    expect(layerOf(container).style.transform).toBe("translate(-5cqw, 0px)")
    release()
    await settle()
    expect(queue.size).toBe(1)
  })

  it("settles every layer at its end under reduced motion, and a paused stage requests no frames", async () => {
    reducedMotion(true)
    const still = render(() => <Scene yoyo={false} />)
    await settle()
    expect(stageOf(still.container).getAttribute("data-stage")).toBe("still")
    expect(layerOf(still.container).getAttribute("data-layer")).toBe("done")
    expect(layerOf(still.container).style.transform).toBe("translate(10cqw, 0px)")
    expect(queue.size).toBe(0)
    reducedMotion(false)
    const paused = render(() => <Scene paused />)
    await settle()
    expect(stageOf(paused.container).getAttribute("data-stage")).toBe("paused")
    expect(queue.size).toBe(0)
  })

  it("a layer stands alone at its first keyframe without a stage", async () => {
    const { container } = render(() => <DitherLayer keyframes={[{ x: "10cqw" }, { x: "20cqw" }]} />)
    await settle()
    expect(layerOf(container).style.transform).toBe("translate(10cqw, 0px)")
    expect(layerOf(container).getAttribute("data-layer")).toBe("active")
  })
})

describe("the cadence pieces in CSS", () => {
  // Each turns, types or drifts in its stylesheet: what the markup says is
  // the same at every moment (the clock holds the CSS, engine/clock.ts),
  // and none asks a frame.
  const pieces: [string, () => JSX.Element][] = [
    ["DitherRotatingText", () => <DitherRotatingText texts={["a", "b", "c"]} interval={500} />],
    ["DitherTrueFocus", () => <DitherTrueFocus text="one two three" interval={500} />],
    [
      "DitherTextType",
      () => <DitherTextType texts={["Hello", "World"]} typingSpeed={100} deletingSpeed={100} pause={200} />,
    ],
    ["DitherScrollVelocity", () => <DitherScrollVelocity text="drift" />],
  ]
  it.for(pieces)("%s is one markup at every moment and asks no frames", async ([, piece]) => {
    const { container } = render(piece)
    await settle()
    const free = container.innerHTML
    seek(1000)
    await settle()
    expect(container.innerHTML).toBe(free)
    seek(1800)
    await settle()
    expect(container.innerHTML).toBe(free)
    release()
    expect(queue.size).toBe(0)
  })
})

describe("the cadence pieces on the kit clock", () => {
  // Antigravity's motes are a canvas: it draws the moment it is seeked to,
  // the same however the moment was reached.
  const pieces: [string, () => JSX.Element][] = [
    ["DitherAntigravity", () => <DitherAntigravity count={6}>Up</DitherAntigravity>],
  ]
  let undoPaint: () => void
  beforeEach(() => {
    undoPaint = recordPaint()
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400)
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width: 200, height: 100 } as DOMRect)
  })
  afterEach(() => undoPaint())
  const shows = (host: HTMLElement) => [host.innerHTML, ...[...host.querySelectorAll("canvas")].map(paintOf)].join("\n")

  it.for(pieces)(
    "%s shows the moment it is seeked to, again on the way back, and asks no frames",
    async ([, piece]) => {
      const { container } = render(piece)
      await settle()
      seek(1000)
      await settle()
      const at1000 = shows(container)
      seek(1800)
      await settle()
      expect(shows(container)).not.toBe(at1000)
      seek(1000)
      await settle()
      expect(shows(container)).toBe(at1000)
      expect(queue.size).toBe(0)
      release() // the run goes on
      expect(queue.size).toBeGreaterThan(0)
    },
  )
})
