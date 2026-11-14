// Behaviour no other spec here holds: the icon set mounted whole, a
// field's and a dialog's generated ids, the toast store by itself, and a
// surface that starts painting once its precompiled image is taken away,
// the thumbnail's look, the palette's empty state, container units in a
// reveal's offset, and the loops a cover holds.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library"
import { createSignal } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DitherAnimatedContent,
  DitherButton,
  DitherCommand,
  DitherDialog,
  DitherField,
  DitherGauge,
  DitherGradient,
  DitherHeatTrail,
  DitherImage,
  DitherInput,
  DitherKnob,
  DitherScreen,
  DitherSpinner,
  DitherEmoji,
  DitherCurrencyText,
  DitherIcon,
  DitherPressable,
  DitherThumbnail,
} from "../../src/solid"
import { coverPage, isCovered } from "../../src/engine/cover"
import { ICON_NAMES, ICONS } from "../../src/engine/icons"
import { matrixFromSeed, type VariantInput } from "../../src/engine/dither-paint"
import { BAYER4, pixelMatrixFromSeed, type ScreenKind, SCREENS, screenMatrix } from "../../src/engine/pixel"
import { createInviewLoop } from "../../src/solid/runtime/in-view"
import { dismiss, toast, toasts } from "../../src/solid/runtime/toast"
import { useDitherMatrix, useLabelMatrix, useVariantMatrix } from "../../src/solid/runtime/screen"
import { createCanvasVisibility } from "../../src/solid/runtime/visibility"
import { world } from "../support/world"

/** A kit file as written (the specs run from the package). */
const kitFile = (name: string) => readFileSync(join(process.cwd(), "src/solid", name), "utf8")

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  w.restore()
  coverPage(null)
  for (const t of [...toasts]) dismiss(t.id)
})

describe("Icon", () => {
  it("draws one path per glyph entry at the size asked for", () => {
    const { container } = render(() => <DitherIcon name="Close" size={24} />)
    const svg = container.querySelector("svg")!
    expect(svg.querySelectorAll("path").length).toBe(ICONS.Close.length)
    expect(svg.getAttribute("width")).toBe("24")
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24")
    expect(svg.getAttribute("stroke")).toBe("currentColor")
  })

  it("mounts every glyph in the set", () => {
    for (const name of ICON_NAMES) {
      const { container, unmount } = render(() => <DitherIcon name={name} />)
      expect(container.querySelectorAll("path").length, name).toBeGreaterThan(0)
      unmount()
    }
  })
})

describe("generated ids", () => {
  it("gives two fields on a page their own control ids", () => {
    const { container } = render(() => (
      <div>
        <DitherField label="One">
          <DitherInput />
        </DitherField>
        <DitherField label="Two">
          <DitherInput />
        </DitherField>
      </div>
    ))
    const ids = [...container.querySelectorAll("input")].map((input) => input.id)
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(2)
  })

  it("gives each open dialog its own title id", async () => {
    render(() => (
      <>
        <DitherDialog open title="First" />
        <DitherDialog open title="Second" />
      </>
    ))
    await Promise.resolve()
    const [one, two] = screen.getAllByRole("dialog")
    expect(one.getAttribute("aria-labelledby")).not.toBe(two.getAttribute("aria-labelledby"))
    expect(document.getElementById(two.getAttribute("aria-labelledby")!)?.textContent).toBe("Second")
  })
})

describe("the toast store", () => {
  it("takes a toast and lets go of it by its id", () => {
    toast("saved")
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe("saved")
    dismiss(toasts[0].id)
    expect(toasts).toHaveLength(0)
  })

  it("lets a toast go by itself after its duration", () => {
    vi.useFakeTimers()
    toast("bye", { duration: 1000 })
    expect(toasts).toHaveLength(1)
    vi.advanceTimersByTime(1100)
    expect(toasts).toHaveLength(0)
  })
})

describe("text that formats", () => {
  it("CurrencyText places the symbol by locale and honours the currency", () => {
    const { container } = render(() => (
      <>
        <DitherCurrencyText value={12.5} />
        <DitherCurrencyText value={12.5} currency="EUR" locale="de-DE" />
        <DitherCurrencyText value={49} currency="JPY" decimals={0} />
      </>
    ))
    const [usd, eur, jpy] = [...container.children].map((el) => el.textContent)
    expect(usd).toBe("$12.50")
    expect(eur).toContain("€")
    expect(jpy).toBe("¥49")
  })

  it("Emoji carries no name without a label", () => {
    const { container } = render(() => <DitherEmoji char="🔥" />)
    expect(container.firstElementChild!.hasAttribute("aria-label")).toBe(false)
  })
})

