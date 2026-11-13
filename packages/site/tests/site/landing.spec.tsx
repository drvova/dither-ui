// The landing in Solid (`src/pages/landing/`), held to what its Vue twins
// did: the brand's moment and its replay, the rise of every head, the bento
// and its one moving layer, the agent's story, the install's one gesture,
// the art that moves only on cue, and a mount that reads no layout.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { MetaProvider } from "@solidjs/meta"
import { createRoot, createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { MODEL_FORMATS } from "@dither-ui/kit/engine/models.ts"
import { LOCKUP, LOCKUP_SIZE, STAGINGS } from "@/pages/landing/brand"
import { BUILD_CELLS } from "@/pages/landing/build"
import { COMPONENT_COUNT, HARNESSES, MODEL_NAMES, RUNTIME_DEPS, SPECS, WORKS } from "@/pages/landing/facts"
import { FILM } from "@/pages/landing/film"
import { BENTO, DOCS_FAMILIES, STAGGER } from "@/pages/landing/hub"
import { layoutPixelText, PIXEL_ROWS } from "@/pages/landing/pixel-type"
import { PLATES } from "@/pages/landing/plate"
import { WORDMARK } from "@/pages/landing/road"
import { ASK, DEPLOYS, DOES, STEPS } from "@/pages/landing/story"
import { TOTAL } from "@/pages/landing/stat"
import { RISE } from "@/shared/lib/rise"
import { RISE_LIVE } from "@/shared/lib/rise-wait"
import { STYLING_LABELS } from "@dither-ui/restyle"
import { rise } from "../../src/shared/lib"
import { LandingPage, MissingPage } from "../../src/pages/landing"
import AgentStory from "../../src/pages/landing/AgentStory"
import BrandBuild from "../../src/pages/landing/BrandBuild"
import BrandGather from "../../src/pages/landing/BrandGather"
import Examples from "../../src/pages/landing/Examples"
import ExportScene from "../../src/pages/landing/ExportScene"
import HeatPrint from "../../src/pages/landing/HeatPrint"
import InstallBlock from "../../src/pages/landing/InstallBlock"
import LineWordmark from "../../src/pages/landing/LineWordmark"
import PauseChip from "../../src/pages/landing/PauseChip"
import PixelWord from "../../src/pages/landing/PixelWord"
import Plate from "../../src/pages/landing/Plate"
import RiseWords from "../../src/pages/landing/RiseWords"
import Showcase from "../../src/pages/landing/Showcase"
import TrailerDialog from "../../src/pages/landing/TrailerDialog"
import WorksWith from "../../src/pages/landing/WorksWith"
import { useDrive } from "../../src/pages/landing/drive"
import { world } from "@dither-ui/kit/testing/world.ts"

// Every reveal the bento makes, as the props it was handed: its delay is
// not in the page, so the stagger is read here.
const reveals = vi.hoisted(() => [] as { class?: string; delay?: number }[])
vi.mock("@dither-ui/kit/solid/DitherReveal.tsx", async (original) => {
  const real = await original<typeof import("@dither-ui/kit/solid/DitherReveal.tsx")>()
  return {
    ...real,
    default: (props: Parameters<typeof real.default>[0]) => {
      reveals.push(props)
      return real.default(props)
    },
  }
})

const all = (root: ParentNode, sel: string) => [...root.querySelectorAll<HTMLElement>(sel)]
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim()
const tick = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

let reduced = false
/** Which media queries match, beyond reduced motion. */
let media: (query: string) => boolean = () => false
let page: ReturnType<typeof world>
beforeEach(() => {
  reduced = false
  media = () => false
  reveals.length = 0
  page = world()
  // No GPU here: a WebGL context is refused, as a browser without one does.
  const flat = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, kind: string) => unknown
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string) {
    return kind === "2d" ? flat.call(this, kind) : null
  } as typeof HTMLCanvasElement.prototype.getContext
  window.matchMedia = ((q: string) => ({
    matches: q.includes("reduce") ? reduced : media(q),
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  page.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.documentElement.className = ""
  delete document.documentElement.dataset.rise
})

// Art that moves only on cue: driven for a while, settled when the cues stop.
describe("the drive", () => {
  it("runs at least as long as it was last asked to, then settles", () => {
    vi.useFakeTimers()
    createRoot((dispose) => {
      const { driven, drive, running } = useDrive()
      expect([driven(), running()]).toEqual([false, false])
      drive(4000)
      expect([driven(), running()]).toEqual([true, true])
      // A shorter cue never cuts a longer run short.
      vi.advanceTimersByTime(1000)
      drive()
      vi.advanceTimersByTime(2900)
      expect(driven()).toBe(true)
      vi.advanceTimersByTime(200)
      expect([driven(), running()]).toEqual([false, false])
      dispose()
    })
  })
})

// The rise: a headline's words each their own box, the line still one text.
describe("the rise of a head", () => {
  let seen: ((entries: { isIntersecting: boolean }[]) => void) | null = null
  let animated: { delay: number; easing: string }[] = []
  beforeEach(() => {
    seen = null
    animated = []
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: { isIntersecting: boolean }[]) => void) {
          seen = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    Element.prototype.animate = function (_k: unknown, o: KeyframeAnimationOptions) {
      animated.push({ delay: Number(o.delay), easing: String(o.easing) })
      return {} as Animation
    } as typeof Element.prototype.animate
  })
  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate
  })

  const head = () =>
    render(() => (
      <div ref={rise}>
        <h2>
          <RiseWords text="Every component, live." />
        </h2>
        <p data-rise>lede</p>
        <a data-rise>more</a>
      </div>
    ))

  it("keeps the headline one line of text, its words each their own box", () => {
    const w = head()
    expect(w.container.querySelector("h2")!.textContent).toBe("Every component, live.")
    expect(all(w.container, '[data-rise="word"]').map((s) => s.textContent)).toEqual(["Every", "component,", "live."])
    expect(all(w.container, ".rise-word")).toHaveLength(3)
  })

  it("wears the word class on every word", () => {
    const w = render(() => <RiseWords text="A dithered kit" word="chrome-type" />)
    expect(all(w.container, "span").map((s) => s.className)).toEqual(
      Array(3).fill("rise-words-scope rise-word chrome-type"),
    )
  })

  it("rises each riser once it comes into view, on the glide", () => {
    const w = head()
    expect(document.documentElement.dataset.rise).toBe(RISE_LIVE)
    expect(animated).toEqual([])
    seen!([{ isIntersecting: true }])
    expect(animated.map((a) => a.delay)).toEqual([0, 60, 120, 240, 330])
    expect(new Set(animated.map((a) => a.easing))).toEqual(new Set([RISE.easing]))
    expect(all(w.container, "[data-rise]").every((e) => e.getAttribute("data-risen") === "")).toBe(true)
  })
})

