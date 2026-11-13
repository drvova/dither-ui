// The docs' Backgrounds pack and the Utils family's Print screens section on
// Solid: every section in the nav's order under its own heading, each
// preview mounting its demo once it nears the view, the pickers driving the
// live surface, and the authored snippets held to the Vue file's,
// character for character, its tables in the Vue file's shape (their words:
// `docs-api.spec.ts`). The Vue site has no spec of these files beyond
// the pack's nav (`tests/docs-packs.spec.ts`), carried here as the id order.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { BACKGROUNDS_NAV } from "@/pages/docs/backgrounds/backgrounds-nav"
import { SCREEN_KINDS } from "@dither-kit"
import BackgroundsDocs from "../../src/pages/docs/backgrounds/BackgroundsDocs"
import PosterSection from "../../src/pages/docs/backgrounds/PosterSection"
import ScreensSection from "../../src/pages/docs/utils/ScreensSection"
import { world } from "../world"
import { sansRows, stringsIn } from "./docs-api"

// The specs run from `solid-site/`: a path is from the repository's root.
const read = (path: string) => readFileSync(join(process.cwd(), "..", path), "utf8")

let w: ReturnType<typeof world>
beforeEach(() => {
  w = world()
})
afterEach(() => {
  cleanup()
  w.restore()
})

const cards = (root: Element) => [...root.querySelectorAll("[data-demo-card]")]
const pressed = (group: Element) =>
  [...group.querySelectorAll("button[aria-pressed='true']")]
    // the demo's own keys, never the card's (Inspect)
    .filter((b) => b.closest(".demo-well"))
    .map((b) => b.textContent?.trim())