describe("Pressable", () => {
  it("looks like a button out of the box, its ring the theme's, and a caller's class wins", () => {
    const classes = (el: Element) => [...el.classList]
    const { container } = render(() => (
      <>
        <DitherPressable>Get started</DitherPressable>
        <DitherPressable variant="ghost">Ghost</DitherPressable>
        <DitherPressable variant="plain" class="underline">
          Plain
        </DitherPressable>
        <DitherPressable class="rounded-full">Round</DitherPressable>
      </>
    ))
    const [solid, ghost, plain, round] = [...container.children]
    expect(classes(solid)).toEqual(
      expect.arrayContaining(["bg-foreground", "text-background", "min-h-10", "rounded-md"]),
    )
    expect(classes(solid)).toContain("focus-visible:ring-ring")
    expect(classes(solid).some((c) => c.includes("active:scale"))).toBe(true)
    expect(classes(ghost)).toContain("hover:bg-muted")
    expect(classes(plain).sort()).toEqual(["active:scale-[0.97]", "transition-transform", "underline"])
    expect(classes(round)).not.toContain("rounded-md")
  })
})

describe("a surface whose precompiled image is taken away", () => {
  const IMAGE = "data:image/png;base64,AAAA"

  it("the button paints its fill", async () => {
    const [image, setImage] = createSignal<string | undefined>(IMAGE)
    const { container } = render(() => <DitherButton precompiled={image()}>Deploy</DitherButton>)
    expect(container.querySelector("img")).not.toBeNull()
    expect(container.querySelector("canvas")).toBeNull()
    setImage(undefined)
    await w.frame(16)
    w.size()
    await w.frame(32)
    await w.frame(48)
    const canvas = container.querySelector("canvas")!
    expect(container.querySelector("img")).toBeNull()
    expect(w.uploads).toContain(canvas)
  })

  it("the gradient paints its wash", async () => {
    const [image, setImage] = createSignal<string | undefined>(IMAGE)
    const { container } = render(() => <DitherGradient precompiled={image()} />)
    expect(container.querySelector("canvas")).toBeNull()
    setImage(undefined)
    await new Promise((done) => setTimeout(done, 5))
    expect(w.uploads).toContain(container.querySelector("canvas")!)
  })

  it("the image mounts its canvas and watches its box", async () => {
    const [image, setImage] = createSignal<string | undefined>(IMAGE)
    const observed: Element[] = []
    const Real = globalThis.ResizeObserver
    vi.stubGlobal(
      "ResizeObserver",
      class extends Real {
        observe(el: Element) {
          observed.push(el)
          super.observe(el)
        }
      },
    )
    const { container } = render(() => <DitherImage src="/sprites.webp" precompiled={image()} />)
    expect(container.querySelector("canvas")).toBeNull()
    const before = observed.length
    setImage(undefined)
    await w.frame(16)
    expect(container.querySelector("canvas")).not.toBeNull()
    expect(observed.length).toBeGreaterThan(before)
  })

  it("the spinner paints its ring", async () => {
    const [image, setImage] = createSignal<string | undefined>(IMAGE)
    const { container } = render(() => <DitherSpinner precompiled={image()} />)
    expect(container.querySelector("canvas")).toBeNull()
    setImage(undefined)
    await w.frame(16)
    w.show()
    await w.frame(32)
    await w.frame(48)
    expect(w.uploads).toContain(container.querySelector("canvas")!)
  })
})