describe("the small parts", () => {
  it("sets a word in the pixel face, a rect a cell, hidden from readers", () => {
    const w = render(() => <PixelWord text="kit" />)
    const laid = layoutPixelText("kit")
    const svg = w.container.querySelector("svg")!
    expect(all(svg, "rect")).toHaveLength(laid.cells.length)
    expect(svg.getAttribute("viewBox")).toBe(`0 0 ${laid.width} ${PIXEL_ROWS}`)
    expect([svg.getAttribute("width"), svg.getAttribute("height")]).toEqual([
      String(laid.width * 5),
      String(PIXEL_ROWS * 5),
    ])
    expect(svg.getAttribute("aria-hidden")).toBe("true")
    const big = render(() => <PixelWord text="kit" cell={8} />)
    expect(big.container.querySelector("svg")!.getAttribute("width")).toBe(String(laid.width * 8))
  })

  it("names the pause for its surface and says pressed while it is still", () => {
    const [playing, setPlaying] = createSignal(true)
    const w = render(() => (
      <PauseChip modelValue={playing()} onUpdateModelValue={setPlaying} label="Pause the silk" class="chip" />
    ))
    const chip = w.getByRole("button", { name: "Pause the silk" })
    expect(chip.className).toBe("pause-chip-scope pause-chip chip")
    expect(chip.getAttribute("aria-pressed")).toBe("false")
    expect(chip.querySelector(".pause-glyph")!.hasAttribute("data-paused")).toBe(false)
    fireEvent.click(chip)
    expect(playing()).toBe(false)
    expect(chip.getAttribute("aria-pressed")).toBe("true")
    expect(chip.querySelector(".pause-glyph")!.getAttribute("data-paused")).toBe("true")
    fireEvent.click(chip)
    expect(chip.getAttribute("aria-pressed")).toBe("false")
  })

  it("prints the wordmark as rows clipped to its own word, each instance its own clip", () => {
    const w = render(() => (
      <>
        <LineWordmark />
        <LineWordmark />
      </>
    ))
    const [a, b] = all(w.container, "svg.line-wordmark")
    expect(a.getAttribute("aria-hidden")).toBe("true")
    expect(a.getAttribute("viewBox")).toBe(`0 0 ${WORDMARK.W} ${WORDMARK.H}`)
    expect(all(a, "g rect")).toHaveLength(WORDMARK.ROWS)
    const heights = all(a, "g rect").map((r) => Number(r.getAttribute("height")))
    expect(heights).toEqual([...heights].sort((x, y) => x - y))
    const clip = a.querySelector("clipPath")!
    expect(a.querySelector("g")!.getAttribute("clip-path")).toBe(`url(#${clip.id})`)
    expect(clip.id).not.toBe(b.querySelector("clipPath")!.id)
    expect(all(a, "text").map((t) => text(t))).toEqual(["dither-ui", "dither-ui"])
    expect(a.querySelector("text.ground")!.getAttribute("textLength")).toBe(String(WORDMARK.W))
  })

  it("prints the heat on a hidden sheet of its own", () => {
    const w = render(() => <HeatPrint paused />)
    const sheet = w.container.querySelector<HTMLElement>(".heat-print")!
    expect(sheet.getAttribute("aria-hidden")).toBe("true")
    expect(sheet.querySelector("canvas")!.style.imageRendering).toBe("pixelated")
  })

  it("sets a plate as a hidden sheet of its proportion, the brand in its band", () => {
    const plate = PLATES.afterExamples
    // jsdom's style parser drops a clamp(): what the lockup is given is read
    // as it is set.
    const set = vi.spyOn(CSSStyleDeclaration.prototype, "setProperty")
    const w = render(() => <Plate plate={plate} />)
    const sheet = w.container.querySelector<HTMLElement>(".plate")!
    expect(sheet.getAttribute("aria-hidden")).toBe("true")
    expect(parseFloat(sheet.style.aspectRatio)).toBe(plate.aspect)
    expect(sheet.querySelector(".plate-print .heat-print canvas")).not.toBeNull()
    const lockup = sheet.querySelector<HTMLElement>(".plate-lockup.brand-gather")!
    expect(set.mock.calls.filter((c) => c[0] === "left").map((c) => c[1])).toContain(
      `clamp(16px, calc(${plate.mark[0] * 100}% - 14px), calc(100% - ${LOCKUP_SIZE.width * 4 + 16}px))`,
    )
    expect(lockup.style.top).toBe(`calc(${plate.mark[1] * 100}% - 14px)`)
    expect(lockup.style.width).toBe(`${LOCKUP_SIZE.width * 4}px`)
  })
})

