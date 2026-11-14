// The docs' forms, primitives, typography and text families, the Quick
// start and the handbook's Engine and Verification sections: each
// family's sections in its nav's order under their headings, each preview
// holding its demo once it nears the viewport, and what the demos and the
// sections do under a hand.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { FORMS_NAV } from "@/pages/docs/forms/forms-nav"
import { SECTIONS } from "@/pages/docs/groups"
import { CHECKS } from "@/pages/docs/handbook/lab"
import { INSTALL_STEPS } from "@/pages/docs/install"
import { PRIMITIVES_NAV } from "@/pages/docs/primitives/primitives-nav"
import { TEXT_NAV } from "@/pages/docs/text/text-nav"
import { TYPOGRAPHY_NAV } from "@/pages/docs/typography/typography-nav"
import FormsDocs from "../../src/pages/docs/forms/FormsDocs"
import EngineSection from "../../src/pages/docs/handbook/EngineSection"
import VerificationSection from "../../src/pages/docs/handbook/VerificationSection"
import QuickStart from "../../src/pages/docs/overview/QuickStart"
import PrimitivesDocs from "../../src/pages/docs/primitives/PrimitivesDocs"
import TextDocs from "../../src/pages/docs/text/TextDocs"
import TypographyDocs from "../../src/pages/docs/typography/TypographyDocs"
import { world } from "@dither-ui/kit/testing/world.ts"

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
  // the world's canvas, with the text calls the ASCII demo rasterizes through
  const context = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: unknown[]) {
    return Object.assign((context as (...a: unknown[]) => object).apply(this, args), {
      measureText: (text: string) => ({ width: text.length * 8 }),
      fillText() {},
      fillRect() {},
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }),
    })
  } as unknown as typeof HTMLCanvasElement.prototype.getContext
})
afterEach(() => {
  cleanup()
  w.restore()
  vi.useRealTimers()
  localStorage.clear()
})

const settle = async () => {
  for (let i = 0; i < 6; i++) {
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
  }
}

/** A family mounted, and once more with every preview in view. */
async function family(Docs: () => JSX.Element) {
  const view = render(() => <Docs />)
  const page = view.container
  const sections = () => [...page.querySelectorAll<HTMLElement>("section[id]")]
  const wells = () => [...page.querySelectorAll<HTMLElement>("[data-demo-card] .demo-well > div")]
  const waiting = () => wells().filter((well) => well.querySelector(":scope > [aria-hidden='true'].animate-pulse"))
  return {
    page,
    sections,
    wells,
    waiting,
    section: (id: string) => page.querySelector<HTMLElement>(`section#${id}`)!,
    async show() {
      w.show()
      await settle()
    },
  }
}

const FAMILIES = [
  { name: "forms", Docs: FormsDocs, nav: FORMS_NAV },
  { name: "primitives", Docs: PrimitivesDocs, nav: PRIMITIVES_NAV },
  { name: "typography", Docs: TypographyDocs, nav: TYPOGRAPHY_NAV },
  { name: "text", Docs: TextDocs, nav: TEXT_NAV },
] as const

describe.each(FAMILIES)("the $name family", ({ Docs, nav }) => {
  it("writes its nav's sections in order, each under one heading and a lede", async () => {
    const docs = await family(Docs)
    expect(docs.sections().map((s) => s.id)).toEqual(nav.map((n) => n.id))
    for (const section of docs.sections()) {
      expect(section.className).toContain("mt-16 scroll-mt-24")
      const headings = section.querySelectorAll("h2")
      expect(headings.length, section.id).toBe(1)
      expect(headings[0].textContent!.trim(), section.id).not.toBe("")
      expect(headings[0].className).toBe("text-lg tracking-tight")
      const lede = section.querySelector(":scope > p")
      expect(lede?.textContent?.trim(), section.id).toBeTruthy()
      // a lede's words keep their spaces around the code they name
      expect(lede!.textContent, section.id).not.toMatch(/[a-z]{2}(?:The|A|An) [a-z]/)
    }
  })

  it("gives every section one preview, which holds its demo once in view", async () => {
    const docs = await family(Docs)
    for (const section of docs.sections())
      expect(section.querySelectorAll("[data-demo-card]").length, section.id).toBe(1)
    expect(docs.wells().length).toBe(nav.length)
    // out of view a preview waits on its quiet frame
    expect(docs.waiting().length).toBe(nav.length)
    await docs.show()
    expect(docs.waiting().length).toBe(0)
    for (const well of docs.wells()) {
      expect(well.childElementCount, well.closest("section")!.id).toBeGreaterThan(0)
      expect(well.querySelectorAll(":scope > *").length, well.closest("section")!.id).toBe(1)
    }
  })
})

