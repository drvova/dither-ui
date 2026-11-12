// The docs' Animations pack on Solid: every section of the pack's nav under
// its heading, each preview mounting its demo once in view, the demos' own
// controls, and the authored snippets held to the Vue site's, character for
// character. The Vue pack has no spec of its own beyond the nav's
// (`tests/docs-packs.spec.ts`), which the first case carries.
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import { afterEach, describe, expect, it } from "vitest"
import { ANIMATIONS_NAV } from "@/pages/docs/animations/animations-nav"
import AnimationsDocs from "../../src/pages/docs/animations/AnimationsDocs"
import TransitionSection from "../../src/pages/docs/animations/TransitionSection"
import { world } from "../world"

const VUE = join(__dirname, "../../../src/pages/docs/animations")
const SOLID = join(__dirname, "../../src/pages/docs/animations")
const read = (dir: string, file: string) => readFileSync(join(dir, file), "utf8")

let w: ReturnType<typeof world>
afterEach(() => {
  cleanup()
  w?.restore()
})

const settle = async () => {
  for (let i = 0; i < 6; i++) {
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
  }
}

function open(Page: () => unknown = AnimationsDocs) {
  w = world()
  const view = render(() => <>{Page()}</>)
  const root = view.container
  const section = (id: string) => root.querySelector<HTMLElement>(`section[id="${id}"]`)!
  const button = (id: string, name: string) =>
    [...section(id).querySelectorAll<HTMLButtonElement>(".demo-well button")].find(
      (b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name,
    )!
  return { root, section, button }
}

describe("the Animations pack", () => {
  it("renders every section the nav names, under its heading, as a top-level section", () => {
    const { root } = open()
    const sections = [...root.children] as HTMLElement[]
    expect(sections.every((s) => s.tagName === "SECTION")).toBe(true)
    const shown = sections.map((s) => ({ id: s.id, label: s.querySelector("h2")!.textContent!.trim() }))
    const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
    expect([...shown].sort(byId)).toEqual([...ANIMATIONS_NAV].sort(byId))
    for (const s of sections) {
      expect(s.className).toContain("mt-16 scroll-mt-24")
      expect(s.querySelector("p")!.textContent!.trim().length).toBeGreaterThan(40)
      expect(s.querySelector("table")).not.toBeNull()
    }
  })

  it("mounts each preview's demo once it comes into view", async () => {
    const { root } = open()
    const wells = [...root.querySelectorAll<HTMLElement>("[data-demo-card] .demo-well")]
    // a card a section, and Step timing's second (the two Auroras)
    expect(wells.length).toBe(ANIMATIONS_NAV.length + 1)
    for (const well of wells) {
      expect(well.textContent).toBe("preview")
      expect(well.querySelector(".h-40.animate-pulse")).not.toBeNull()
    }
    w.show()
    await settle()
    for (const well of wells) {
      const id = well.closest("section")!.id
      expect(well.querySelector(".h-40.animate-pulse"), id).toBeNull()
      expect(well.firstElementChild!.childElementCount, id).toBeGreaterThan(0)
    }
    expect(root.querySelectorAll(".timing-lane").length).toBe(3)
    expect(root.querySelectorAll("#step-timing canvas").length).toBe(2)
    expect(root.querySelectorAll("#sequences .seq-cell").length).toBe(12)
    expect(root.querySelectorAll("#gradual-blur .demo-well p").length).toBe(6)
    expect(root.querySelectorAll("#scroll-progress [aria-hidden='true'] > div").length).toBe(14)
    expect(root.querySelector("#logo-loop")!.textContent).toContain("BAYER")
  })

  it("nests its own styles under a hook the four sections that wear them carry", () => {
    const { root } = open()
    const scoped = [...root.querySelectorAll(".animations-docs-scope")].map((s) => s.id)
    expect(scoped).toEqual(["step-timing", "sequences", "container-queries", "stage"])
    const css = read(SOLID, "AnimationsDocs.css")
    const vue = read(VUE, "AnimationsDocs.vue")
    const rules = vue.slice(vue.indexOf("<style scoped>") + 15, vue.indexOf("</style>"))
    // the Vue rules verbatim once the hook is taken off
    expect(css.replaceAll(".animations-docs-scope ", "")).toBe(rules)
    for (const line of css.split("\n"))
      if (/^\s*\./.test(line)) expect(line.trimStart().startsWith(".animations-docs-scope "), line).toBe(true)
  })

  it("replays the reveal in the direction picked", async () => {
    const { button } = open()
    w.show()
    await settle()
    expect(button("dither-reveal", "Dissolve").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(button("dither-reveal", "Iris"))
    expect(button("dither-reveal", "Iris").getAttribute("aria-pressed")).toBe("true")
    expect(button("dither-reveal", "Iris").className).toContain("border-accent bg-accent/80")
    expect(button("dither-reveal", "Dissolve").getAttribute("aria-pressed")).toBe("false")
    expect(button("dither-reveal", "Dissolve").className).toContain("border-border/60")
    expect(button("dither-reveal", "Replay")).toBeTruthy()
  })

  it("counts what its action demos report and names what they pick", async () => {
    const { section, button } = open()
    w.show()
    await settle()
    expect(section("snap-button").textContent).toContain("deploys fired: 0")
    fireEvent.keyDown(button("snap-button", "Pull to deploy"), { key: "Enter" })
    expect(section("snap-button").textContent).toContain("deploys fired: 1")
    expect(section("slide-action").textContent).toContain("deploys: 0")
    expect(section("hold-action").textContent).toContain("completed: 0")
    expect(section("card-stack").textContent).toContain("card 1 of 4")
    expect(section("card-stack").textContent).toContain("Prints: riso on cream")
    expect(section("dock").textContent).toContain("selected: none")
    fireEvent.click(button("dock", "Studio"))
    expect(section("dock").textContent).toContain("selected: studio")
    expect(section("preview-rail").textContent).toContain("destination: inbox")
    expect(section("gooey-menu").textContent).toContain("picked: none")
    expect(section("wallet-card").textContent).toContain("last: none")
    expect(section("notification-stack").textContent).toContain("pinned: false, last: none")
    expect(section("island").textContent).toContain("Deploy running")
    expect(section("expand-tabs").querySelectorAll(".demo-well button").length).toBe(3)
  })

  it("switches the sequence's origin and easing from its chips", async () => {
    const { button } = open()
    w.show()
    await settle()
    expect(button("sequences", "center").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(button("sequences", "edges"))
    expect(button("sequences", "edges").getAttribute("aria-pressed")).toBe("true")
    expect(button("sequences", "center").getAttribute("aria-pressed")).toBe("false")
    const easing = button("sequences", "linear")
    expect(easing.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(easing)
    expect(easing.textContent!.trim()).toBe("steps(4)")
    expect(easing.getAttribute("aria-pressed")).toBe("true")
  })

  it("picks the notification stack's variant under the preview", async () => {
    const { section } = open()
    w.show()
    await settle()
    const chips = [...section("notification-stack").querySelectorAll<HTMLButtonElement>("h3 + div button")]
    expect(chips.map((c) => c.textContent!.trim())).toEqual(["stack", "fan", "condensed"])
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["true", "false", "false"])
    fireEvent.click(chips[1])
    expect(chips.map((c) => c.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"])
    expect(chips[1].className).toContain("bg-card text-foreground")
  })

  it("resizes the query container from its steppers and the stage from its slider", async () => {
    const { section } = open()
    w.show()
    await settle()
    const panel = section("container-queries").querySelector<HTMLElement>(".cq-panel")!
    expect(panel.querySelector(".cq-readout")).not.toBeNull()
    expect(panel.querySelectorAll(".seq-cell").length).toBe(12)
    panel.getBoundingClientRect = () => ({ width: 500 }) as DOMRect
    fireEvent.click(section("container-queries").querySelector('[aria-label="Widen the container by 40 pixels"]')!)
    expect(panel.style.width).toBe("540px")
    fireEvent.click(section("container-queries").querySelector('[aria-label="Narrow the container by 40 pixels"]')!)
    expect(panel.style.width).toBe("460px")
    panel.getBoundingClientRect = () => ({ width: 210 }) as DOMRect
    fireEvent.click(section("container-queries").querySelector('[aria-label="Narrow the container by 40 pixels"]')!)
    expect(panel.style.width).toBe("200px")

    const stage = section("stage").querySelector<HTMLElement>(".stage-demo")!
    expect(stage.style.width).toBe("100%")
    expect(stage.querySelectorAll(".stage-hills").length).toBe(2)
    expect(stage.querySelector(".stage-dot circle")).not.toBeNull()
    const slider = section("stage").querySelector<HTMLInputElement>('input[name="stage-width"]')!
    expect(slider.value).toBe("100")
    fireEvent.input(slider, { target: { value: "55" } })
    expect(stage.style.width).toBe("55%")
    expect(section("stage").querySelector(".tabular-nums")!.textContent).toBe("55%")
  })

  it("keeps the authored tables and snippets the Vue pack's, character for character", () => {
    const vue = read(VUE, "AnimationsDocs.vue")
    const solid = read(SOLID, "AnimationsDocs.tsx")
    const authored = vue.slice(vue.indexOf("const SHARED_CANVAS"), vue.indexOf("/* Skiper-adjacent widgets"))
    expect(authored.length).toBeGreaterThan(30000)
    expect(solid).toContain(authored)
    // the one computed snippet: the same text over the same state
    const from = (text: string) =>
      text.slice(text.indexOf("`<DitherNotificationStack v-model"), text.indexOf("stagger -->`"))
    expect(from(vue).length).toBeGreaterThan(400)
    expect(from(solid)).toBe(from(vue).replaceAll("stackVariant.value", "stackVariant()").replaceAll('\\"', '"'))
    const page = read(VUE, "TransitionSection.vue")
    const twin = read(SOLID, "TransitionSection.tsx")
    const between = (from: string, to: string) => page.slice(page.indexOf(from), page.indexOf(to))
    for (const block of [between("const SCENES", "\n\nconst scene = ref"), between("const KEY", "</script>")]) {
      expect(block.length).toBeGreaterThan(400)
      expect(twin).toContain(block)
    }
  })
})

describe("the page transition's section", () => {
  it("steps its scenes, plays and pauses, and picks a direction and the ink", async () => {
    const { root, section, button } = open(TransitionSection)
    expect(root.querySelector("h2")!.textContent).toBe("Page transition")
    expect(section("dither-transition").querySelector("table")).not.toBeNull()
    w.show()
    await settle()
    const stage = section("dither-transition").querySelector<HTMLElement>("[aria-live='polite']")!
    expect(stage.textContent).toContain("Cell by cell")
    expect(stage.className).toContain("bg-card text-foreground")
    // no View Transitions API here: the change just happens
    fireEvent.click(button("dither-transition", "Next scene"))
    await settle()
    expect(stage.textContent).toContain("Through the ink")
    expect(stage.className).toContain("bg-foreground text-background")
    fireEvent.click(button("dither-transition", "Previous scene"))
    await settle()
    fireEvent.click(button("dither-transition", "Previous scene"))
    await settle()
    expect(stage.textContent).toContain("Any change")
    fireEvent.click(button("dither-transition", "Random scene"))
    await settle()
    expect(stage.textContent).not.toContain("Any change")

    const play = button("dither-transition", "Play")
    expect(play.getAttribute("aria-pressed")).toBe("false")
    fireEvent.click(play)
    expect(play.getAttribute("aria-label")).toBe("Pause")
    expect(play.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(play)
    expect(play.getAttribute("aria-label")).toBe("Play")

    expect(button("dither-transition", "Wipe").getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(button("dither-transition", "Iris"))
    expect(button("dither-transition", "Iris").getAttribute("aria-pressed")).toBe("true")
    expect(button("dither-transition", "Wipe").getAttribute("aria-pressed")).toBe("false")
    const ink = button("dither-transition", "Ink")
    expect(ink.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(ink)
    expect(ink.getAttribute("aria-pressed")).toBe("false")
  })
})