// The film: nothing of it in the page until its dialog opens.
describe("the trailer", () => {
  let plays = 0
  beforeEach(() => {
    plays = 0
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => (plays++, Promise.resolve()))
  })
  const film = () => {
    const [open, setOpen] = createSignal(false)
    render(() => <TrailerDialog modelValue={open()} onUpdateModelValue={setOpen} />)
    return { open, setOpen }
  }

  it("holds no video until it opens, then plays H.264 first, VP9 after", async () => {
    const { open, setOpen } = film()
    expect(document.querySelector("video")).toBeNull()
    setOpen(true)
    await tick()
    const dialog = document.querySelector('[role="dialog"]')!
    expect(text(dialog.querySelector("h2"))).toBe(FILM.title)
    expect(dialog.textContent).toContain(FILM.description)
    const video = dialog.querySelector("video")!
    expect(all(video, "source").map((s) => s.getAttribute("type"))).toEqual(["video/mp4", "video/webm"])
    expect(video.getAttribute("poster")).toContain("/trailer/poster.webp")
    expect(video.hasAttribute("controls")).toBe(true)
    expect(video.hasAttribute("playsinline")).toBe(true)
    expect(plays).toBe(1)
    fireEvent.click(dialog.querySelector('[aria-label="Close"]')!)
    expect(open()).toBe(false)
  })

  it("waits on its poster under reduced motion", async () => {
    reduced = true
    film().setOpen(true)
    await tick()
    expect(document.querySelector("video")).not.toBeNull()
    expect(plays).toBe(0)
  })
})

/** Enough of a Web Animation: a playState, a clock and a finished promise
 * that, as in the platform, is renewed only when a finished one plays. */
class FakeAnimation {
  playState: AnimationPlayState = "idle"
  currentTime: number | null = null
  private done!: () => void
  finished = this.fresh()
  private fresh() {
    return new Promise<void>((resolve) => (this.done = resolve))
  }
  pause() {
    this.playState = "paused"
  }
  play() {
    if (this.playState === "finished") this.finished = this.fresh()
    this.playState = "running"
  }
  finish() {
    this.playState = "finished"
    this.done()
  }
}

// The brand says `moving` as its moment starts, and the hero's plays it
// again under a resting mouse or pen: only once it is home, never for a
// finger, never once the reader asks for reduced motion, and only where the
// parent asks for it (`replay`). Its moment is built only as it comes within
// a screen of view (the first observer), then plays as its home is in view
// (the second).
describe("the brand's moment", () => {
  let anims: FakeAnimation[] = []
  let reveal: (() => void) | null = null
  let parents = 0
  const saved: [object, string, PropertyDescriptor | undefined][] = []
  const stub = (target: object, key: string, value: PropertyDescriptor) => {
    saved.push([target, key, Object.getOwnPropertyDescriptor(target, key)])
    Object.defineProperty(target, key, { configurable: true, ...value })
  }
  beforeEach(() => {
    anims = []
    reveal = null
    parents = 0
    stub(HTMLElement.prototype, "animate", {
      value: () => {
        const a = new FakeAnimation()
        anims.push(a)
        return a
      },
    })
    stub(HTMLElement.prototype, "offsetParent", {
      get(this: HTMLElement) {
        parents++
        return this.parentElement
      },
    })
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          reveal = () => callback([{ isIntersecting: true } as IntersectionObserverEntry], this as never)
        }
        observe() {}
        disconnect() {}
      },
    )
  })
  afterEach(() => {
    for (const [target, key, descriptor] of saved.reverse()) {
      if (descriptor) Object.defineProperty(target, key, descriptor)
      else delete (target as Record<string, unknown>)[key]
    }
    saved.length = 0
  })

  const settle = async () => {
    for (const a of anims) a.finish()
    await tick()
  }
  const hover = (el: Element, pointerType: string) =>
    el.dispatchEvent(new PointerEvent("pointerenter", { pointerType }))
  const brand = (scene: (typeof STAGINGS)[keyof typeof STAGINGS], replay?: boolean) => {
    const said = { moving: 0, settled: 0 }
    const w = render(() => (
      <BrandGather scene={scene} replay={replay} onMoving={() => said.moving++} onSettled={() => said.settled++} />
    ))
    return { said, lockup: w.container.querySelector<HTMLElement>(".brand-gather")!, unmount: w.unmount }
  }

  it("stands as the lockup's cells, the core in the ember, hidden from readers", () => {
    const { lockup } = brand(STAGINGS.hero)
    expect(lockup.getAttribute("aria-hidden")).toBe("true")
    expect(all(lockup, ".brand-cell")).toHaveLength(LOCKUP.length)
    expect(all(lockup, ".brand-cell.core")).toHaveLength(LOCKUP.filter((c) => c.core).length)
    expect(lockup.style.height).toBe(`${LOCKUP_SIZE.height * 4}px`)
  })

  it("plays again under a resting mouse once home, never for a finger", async () => {
    const { said, lockup } = brand(STAGINGS.hero, true)
    // Nothing is built, and the field not read, until the lockup comes
    // within a screen of view.
    expect(anims).toHaveLength(0)
    expect(parents).toBe(0)
    reveal!()
    expect(anims).toHaveLength(LOCKUP.length * 2)
    // Held loose for its first view, a hover does not start it early.
    hover(lockup, "mouse")
    expect(said.moving).toBe(0)
    expect(anims.every((a) => a.playState === "paused")).toBe(true)
    reveal!()
    expect(anims.every((a) => a.playState === "running")).toBe(true)
    expect(said.moving).toBe(1)

    // Over a moment still playing, a hover does nothing.
    hover(lockup, "mouse")
    expect(said.moving).toBe(1)
    await settle()
    expect(said.settled).toBe(1)

    // A finger passing over is no hover.
    hover(lockup, "touch")
    expect(said.moving).toBe(1)

    // A mouse plays it again from the top, and it settles again.
    for (const a of anims) a.currentTime = 4600
    hover(lockup, "mouse")
    expect(said.moving).toBe(2)
    expect(anims.every((a) => a.playState === "running" && a.currentTime === 0)).toBe(true)
    await settle()
    expect(said.settled).toBe(2)

    // Reduced motion asked for since the page opened: a hover replays nothing.
    reduced = true
    hover(lockup, "mouse")
    expect(said.moving).toBe(2)
    expect(anims.every((a) => a.playState === "finished")).toBe(true)
  })

  it("plays once only where the parent does not ask for replays", async () => {
    const { said, lockup } = brand(STAGINGS.foot)
    reveal!() // near: built, held loose
    reveal!() // in view: plays
    await settle()
    hover(lockup, "mouse")
    expect(said.moving).toBe(1)
    expect(anims.every((a) => a.playState === "finished")).toBe(true)
  })

  it("is simply assembled under reduced motion, settled at once", () => {
    reduced = true
    const { said } = brand(STAGINGS.hero, true)
    expect(reveal).toBeNull()
    expect(anims).toHaveLength(0)
    expect(said).toEqual({ moving: 0, settled: 1 })
  })
})