describe("the forms demos", () => {
  it("answer a click: each checkbox card is its own toggle", async () => {
    const docs = await family(FormsDocs)
    await docs.show()
    const boxes = () => [...docs.section("checkbox-card").querySelectorAll<HTMLElement>('[role="checkbox"]')]
    expect(boxes().map((b) => b.getAttribute("aria-checked") === "true")).toEqual([true, false])
    fireEvent.click(boxes()[1])
    expect(boxes().map((b) => b.getAttribute("aria-checked") === "true")).toEqual([true, true])
    fireEvent.click(boxes()[0])
    expect(boxes().map((b) => b.getAttribute("aria-checked") === "true")).toEqual([false, true])
  })

  it("set the input group's addons around its control", async () => {
    const docs = await family(FormsDocs)
    await docs.show()
    const group = docs.section("input-group").querySelector(".demo-well input")!.parentElement!
    expect(group.firstElementChild!.textContent).toBe("https://")
    expect(group.lastElementChild!.textContent).toBe("/docs")
    expect(group.querySelector("input")!.getAttribute("aria-label")).toBe("Site address")
    // no props table: slots and the focus ring are the API
    expect(docs.section("input-group").querySelector("table")).toBeNull()
    expect(docs.section("password-input").querySelector("table")).not.toBeNull()
  })
})

describe("the primitives demos", () => {
  it("open and close the click-outside menu, and close it on a press outside", async () => {
    const docs = await family(PrimitivesDocs)
    await docs.show()
    const section = docs.section("click-outside")
    const button = section.querySelector<HTMLElement>(".demo-well button")!
    expect(button.textContent!.trim()).toBe("open the menu")
    fireEvent.click(button)
    expect(button.textContent!.trim()).toBe("menu open: click anywhere outside")
    expect(section.textContent).toContain("Pressing outside closes this.")
    fireEvent.pointerDown(document.body, { button: 0 })
    expect(button.textContent!.trim()).toBe("open the menu")
    expect(section.textContent).not.toContain("Pressing outside closes this.")
  })

  it("open the focus scope and hand its trigger the word for closing it", async () => {
    const docs = await family(PrimitivesDocs)
    await docs.show()
    const section = docs.section("focus-scope")
    const button = section.querySelector<HTMLElement>(".demo-well button")!
    expect(section.querySelector(".demo-well h3")).toBeNull()
    fireEvent.click(button)
    expect(button.textContent!.trim()).toBe("close (focus returns to me)")
    expect(section.querySelector(".demo-well h3")!.textContent!.trim()).toBe("Scope active")
    fireEvent.click(button)
    expect(section.querySelector(".demo-well h3")).toBeNull()
  })

  it("draw scoped state: the clipboard's trigger, the hover area, the measure's readout", async () => {
    // a box that reports its content's size when the spec says so
    const sizes: (() => void)[] = []
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private callback: ResizeObserverCallback) {}
        observe() {
          sizes.push(() =>
            this.callback([{ contentRect: { width: 192, height: 80 } } as ResizeObserverEntry], this as never),
          )
        }
        disconnect() {}
      },
    )
    const docs = await family(PrimitivesDocs)
    await docs.show()
    expect(docs.section("clipboard").querySelector(".demo-well button")!.textContent!.trim()).toBe(
      "copy install command",
    )
    const area = docs.section("hover-area").querySelector<HTMLElement>(".demo-well .rounded-md")!
    expect(area.textContent!.trim()).toBe("hover or tab onto this")
    expect(area.className).toContain("border-border/60 text-muted-foreground")
    expect(docs.section("measure").querySelector(".demo-well .tabular-nums")!.textContent).toBe("not measured yet")
    sizes.forEach((report) => report())
    expect(docs.section("measure").querySelector(".demo-well .tabular-nums")!.textContent).toBe("192 × 80")
  })

  it("lay out every glyph of the icon set under its name", async () => {
    const { ICON_NAMES } = await import("@dither-ui/kit")
    const docs = await family(PrimitivesDocs)
    await docs.show()
    const section = docs.section("icon")
    expect(section.querySelector(".tabular-nums")!.textContent).toBe(`${ICON_NAMES.length} glyphs`)
    const tiles = [...section.querySelectorAll(".demo-well .grid-cols-4 > div")]
    expect(tiles.map((t) => t.textContent!.trim())).toEqual([...ICON_NAMES])
  })
})