describe("BackgroundsDocs", () => {
  it("writes every section of the nav, in order, under its label", () => {
    const { container } = render(() => <BackgroundsDocs />)
    const sections = [...container.querySelectorAll("section[id]")]
    expect(sections.map((s) => s.id)).toEqual(BACKGROUNDS_NAV.map((n) => n.id))
    expect(sections.map((s) => s.querySelector("h2")?.textContent)).toEqual(BACKGROUNDS_NAV.map((n) => n.label))
    for (const s of sections) {
      expect(s.className).toBe("mt-16 scroll-mt-24")
      expect(s.querySelector("h2 + p")?.textContent?.trim()).toBeTruthy()
      expect(cards(s)).toHaveLength(1)
      // the API table follows the card
      expect(s.querySelector("[data-demo-card] ~ * table, [data-demo-card] ~ table")).not.toBeNull()
    }
  })

  it("keeps a word's space before and after inline code", () => {
    const { container } = render(() => <BackgroundsDocs />)
    expect(container.querySelector("#side-rays p")?.textContent).toContain("streaks. Flip side to left or right.")
    expect(container.querySelector("#faulty-terminal p")?.textContent).toContain("so dither is just an intensity")
  })

  it("mounts each preview's demo once, when it comes into view", () => {
    const { container } = render(() => <BackgroundsDocs />)
    expect(container.querySelectorAll("canvas")).toHaveLength(0)
    w.show()
    for (const section of container.querySelectorAll("section[id]")) {
      const [card] = cards(section)
      // one frame holding the surface, and one surface in it
      const frames = card.querySelectorAll(".demo-well div.rounded-md.relative.overflow-hidden")
      expect(frames, section.id).toHaveLength(1)
      expect(frames[0].querySelectorAll("canvas").length, section.id).toBe(1)
    }
  })

  it("bleeds every demo but the square ones, which opt back in to the inset", () => {
    const { container } = render(() => <BackgroundsDocs />)
    w.show()
    const inset = ["radar-sweep", "orb", "galaxy", "prismatic-burst", "poster"]
    for (const s of container.querySelectorAll("section[id]")) {
      const well = s.querySelector("[data-demo-card] .demo-well")!
      expect(well.classList.contains("bleed"), s.id).toBe(!inset.includes(s.id))
    }
  })

  it("drives the pickers: one pressed chip a group, the circuit's seed rolled by its key", () => {
    const { container } = render(() => <BackgroundsDocs />)
    w.show()
    const chips = (id: string) => [...container.querySelectorAll(`#${id} button[aria-pressed]`)] as HTMLButtonElement[]
    const pick = (id: string, name: string) => fireEvent.click(chips(id).find((b) => b.textContent?.trim() === name)!)

    const aurora = container.querySelector("#aurora")!
    expect(pressed(aurora)).toEqual(["polar"])
    pick("aurora", "sunset")
    expect(pressed(aurora)).toEqual(["sunset"])
    expect(chips("aurora").find((b) => b.textContent?.trim() === "sunset")!.className).toContain(
      "bg-card text-foreground",
    )

    const density = container.querySelector("#circuit [role='group'][aria-label='Density']")!
    expect(pressed(density)).toEqual(["even"])
    pick("circuit", "dense")
    expect(pressed(density)).toEqual(["dense"])
    const board = [...container.querySelectorAll("#circuit button")].find((b) => b.textContent?.trim() === "New board")
    expect(board).toBeTruthy()

    const cooling = container.querySelector("#heat-trail [role='group'][aria-label='Cooling']")!
    const size = container.querySelector("#heat-trail [role='group'][aria-label='Size']")!
    expect([pressed(cooling), pressed(size)]).toEqual([["even"], ["even"]])
    pick("heat-trail", "bold")
    expect([pressed(cooling), pressed(size)]).toEqual([["even"], ["bold"]])

    // the terminal: presets as chips, tints as labelled swatches
    const term = container.querySelector("#faulty-terminal")!
    const swatches = [...term.querySelectorAll("button[aria-label^='Tint ']")] as HTMLButtonElement[]
    expect(swatches.map((b) => b.getAttribute("aria-label"))).toEqual(
      ["green", "blue", "purple", "pink", "orange", "red", "grey"].map((c) => `Tint ${c}`),
    )
    expect(swatches[0].getAttribute("aria-pressed")).toBe("true")
    expect(swatches[0].className).toBe(
      "size-6 rounded-[4px] transition-transform ring-1 ring-foreground ring-offset-2 ring-offset-background",
    )
    expect(swatches[0].style.backgroundColor).not.toBe("")
    fireEvent.click(swatches[2])
    expect(swatches.map((b) => b.getAttribute("aria-pressed") === "true")).toEqual([
      false,
      false,
      true,
      false,
      false,
      false,
      false,
    ])
    expect(swatches[0].className).toBe("size-6 rounded-[4px] transition-transform hover:scale-110")
    pick("faulty-terminal", "crt")
    expect(pressed(term)).toContain("crt")

    const fluid = container.querySelector("#ferrofluid")!
    expect(pressed(fluid)).toEqual(["acid", "down"])
    pick("ferrofluid", "left")
    pick("ferrofluid", "ice")
    expect(pressed(fluid)).toEqual(["ice", "left"])
  })

  it("carries the Vue file's snippets character for character, and its tables' shape", () => {
    const vue = read("src/pages/docs/backgrounds/BackgroundsDocs.vue")
    const solid = read("solid-site/src/pages/docs/backgrounds/BackgroundsDocs.tsx")
    // the static snippets and every API row: one block, verbatim
    const from = vue.indexOf("const wrap = ")
    const block = vue.slice(from, vue.indexOf("</script>")).trimEnd()
    expect(from).toBeGreaterThan(0)
    // every string as written, the snippets among them; the tables by their keys and row counts, their
    // words being the Solid kit's (`docs-api.spec.ts`)
    for (const snippet of stringsIn(block, "ts")) expect(solid).toContain(snippet)
    expect(stringsIn(block, "ts").length).toBeGreaterThan(40)
    expect(sansRows(solid, "tsx")).toContain(sansRows(block, "ts"))
    // the snippets computed from the pickers: the same template, the memo read as a call
    const computed = vue
      .slice(0, from)
      .split("\n")
      .filter((l) => l.includes("`") && l.includes("<Dither"))
    expect(computed).toHaveLength(6)
    for (const line of computed) expect(solid).toContain(line.trim().replace(/\.value\b/g, "()"))
    // and the terminal's attributes
    for (const line of vue.slice(0, from).split("\n"))
      if (/^\s+`[\w:-]+="\$\{/.test(line) || line.includes("attrs.push(")) expect(solid).toContain(line.trim())
  })
})

describe("PosterSection", () => {
  it("prints the poster and picks its screen", () => {
    const { container } = render(() => <PosterSection />)
    const section = container.querySelector("section#poster")!
    expect(section.querySelector("h2")?.textContent).toBe("Poster")
    expect(section.querySelectorAll("canvas")).toHaveLength(0)
    w.show()
    expect(section.querySelectorAll("[data-demo-card] .h-72 canvas")).toHaveLength(1)
    const roll = [...section.querySelectorAll("button")].find((b) => b.textContent?.trim() === "Roll a seed")!
    expect(roll.querySelector("svg")).not.toBeNull()
    fireEvent.click(roll)
    const kinds = [...section.querySelectorAll(".demo-well button[aria-pressed]")] as HTMLButtonElement[]
    expect(kinds.map((b) => b.textContent?.trim())).toEqual([...SCREEN_KINDS])
    expect(pressed(section)).toEqual(["bayer"])
    fireEvent.click(kinds.find((b) => b.textContent?.trim() === "dot")!)
    expect(pressed(section)).toEqual(["dot"])
    expect(kinds.find((b) => b.textContent?.trim() === "dot")!.className).toBe(
      "rounded border px-2 py-1 text-[11px] border-accent bg-accent/80 text-accent-foreground",
    )
    expect(kinds[0].className).toBe(
      "rounded border px-2 py-1 text-[11px] border-border/60 text-muted-foreground hover:bg-accent/40",
    )
    expect(section.querySelector("table")).not.toBeNull()
  })
})

describe("ScreensSection", () => {
  it("prints three surfaces through the picked screen", () => {
    const { container } = render(() => <ScreensSection />)
    const section = container.querySelector("section#print-screens")!
    expect(section.querySelector("h2")?.textContent).toBe("Print screens")
    const lede = section.querySelector("h2 + p")!
    expect(lede.textContent).toContain("unless told otherwise. DitherScreen swaps it")
    expect(lede.textContent).toContain("and screenMatrix hands the same")
    expect([...lede.querySelectorAll("code")].map((c) => c.textContent)).toEqual(["DitherScreen", "screenMatrix"])
    w.show()
    const card = cards(section)[0]
    // the chart, the avatar and the gradient
    expect(card.querySelector(".h-36")).not.toBeNull()
    expect(card.querySelector(".h-16.w-28 canvas")).not.toBeNull()
    const kinds = [...section.querySelectorAll(".demo-well button[aria-pressed]")] as HTMLButtonElement[]
    expect(kinds.map((b) => b.textContent?.trim())).toEqual(["Bayer", "Line", "Hatch", "Dot", "Cross"])
    expect(pressed(section)).toEqual(["Hatch"])
    fireEvent.click(kinds[3])
    expect(pressed(section)).toEqual(["Dot"])
    expect(section.querySelector("table")).not.toBeNull()
  })

  it("carries the Vue files' snippets character for character, and their tables' shape", () => {
    for (const [vuePath, solidPath] of [
      ["src/pages/docs/utils/ScreensSection.vue", "solid-site/src/pages/docs/utils/ScreensSection.tsx"],
      ["src/pages/docs/backgrounds/PosterSection.vue", "solid-site/src/pages/docs/backgrounds/PosterSection.tsx"],
    ]) {
      const vue = read(vuePath)
      const block = vue.slice(vue.indexOf("const CHIP = "), vue.indexOf("</script>")).trimEnd()
      expect(block).toContain("const SNIPPET = `")
      for (const snippet of stringsIn(block, "ts")) expect(read(solidPath)).toContain(snippet)
      expect(sansRows(read(solidPath), "tsx")).toContain(sansRows(block, "ts"))
    }
  })
})