describe("DitherThumbnail", () => {
  // A parent link trigger, a masked frame (radius, hairline, clipped), a
  // recessed cover image that wakes on the link's hover (in its stylesheet:
  // a descendant of the hover, which no element's own classes can say), and
  // the Bayer veil that dissolves.
  const sheet = kitFile("Thumbnail.css")
  const hover = sheet.slice(sheet.indexOf("@media (hover: hover)"))
  const thumb = (veilCell?: number) => {
    const { container } = render(() => (
      <DitherThumbnail src="/x.png" alt="A dithered sunrise" href="/docs/sunrise" veilCell={veilCell} />
    ))
    const link = container.firstElementChild as HTMLAnchorElement
    return { link, img: link.querySelector("img")!, veil: link.querySelector<HTMLElement>(".dither-veil")! }
  }

  it("is a link whose name is the image's alt, the image lazy and async", () => {
    const { link, img } = thumb()
    expect(link.tagName).toBe("A")
    expect(link.getAttribute("aria-label")).toBe("A dithered sunrise")
    expect(img.getAttribute("alt")).toBe("A dithered sunrise")
    expect(img.getAttribute("decoding")).toBe("async")
  })

  it("recesses the image at 70% and wakes it on the parent hover", () => {
    const { link, img } = thumb()
    expect([...img.classList]).toContain("opacity-70")
    expect([...link.classList]).toContain("dk-thumb")
    expect([...img.classList]).toContain("dk-thumb-img")
    expect(hover).toMatch(/\.dk-thumb:hover \.dk-thumb-img \{\s*scale: 1\.04;\s*opacity: 1;/)
  })

  it("rides the house curve inside the 0.25-0.4s window, its transition named", () => {
    const classes = [...thumb().img.classList]
    expect(classes).toContain("duration-300")
    expect(classes).toContain("ease-[cubic-bezier(0.16,1,0.3,1)]")
    // Only what changes: opacity and scale, never `all` (spelled apart, so
    // Tailwind's scan of this folder writes no rule for it).
    expect(classes).toContain("transition-[opacity,scale]")
    expect(classes).not.toContain(["transition", "all"].join("-"))
  })

  it("frames and clips: radius, hairline border, overflow hidden, zoom cursor", () => {
    const { link } = thumb()
    expect([...link.classList]).toEqual(expect.arrayContaining(["overflow-hidden", "cursor-zoom-in", "rounded-md"]))
    const frame = link.querySelector(":scope > span")!
    expect([...frame.classList]).toEqual(expect.arrayContaining(["border", "overflow-hidden", "rounded-[inherit]"]))
  })

  it("carries the dither veil at the house lattice size", () => {
    const { veil } = thumb(6)
    expect(veil.style.backgroundSize).toBe(`${6 * BAYER4.length}px ${6 * BAYER4.length}px`)
    expect(hover).toMatch(/\.dk-thumb:hover \.dither-veil \{\s*opacity: 0;/)
  })

  it("drops all motion under reduced motion", () => {
    const { img, veil } = thumb()
    for (const el of [img, veil]) expect([...el.classList]).toContain("motion-reduce:transition-none")
  })
})

describe("the command palette's empty state", () => {
  const items = [{ value: "button", label: "Button" }]
  async function typed(empty: Parameters<typeof DitherCommand>[0]["empty"]) {
    render(() => <DitherCommand open items={items} empty={empty} />)
    await Promise.resolve()
    fireEvent.input(document.body.querySelector("input")!, { target: { value: "  zz  " } })
  }

  it("shows the empty line when nothing matches", async () => {
    await typed("None.")
    expect(document.body.textContent).toContain("None.")
  })

  it("draws what it is handed instead, given the trimmed query", async () => {
    await typed((scope) => <>No “{scope.query}” here.</>)
    expect(document.body.textContent).toContain("No “zz” here.")
    expect(document.body.textContent).not.toContain("None.")
  })
})

describe("container units in transforms", () => {
  // An observer that never fires: a reveal keeps its hidden transform, so
  // the offset stays there to read.
  const offset = (props: Parameters<typeof DitherAnimatedContent>[0]) => {
    const { container } = render(() => <DitherAnimatedContent {...props} />)
    return (container.firstElementChild as HTMLElement).style.transform
  }

  it("AnimatedContent: numbers stay px, direction picks the axis", () => {
    expect(offset({ distance: 40 })).toBe("translateY(40px)")
    expect(offset({ distance: 40, reverse: true })).toBe("translateY(-40px)")
    expect(offset({ distance: 40, direction: "horizontal" })).toBe("translateX(40px)")
  })

  it("AnimatedContent: CSS length strings pass through with sign handling", () => {
    expect(offset({ distance: "4cqw" })).toBe("translateY(4cqw)")
    expect(offset({ distance: "6cqh", direction: "horizontal" })).toBe("translateX(6cqh)")
    expect(offset({ distance: "6cqh", reverse: true })).toBe("translateY(-6cqh)")
    expect(offset({ distance: "-4cqw", reverse: true })).toBe("translateY(4cqw)")
    expect(offset({ distance: "1em" })).toBe("translateY(1em)")
  })

  it("DitherContainer ships container-relative keyframes with no viewport units", () => {
    const sheet = kitFile("DitherContainer.css")
    const start = sheet.indexOf("@keyframes dither-cq-traverse")
    expect(start).toBeGreaterThan(-1)
    const keyframes = sheet.slice(start)
    for (const move of ["translateX(-100cqw)", "translateX(100cqw)", "translateY(-100cqh)", "translateY(100cqh)"])
      expect(keyframes).toContain(move)
    expect(keyframes).not.toMatch(/translate[XY]\(-?[\d.]+v[wh]\)/)
  })
})

describe("the cover", () => {
  // One moving layer at a time: while a full-screen sheet covers the page,
  // the kit's loops under it hold their frame and wake as it lifts; a loop
  // inside the sheet runs on.
  /** A component running a loop through the kit's in-view runtime, logging
   * its starts and stops, and reporting its canvas's visibility. */
  const Loop = (p: { log: string[]; visible: (read: () => boolean) => void }) => {
    let el: HTMLDivElement | undefined
    createInviewLoop(
      () => el,
      () => p.log.push("start"),
      () => p.log.push("stop"),
    )
    p.visible(
      createCanvasVisibility(
        () => el,
        () => p.log.push("wake"),
      ),
    )
    return <div ref={(node) => (el = node)} />
  }

  it("holds the loops under a sheet and wakes them as it lifts", () => {
    vi.stubGlobal("IntersectionObserver", undefined) // the in-view path at once
    const page = document.createElement("main")
    const sheet = document.createElement("dialog")
    document.body.append(page, sheet)
    const log: string[] = []
    let visible = () => false
    const { container } = render(() => <Loop log={log} visible={(read) => (visible = read)} />, { container: page })
    const under = container.firstElementChild!
    expect(log).toEqual(["start"])
    expect(visible()).toBe(true)

    coverPage(sheet)
    expect(isCovered(under)).toBe(true)
    expect(log.at(-1)).toBe("stop")
    expect(visible()).toBe(false)

    coverPage(null)
    expect(isCovered(under)).toBe(false)
    expect(log.slice(-2).sort()).toEqual(["start", "wake"])
    expect(visible()).toBe(true)
    cleanup()
    page.remove()
    sheet.remove()
  })

  it("lets a loop inside the sheet run on", () => {
    vi.stubGlobal("IntersectionObserver", undefined)
    const sheet = document.createElement("dialog")
    document.body.append(sheet)
    const log: string[] = []
    const { container } = render(() => <Loop log={log} visible={() => {}} />, { container: sheet })
    coverPage(sheet)
    expect(isCovered(container.firstElementChild!)).toBe(false)
    expect(log).toEqual(["start", "start"])
    cleanup()
    sheet.remove()
  })
})

describe("DitherScreen, read through the kit's own hooks", () => {
  type ProbeApi = { matrix: number[][]; label: number[][]; ofVariant: (v: VariantInput) => number[][] }
  const probe = (screen?: ScreenKind, seed?: number): ProbeApi => {
    let seen: ProbeApi | undefined
    const Probe = () => {
      const matrix = useDitherMatrix(() => seed)
      const label = useLabelMatrix(() => seed)
      const ofVariant = useVariantMatrix()
      seen = {
        get matrix() {
          return matrix()
        },
        get label() {
          return label()
        },
        ofVariant,
      }
      return <i />
    }
    render(() =>
      screen ? (
        <DitherScreen screen={screen}>
          <Probe />
        </DitherScreen>
      ) : (
        <Probe />
      ),
    )
    return seen!
  }

  it("prints everything below it through its screen", () => {
    expect(probe().matrix).toBe(BAYER4)
    expect(probe("line").matrix).toBe(SCREENS.line)
    expect(probe("dot", 5).matrix).toEqual(screenMatrix("dot", 5))
    // Chart series: a numeric variant seeds the screen; a named one takes it plain.
    expect(probe("cross").ofVariant(9)).toEqual(screenMatrix("cross", 9))
    expect(probe("cross").ofVariant("gradient")).toBe(SCREENS.cross)
    expect(probe().ofVariant(9)).toEqual(matrixFromSeed(9))
  })

  it("leaves a fill that carries a label on the Bayer matrix", () => {
    expect(probe("diagonal").label).toBe(BAYER4)
    expect(probe("dot", 5).label).toEqual(pixelMatrixFromSeed(5))
  })
})

describe("the gauge's numerals and the knob's name", () => {
  it("names every other major past six intervals, the ends always", () => {
    const names = (ticks: number) => {
      const { container } = render(() => <DitherGauge value={0} ticks={ticks} />)
      return [...container.querySelectorAll("text")].map((t) => t.textContent).slice(0, -1) // the reading
    }
    expect(names(10)).toEqual(["0", "20", "40", "60", "80", "100"])
    expect(names(4)).toEqual(["0", "25", "50", "75", "100"])
  })

  it("a knob is named by its label, not one word for every knob", () => {
    render(() => (
      <>
        <DitherKnob label="Load" />
        <DitherKnob />
      </>
    ))
    expect(screen.getAllByRole("slider").map((s) => s.getAttribute("aria-label"))).toEqual(["Load", "Knob"])
  })
})

describe("mounting reads no layout", () => {
  it("the pointer trail takes its scroll baseline from the first scroll, not at mount", async () => {
    let reads = 0
    const real = Object.getOwnPropertyDescriptor(window, "scrollY")
    Object.defineProperty(window, "scrollY", { configurable: true, get: () => (reads++, 0) })
    render(() => <DitherHeatTrail pinned />)
    await Promise.resolve()
    expect(reads).toBe(0)
    cleanup()
    if (real) Object.defineProperty(window, "scrollY", real)
    else delete (window as { scrollY?: number }).scrollY
  })
})