// Nothing reads layout while the landing mounts: each read forced a layout
// of the whole page in the middle of mounting it.
describe("mounting reads no layout", () => {
  it("the build's stage takes its first reading in the frame, not as it mounts", async () => {
    const boxes = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
    const w = render(() => <BrandBuild />)
    expect(boxes).not.toHaveBeenCalled()
    // the frame takes it
    await page.frame(0)
    expect(boxes).toHaveBeenCalled()
    const run = w.container.querySelector(".build-run")!
    expect(run.classList.contains("still")).toBe(false)
    expect(run.querySelector(".build-stage [role='img']")?.getAttribute("aria-label")).toContain(
      `in ${BUILD_CELLS} cells`,
    )
  })

  it("the build stands whole and still under reduced motion, with no run", () => {
    reduced = true
    const scroll = vi.spyOn(window, "addEventListener")
    const w = render(() => <BrandBuild />)
    expect(w.container.querySelector(".build-run")!.classList.contains("still")).toBe(true)
    expect(scroll.mock.calls.map((c) => c[0])).not.toContain("scroll")
  })

  it("the bento staggers its cards from an observer's report, never reading a box", () => {
    const reported: Element[] = []
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(el: Element) {
          reported.push(el)
          this.callback(
            [
              {
                target: el,
                isIntersecting: false,
                // the bento wide; each card its own column in one row
                boundingClientRect: el.parentElement?.classList.contains("bento")
                  ? new DOMRect([...el.parentElement.children].indexOf(el) * 100, 0, 90, 90)
                  : new DOMRect(0, 0, 100_000, 400),
              } as never,
            ],
            this as never,
          )
        }
        unobserve() {}
        disconnect() {}
      },
    )
    const boxes = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
    render(() => <Examples />)
    expect(boxes).not.toHaveBeenCalled()
    expect(reported.length).toBeGreaterThan(1)
    // every card reported one by one: each still gets its delay, by column
    const delays = reveals.filter((r) => r.class?.includes("card-art")).map((r) => r.delay)
    expect(delays).toHaveLength(BENTO.length)
    expect(delays.slice(0, 3)).toEqual([0, STAGGER, 2 * STAGGER])
  })
})