describe("the typography demos", () => {
  it("pick the plural's slot by its count and hand it the count", async () => {
    const docs = await family(TypographyDocs)
    await docs.show()
    const lines = [...docs.section("plural-text").querySelectorAll(".demo-well .grid > span")]
    expect(lines.map((l) => l.textContent!.replace(/\s+/g, " ").trim())).toEqual(["1 result found", "7 results found"])
  })
})

describe("the text demos", () => {
  it("replay on demand, and roll the number flow on its timer until the page leaves", async () => {
    vi.useFakeTimers()
    const view = render(() => <TextDocs />)
    w.show()
    await vi.advanceTimersByTimeAsync(0)
    const section = (id: string) => view.container.querySelector<HTMLElement>(`section#${id}`)!
    for (const id of ["split-text", "shuffle", "falling-text"]) {
      const button = section(id).querySelector<HTMLElement>(".demo-well button")!
      expect(button.textContent!.trim(), id).toBe("Replay")
      expect(button.getAttribute("type")).toBe("button")
      fireEvent.click(button)
    }
    const random = vi.spyOn(Math, "random").mockReturnValue(1)
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(2400)
    expect(random).toHaveBeenCalled()
    random.mockRestore()
    view.unmount()
    const left = vi.spyOn(Math, "random")
    await vi.advanceTimersByTimeAsync(4800)
    expect(left).not.toHaveBeenCalled()
    left.mockRestore()
  })
})

describe("the Quick start", () => {
  const stepsOf = (page: HTMLElement) =>
    [...page.querySelectorAll("ol[aria-label='Install steps'] > li.qs-step")].map((li) => ({
      n: li.querySelector(".qs-n")!.textContent!.trim(),
      title: li.querySelector("p")!.textContent,
      why: li.querySelectorAll("p")[1]?.textContent,
      code: li.querySelector(".qs-code pre")!.textContent,
    }))

  it("shows the kit's steps one at a time, numbered, each with its code", () => {
    const { container } = render(() => <QuickStart />)
    const section = container.querySelector("section#getting-started")!
    expect(section.querySelector("h2")!.textContent).toBe("Quick start")
    expect(stepsOf(container)).toEqual(
      INSTALL_STEPS.map((s, i) => ({ n: String(i + 1), title: s.title, why: s.why, code: s.code })),
    )
    const lede = section.querySelector("p")!.textContent!.replace(/\s+/g, " ").trim()
    expect(lede).toBe(
      "The kit is a folder, not a package. Copy dither-kit/ from the GitHub repo (opens in a new tab), install four small runtime deps and alias it. You already have Solid, and Tailwind if you use it.",
    )
    expect([...section.querySelectorAll("h3")].map((h) => h.textContent)).toEqual(["Without Tailwind"])
    expect(section.querySelector<HTMLAnchorElement>("p:last-of-type a")!.href).toBe(
      "https://github.com/drvova/dither-ui/tree/master/dither-kit",
    )
  })

  it("shows them to a reader who once stored Svelte as their framework", () => {
    localStorage.setItem("dither-docs-framework", "svelte")
    const { container } = render(() => <QuickStart />)
    expect(stepsOf(container).map((s) => s.code)).toEqual(INSTALL_STEPS.map((s) => s.code))
    expect(container.textContent).not.toMatch(/svelte/i)
  })
})

describe("the Engine section", () => {
  it("names each part once, with a figure and a link to a real section", () => {
    // its own section, as the Handbook pack mounts it once opened
    const { container } = render(() => <EngineSection />)
    const section = container.querySelector("section#engine")!
    expect(section.querySelector("h2")!.textContent).toBe("Engine")
    const rows = [...section.querySelectorAll("dl > div")]
    expect(rows.map((r) => r.querySelector("dt")!.textContent)).toEqual([
      "Matrix",
      "Screens",
      "Seeds",
      "Palette",
      "Clock",
      "Wipe",
      "World",
      "Shader",
    ])
    for (const row of rows) {
      const link = row.querySelector("a")!
      const at = SECTIONS.find((s) => `#${s.id}` === link.getAttribute("href"))
      expect(at, link.getAttribute("href")!).toBeTruthy()
      expect(link.textContent).toBe(at!.label)
      // the line, a space, then its link
      expect(row.querySelector("dd")!.textContent!.trim().endsWith(`. ${at!.label}`)).toBe(true)
      expect(row.querySelectorAll("dd")[1].textContent!.trim()).toMatch(/^\d+ /)
    }
    expect(rows[0].querySelectorAll("dd")[1].textContent!.trim()).toBe("16 ranks, 17 tones")
  })
})