// The bento: every card the real component over its name, one moving
// surface playing at a time, each with its pause.
describe("the examples", () => {
  const bento = () => {
    // Without an observer every moving card counts as on screen and centred.
    vi.stubGlobal("IntersectionObserver", undefined)
    const w = render(() => <Examples />)
    const chips = () =>
      Object.fromEntries(
        all(w.container, ".pause-chip").map((c) => [c.getAttribute("aria-label"), c.getAttribute("aria-pressed")]),
      )
    return { ...w, chips }
  }

  it("heads the section and names every card as the link to its docs", () => {
    const w = bento()
    const section = w.container.querySelector("section#examples")!
    expect(section.getAttribute("aria-labelledby")).toBe("examples-h")
    expect(text(section.querySelector("#examples-h"))).toBe("Every component, live.")
    expect(text(section.querySelector(".sec-lede"))).toBe(
      `${COMPONENT_COUNT} components on one engine. Every card is the real thing, so poke it, then open its docs for the props and the code.`,
    )
    expect(text(section.querySelector(".lede-key"))).toBe("Every card is the real thing")
    const cards = all(section, ".bento > li.card")
    expect(cards.map((c) => c.className)).toEqual(BENTO.map((t) => `card t-${t.id}`))
    expect(cards.map((c) => text(c.querySelector(".card-name")))).toEqual(BENTO.map((t) => t.label))
    expect(cards.map((c) => c.querySelector(".card-name")!.getAttribute("href"))).toEqual(
      BENTO.map((t) => `/docs/${t.id}`),
    )
    expect(all(section, "[data-moving]").map((c) => c.dataset.moving)).toEqual(
      BENTO.map((t) => t.id).filter((id) => ["world", "shader", "ferrofluid", "silk"].includes(id)),
    )
    expect(
      all(section, "[data-lazy]")
        .map((c) => c.dataset.lazy)
        .sort(),
    ).toEqual(["ferrofluid", "shader", "styling"])
  })

  it("plays one moving surface at a time, a pause the reader's and a play their choice", () => {
    const { chips, getByRole } = bento()
    const first = BENTO.map((t) => t.id).find((id) => ["world", "shader", "ferrofluid", "silk"].includes(id))
    expect(first).toBe("world")
    // The first in page order plays; the rest hold a still frame.
    expect(chips()).toEqual({
      "Pause the model": "false",
      "Pause the shader": "true",
      "Pause the fluid": "true",
      "Pause the silk": "true",
    })
    // Play on a held surface makes it the reader's choice.
    fireEvent.click(getByRole("button", { name: "Pause the silk" }))
    expect(chips()).toMatchObject({ "Pause the model": "true", "Pause the silk": "false" })
    // A pause is the reader's: nothing else starts in its place.
    fireEvent.click(getByRole("button", { name: "Pause the silk" }))
    expect(new Set(Object.values(chips()))).toEqual(new Set(["true"]))
    // A mouse over a card points at it; a finger does not.
    const card = (id: string) => document.querySelector(`.t-${id}`)!
    card("shader").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "touch" }))
    expect(chips()["Pause the shader"]).toBe("true")
    card("shader").dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }))
    expect(chips()).toMatchObject({ "Pause the shader": "false", "Pause the silk": "true" })
    // Leaving it, the reader's last choice keeps playing.
    card("shader").dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse" }))
    expect(chips()["Pause the shader"]).toBe("false")
  })

  it("keeps each card's controls real: pressed segments, a split that moves, a seed that rolls", () => {
    const w = bento()
    const pressed = (label: string) =>
      all(w.getByRole("group", { name: label }), "button[aria-pressed='true']").map((b) => text(b) || b.ariaLabel)
    expect(pressed("Model ramp")).toEqual(["blue"])
    fireEvent.click(w.getByRole("button", { name: "metal" }))
    expect(pressed("Model ramp")).toEqual(["metal"])
    expect(pressed("Screen")).toEqual(["bayer"])
    expect(pressed("Fill")).toEqual(["gradient"])
    fireEvent.click(w.getByRole("button", { name: "hatched" }))
    expect(pressed("Fill")).toEqual(["hatched"])
    expect(all(w.getByRole("group", { name: "Hue" }), "button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "blue",
      "orange",
      "green",
      "purple",
      "pink",
    ])
    const range = w.container.querySelector<HTMLInputElement>(".split-range")!
    const split = w.container.querySelector<HTMLElement>(".split")!
    expect(split.style.getPropertyValue("--split")).toBe("42%")
    fireEvent.input(range, { target: { value: "70" } })
    expect(split.style.getPropertyValue("--split")).toBe("70%")
    // The stat card's two lines under the headline: the week's change showing.
    const sub = all(w.container, ".stat-sub > span")
    expect(sub.map((s) => [s.hasAttribute("data-on"), s.getAttribute("aria-hidden")])).toEqual([
      [true, "false"],
      [false, "true"],
    ])
    expect(w.container.querySelector(".stat-v")!.textContent?.replace(/\D/g, "")).toContain(String(TOTAL))
    // A roll keeps four digits.
    const chart = () => w.container.querySelector(".area-chart")
    const before = chart()
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    fireEvent.click(w.getByRole("button", { name: "Roll a seed" }))
    expect(chart()).not.toBe(before)
    expect(text(w.container.querySelector(".cipher"))).not.toBe("")
  })
})

// The bento's styling card: one snippet, live beside its code in the picked
// system.
describe("the styling card", () => {
  it("writes the card in StyleX first, and in any system picked", () => {
    const w = render(() => <ExportScene />)
    const code = () => all(w.container, ".export-code .ln").map((l) => l.textContent)
    const pressed = () => all(w.container, ".seg button[aria-pressed='true']").map(text)
    expect(all(w.container, ".seg button").map(text)).toEqual(Object.values(STYLING_LABELS))
    expect(pressed()).toEqual([STYLING_LABELS.stylex])
    expect(code().join("\n")).toContain("stylex")
    // Written as the Solid file a reader takes, never in the snippets' authoring notation.
    expect(code().join("\n")).toContain("{...stylex.props(")
    expect(code().join("\n")).not.toMatch(/v-bind|<script setup|<style scoped/)
    expect(text(w.container.querySelector(".export-live"))).toContain("Invoices")
    fireEvent.click(w.getByRole("button", { name: STYLING_LABELS.tailwind }))
    expect(pressed()).toEqual([STYLING_LABELS.tailwind])
    expect(code()[0]).toBe('<div class="flex flex-col gap-3 rounded-lg bg-background p-4">')
    // Each line carries its own indent, so a wrapped line hangs under itself.
    const second = w.container.querySelectorAll<HTMLElement>(".export-code .ln")[1]
    expect(second.style.getPropertyValue("--indent")).toBe("2")
    const pane = w.container.querySelector(".export-code")!
    expect([pane.getAttribute("tabindex"), pane.getAttribute("aria-label")]).toEqual(["0", "The card's code"])
  })
})

// One agent session, a step per notch of scroll; unpinned it shows its end.
describe("the agent's story", () => {
  const lines = (root: ParentNode) => all(root, ".does li").map((li) => li.className)

  it("shows the whole session and screen where nothing pins", () => {
    const w = render(() => <AgentStory />)
    const story = w.container.querySelector<HTMLElement>(".story")!
    expect(story.classList.contains("pinned")).toBe(false)
    expect(story.style.getPropertyValue("--steps")).toBe(String(STEPS))
    expect(story.querySelector(".markers")).toBeNull()
    expect(lines(story)).toEqual(DOES.map(() => "done"))
    expect(all(story, ".does li").map(text)).toEqual([...DOES])
    expect(text(story.querySelector(".ask"))).toBe(ASK)
    expect(all(story, ".part").every((p) => p.classList.contains("on"))).toBe(true)
    expect(story.querySelector(".render")!.className).toBe("render done")
    expect(all(story, ".render-words > span[data-on]").map(text)).toEqual(["MP4 ready"])
    expect(text(story.querySelector(".count-n"))).toBe(String(DEPLOYS))
    // The stage is decoration; the caption says the whole session.
    expect(story.querySelector(".session")!.getAttribute("aria-hidden")).toBe("true")
    const told = DOES.map((d) => d[0].toLowerCase() + d.slice(1))
    expect(text(story.querySelector("figcaption"))).toBe(
      `The ask: ${ASK} Your agent ${told.slice(0, -1).join(", ")} and ${told.at(-1)}.`,
    )
    // The screen's controls are real and named.
    expect(w.getByRole("progressbar").getAttribute("aria-label")).toBe("Build minutes")
    const auto = w.getByRole("switch", { name: "Auto deploy" })
    expect(auto.getAttribute("aria-checked")).toBe("true")
    fireEvent.click(auto)
    expect(auto.getAttribute("aria-checked")).toBe("false")
  })

  it("pins on a wide screen and steps as each marker crosses the middle", async () => {
    media = (q) => q.includes("min-width: 900px")
    let report: IntersectionObserverCallback | null = null
    const watched: Element[] = []
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(
          callback: IntersectionObserverCallback,
          public init?: IntersectionObserverInit,
        ) {
          if (init?.rootMargin === "-50% 0px -50% 0px") report = callback
        }
        observe(el: Element) {
          if (this.init?.rootMargin === "-50% 0px -50% 0px") watched.push(el)
        }
        disconnect() {}
      },
    )
    const w = render(() => <AgentStory />)
    await tick()
    const story = w.container.querySelector(".story")!
    expect(story.classList.contains("pinned")).toBe(true)
    const markers = all(story, ".markers > span")
    expect(markers).toHaveLength(STEPS)
    expect(watched).toEqual(markers)
    // The first step: the first line at work under its spinner, the rest unsaid.
    expect(lines(story)).toEqual(["working", ...DOES.slice(1).map(() => "ahead")])
    expect(all(story, ".part.on")).toHaveLength(0)
    expect(story.querySelector(".render")!.className).toBe("render ahead")
    const cross = (i: number, isIntersecting: boolean) =>
      report!([{ target: markers[i], isIntersecting } as unknown as IntersectionObserverEntry], null as never)
    cross(1, true)
    expect(lines(story)).toEqual(["done", "working", "ahead", "ahead"])
    expect(all(story, ".part.on")).toHaveLength(2)
    // Two markers in the band: the later one is the step.
    cross(DOES.length - 1, true)
    expect(story.querySelector(".render")!.className).toBe("render working")
    expect(all(story, ".render-words > span[data-on]").map(text)).toEqual(["Rendering MP4"])
    cross(DOES.length - 1, false)
    expect(lines(story)).toEqual(["done", "working", "ahead", "ahead"])
    cross(STEPS - 1, true)
    expect(lines(story)).toEqual(DOES.map(() => "done"))
    expect(all(story, ".part").every((p) => p.classList.contains("on"))).toBe(true)
  })
})

// The command box: a copy is one gesture, the key and the command together.
describe("the install block", () => {
  it("picks a step, writes its command in pieces and copies it", async () => {
    const written: string[] = []
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: (t: string) => (written.push(t), Promise.resolve()) },
    })
    const w = render(() => <InstallBlock />)
    const steps = all(w.getByRole("group", { name: "Install steps" }), "button")
    expect(steps.map(text)).toEqual(["folder", "npm", "pnpm", "bun"])
    expect(steps.map((b) => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"])
    const typed = () => w.container.querySelector(".typed")!
    expect(typed().textContent).toBe("npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit")
    // A path may wrap after its slashes; no piece breaks.
    expect(typed().querySelectorAll("wbr").length).toBeGreaterThan(0)
    expect(text(w.container.querySelector(".prompt"))).toBe("$")

    const first = typed()
    fireEvent.click(steps[1])
    expect(steps.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false", "false"])
    expect(typed().textContent).toBe(`npm i ${RUNTIME_DEPS.join(" ")}`)
    // A new step is a new element, so it types in again.
    expect(typed()).not.toBe(first)

    const copy = w.getByRole("button", { name: "Copy command" })
    expect(copy.getAttribute("data-copied")).toBe("false")
    expect(all(copy, ".roll > span > span").map(text)).toEqual(["Copy", "Copied"])
    fireEvent.click(copy)
    await tick()
    expect(written).toEqual([`npm i ${RUNTIME_DEPS.join(" ")}`])
    expect(copy.getAttribute("data-copied")).toBe("true")
    expect(copy.getAttribute("aria-label")).toBe("Copied")
    expect(text(w.container.querySelector('[role="status"]'))).toBe("Copied to clipboard")
  })
})