describe("the Verification section", () => {
  const mount = () => {
    const { container, unmount } = render(() => <VerificationSection />)
    const section = container.querySelector("section#verification")!
    const status = () => section.querySelector("p[aria-live]")!.textContent!.replace(/\s+/g, " ").trim()
    const keys = () => [...section.querySelectorAll<HTMLButtonElement>("button")]
    const readings = () =>
      [...section.querySelectorAll("dl > div")].map((row) =>
        row.querySelectorAll("dd")[1].textContent!.replace(/\s+/g, " ").trim(),
      )
    const done = async () => {
      for (let i = 0; i < CHECKS.length + 4; i++) await settle()
    }
    return { section, status, keys, readings, done, unmount }
  }

  it("ships unmeasured, each claim beside its method, its test and what it is held against", () => {
    const { section, status, keys, readings } = mount()
    expect(section.querySelector("h2")!.textContent).toBe("Verification")
    expect(status()).toBe("Measured in your browser when this section comes into view.")
    expect(readings()).toEqual(CHECKS.map(() => "not yet measured"))
    const rows = [...section.querySelectorAll("dl > div")]
    rows.forEach((row, i) => {
      const check = CHECKS[i]
      expect(row.querySelector("dt")!.textContent).toBe(check.claim)
      const link = row.querySelector("a")!
      expect(link.getAttribute("href")).toMatch(new RegExp(`/blob/master/${check.test}$`))
      expect(link.getAttribute("target")).toBe("_blank")
      expect(link.textContent).toBe(`Its test: ${check.claim} (opens in a new tab)`)
      expect(row.querySelector("dd")!.textContent!.replace(/\s+/g, " ").trim()).toBe(
        `${check.method} ${link.textContent}`.replace(/\s+/g, " "),
      )
      expect(row.querySelectorAll("dd")[2].textContent!.trim()).toBe(`against ${check.against}`)
    })
    expect(keys().map((k) => k.textContent!.trim())).toEqual(["Measure again", "Copy the results"])
    expect(keys()[1].disabled).toBe(true)
  })

  it("measures as it comes into view, one check per task, and reports what holds", async () => {
    const { status, keys, readings, done } = mount()
    w.show()
    expect(status()).toMatch(/^Measuring in .+ on .+\.$/)
    expect(readings()).toEqual(CHECKS.map(() => "measuring"))
    expect(keys()[1].disabled).toBe(true)
    await done()
    expect(status()).toMatch(new RegExp(`^Measured in .+: \\d+ of ${CHECKS.length} claims hold\\.$`))
    for (const reading of readings()) expect(reading).toMatch(/, (holds|fails)$/)
    const held = readings().filter((r) => r.endsWith(", holds")).length
    expect(status()).toContain(`: ${held} of ${CHECKS.length} claims hold.`)
    expect(keys()[1].disabled).toBe(false)
  })

  it("copies the results as a Markdown table and says so, then rests", async () => {
    const writeText = vi.fn(async (_text: string) => {})
    vi.stubGlobal("navigator", { userAgent: navigator.userAgent, clipboard: { writeText } })
    const { section, keys, done } = mount()
    w.show()
    await done()
    vi.useFakeTimers()
    fireEvent.click(keys()[1])
    await vi.advanceTimersByTimeAsync(0)
    expect(writeText).toHaveBeenCalledTimes(1)
    const lines = writeText.mock.calls[0][0].split("\n")
    expect(lines[0]).toMatch(/^dither-ui verification, measured in .+ on .+$/)
    expect(lines.slice(1, 4)).toEqual(["", "| Claim | Against | Reading | Result |", "| --- | --- | --- | --- |"])
    expect(lines.length).toBe(4 + CHECKS.length)
    CHECKS.forEach((c, i) => expect(lines[4 + i].startsWith(`| ${c.claim} | ${c.against} | `)).toBe(true))
    expect(keys()[1].textContent!.trim()).toBe("Copied")
    expect(section.querySelector("span[aria-live]")!.textContent).toBe("Results copied")
    await vi.advanceTimersByTimeAsync(1500)
    expect(keys()[1].textContent!.trim()).toBe("Copy the results")
    expect(section.querySelector("span[aria-live]")!.textContent).toBe("")
  })

  it("measures again on demand, and a run stops when the page leaves", async () => {
    const { status, keys, readings, done, unmount } = mount()
    w.show()
    await done()
    fireEvent.click(keys()[0])
    expect(status()).toMatch(/^Measuring in /)
    expect(readings()).toEqual(CHECKS.map(() => "measuring"))
    unmount()
    await done()
  })
})