describe("the hero", () => {
  it("states the kit, its keys and what it works with, the film a key away", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())
    const w = render(() => <Showcase />)
    const hero = w.container.querySelector("section.hero")!
    expect(hero.getAttribute("aria-labelledby")).toBe("hero-h")
    expect(hero.querySelector("h1#hero-h")!.textContent).toBe("A dithered UI toolkit for Solid.")
    expect(all(hero, "h1 .rise-word").every((s) => s.classList.contains("chrome-type"))).toBe(true)
    expect(text(hero.querySelector(".hero-lede"))).toMatch(
      new RegExp(`^${COMPONENT_COUNT} components, from charts .* one seeded \\S+ matrix\\. Copy the folder`),
    )
    const keys = all(hero, ".hero-keys > *")
    expect(keys.map(text)).toEqual(["Open the studio", "Read the docs", "Watch the film"])
    expect(keys.map((k) => k.getAttribute("href"))).toEqual(["/studio", "/docs", null])
    expect(keys[0].className).toBe("nav-a key-chrome primary")
    const works = hero.querySelector(".works ul")!
    expect(works.getAttribute("aria-labelledby")).toBe("works-l")
    expect(all(works, "li").map(text)).toEqual(WORKS.map((t) => t.name))
    expect(all(works, "li svg.tool-mark")).toHaveLength(WORKS.length)
    expect(hero.querySelector(".hero-brand.brand-gather")).not.toBeNull()
    expect(hero.querySelector(".print .print-floor .print-mirror")).not.toBeNull()
    expect(document.querySelector("video")).toBeNull()
    fireEvent.click(keys[2])
    await tick()
    expect(document.querySelector('[role="dialog"] video')).not.toBeNull()
  })
})

describe("what it works with", () => {
  it("lists the reader's styling, agent and models, each list named by its heading", () => {
    const w = render(() => <WorksWith />)
    const section = w.container.querySelector("section#works.sec")!
    expect(text(section.querySelector("#works-h"))).toBe("Plays well with others.")
    expect(section.querySelector(".more-link")!.getAttribute("href")).toBe("/docs/styling")
    const lists = all(section, ".works ul")
    expect(lists.map((l) => text(document.getElementById(l.getAttribute("aria-labelledby")!)))).toEqual([
      "Your styling",
      "Your agent",
      "Your models",
    ])
    expect(lists.map((l) => all(l, "li").map(text))).toEqual([
      WORKS.map((t) => t.name),
      HARNESSES.map((h) => h.name),
      MODEL_FORMATS.map((f) => MODEL_NAMES[f]),
    ])
    expect(all(lists[2], "svg")).toHaveLength(0)
    expect(lists[2].className).toBe("files")
    expect(all(section, ".works-more").map(text)).toEqual([
      "and any app on its compiled stylesheet: UnoCSS, plain CSS or CSS-in-JS",
      "or any command you hand the bridge",
      "and GLSL, pasted straight from Shadertoy",
    ])
  })
})

// The page whole.
describe("the landing", () => {
  const landing = () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve())
    return render(() => <LandingPage />)
  }

  it("is one page in the dark: a skip link, one main, its sections in order, a footer", async () => {
    const w = landing()
    await tick()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    const root = w.container.firstElementChild!
    expect(root.classList.contains("landing")).toBe(true)
    const skip = root.querySelector("a.skip-link")!
    expect([text(skip), skip.getAttribute("href")]).toEqual(["Skip to content", "#main"])
    expect(all(root, "a, button")[0]).toBe(skip)
    expect(all(root, "main")).toHaveLength(1)
    expect(root.querySelector("main")!.id).toBe("main")
    expect(all(root, "h1")).toHaveLength(1)
    expect(all(root, "main section[id]").map((s) => s.id)).toEqual([
      "examples",
      "build",
      "ask",
      "inside",
      "works",
      "install",
    ])
    for (const s of all(root, "main section[aria-labelledby]"))
      expect(root.querySelector(`#${s.getAttribute("aria-labelledby")}`), s.id).not.toBeNull()
    expect(all(root, ".section-title").map(text)).toEqual([
      "Every component, live.",
      "Built from the wire up.",
      "Your agent builds the screen.",
      "Three parts, one engine.",
      "Plays well with others.",
      "Copy one folder. Every pixel is yours.",
    ])
    expect(all(root, ".plate")).toHaveLength(2)
    // What's inside: three cards named in the pixel face, their titles read out.
    const parts = all(root, ".inside > li")
    expect(parts.map((li) => text(li.querySelector(".inside-h .sr-only")))).toEqual([
      "The kit",
      "The Studio",
      "The agent bridge",
    ])
    expect(parts.map((li) => li.querySelector(".more-link")!.getAttribute("href"))).toEqual([
      "/docs/getting-started",
      "/studio",
      "/agent/SKILL.md",
    ])
    // The families, biggest first, each the link to its first section.
    const biggest = [...DOCS_FAMILIES].sort((a, b) => b.count - a.count)
    expect(
      all(root, ".families-list .family-t").map((a) => [text(a.querySelector(".family-l")), a.getAttribute("href")]),
    ).toEqual(biggest.map((f) => [f.label, `/docs/${f.first}`]))
    expect(all(root, ".family-n").map(text)).toEqual(biggest.map((f) => `${f.count} sections`))
    // The close: the spec sheet's rows, the footer's tab.
    expect(
      all(root, ".sheet .sheet-row").map((r) => [text(r.querySelector("dt")), text(r.querySelector("dd"))]),
    ).toEqual(SPECS.map((s) => [s.label, s.value]))
    expect(root.querySelector("#install .close-tab")!.getAttribute("aria-hidden")).toBe("true")
    expect(root.textContent).not.toMatch(/svelte/i)
    // The footer: the brand home, three named columns, the copyright line.
    const foot = root.querySelector("footer.foot")!
    expect(text(foot.querySelector(".foot-name"))).toBe("dither-ui")
    expect(all(foot, "nav.foot-col").map((n) => [n.getAttribute("aria-label"), text(n.querySelector("h2"))])).toEqual([
      ["Get started", "Get started"],
      ["Docs", "Docs"],
      ["For agents", "For agents"],
    ])
    expect(all(foot, "nav.foot-col")[1].querySelectorAll("a")).toHaveLength(DOCS_FAMILIES.length)
    const gh = foot.querySelector(".foot-gh")!
    expect([gh.getAttribute("target"), gh.getAttribute("rel"), text(gh)]).toEqual([
      "_blank",
      "noreferrer",
      "GitHub (opens in a new tab)",
    ])
    const copy = all(foot, ".foot-copy > span").map(text)
    expect(copy[0]).toBe(`© ${new Date().getFullYear()} dither-ui.com`)
    expect(copy[1]).toMatch(/^v\d+\.\d+\.\d+/)
    expect(copy[2]).toBe("MIT license")
    expect(foot.querySelector(".foot-road .road-mark")).not.toBeNull()
    expect(foot.querySelector(".foot-mark")!.getAttribute("aria-hidden")).toBe("true")
    expect(foot.querySelector(".mark-box .line-wordmark")).not.toBeNull()
    expect(foot.querySelector(".road-car .road-car-art")).not.toBeNull()
  })

  it("gives every section lede exactly one key clause", () => {
    const w = landing()
    const ledes = all(w.container, "p.sec-lede")
    expect(ledes.length).toBeGreaterThanOrEqual(5)
    for (const l of ledes) expect(all(l, ".lede-key"), text(l).slice(0, 40)).toHaveLength(1)
  })

  it("stands every riser inside a rise, or the wait would hide it for good", () => {
    // Under reduced motion a rise stands its risers at once: one left
    // unrisen stands outside every rise.
    reduced = true
    const w = landing()
    const risers = all(w.container, "[data-rise]")
    expect(risers.length).toBeGreaterThan(30)
    expect(risers.filter((r) => !r.hasAttribute("data-risen")).map((r) => r.outerHTML.slice(0, 60))).toEqual([])
  })

  it("copies an agent prompt that names this origin's skill and the install", async () => {
    const written: string[] = []
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: (t: string) => (written.push(t), Promise.resolve()) },
    })
    const w = landing()
    const key = w.getByRole("button", { name: "Copy agent prompt" })
    fireEvent.click(key)
    await tick()
    expect(written).toHaveLength(1)
    expect(written[0]).toContain(`Read ${location.origin}/agent/SKILL.md and add dither-ui to this project:`)
    expect(written[0]).toContain("npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit")
    for (const dep of RUNTIME_DEPS) expect(written[0]).toContain(dep)
    expect(key.getAttribute("aria-label")).toBe("Agent prompt copied")
    expect(text(key)).toBe("Copied")
  })
})

// An address nothing lives at: the landing's print, never indexed.
describe("the missing page", () => {
  const robots = () => all(document.head, 'meta[name="robots"]').map((m) => (m as HTMLMetaElement).content)

  it("says why, offers the ways back and is noindex only while it stands", () => {
    reduced = true
    const w = render(() => (
      <MetaProvider>
        <MissingPage />
      </MetaProvider>
    ))
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(robots()).toEqual(["noindex"])
    const root = w.container.querySelector(".landing")!
    expect(root.querySelector("header")).not.toBeNull()
    const main = root.querySelector("main#main.lost")!
    expect(main.getAttribute("tabindex")).toBe("-1")
    expect(main.querySelector("h1.lost-h")!.textContent).toBe("This page did not print.")
    expect(text(main.querySelector(".sec-lede"))).toBe(
      "The link may be old, or the cell it pointed at was never there. Everything else is where you left it.",
    )
    expect(text(main.querySelector(".lede-key"))).toBe("Everything else is where you left it.")
    expect(all(main, ".lost-keys a").map((a) => [text(a), a.getAttribute("href"), a.className])).toEqual([
      ["Back to the start", "/", "nav-a key-chrome primary"],
      ["Read the docs", "/docs", "key"],
      ["Open the studio", "/studio", "key"],
    ])
    expect(main.querySelector("svg.lost-mascot")!.hasAttribute("data-rise")).toBe(true)
    expect(all(main, "[data-rise]").every((r) => r.hasAttribute("data-risen"))).toBe(true)
    w.unmount()
    expect(robots()).toEqual([])
  })
})
