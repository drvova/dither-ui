// The docs' Examples packs (auth, chat, notifications, product, sidebar,
// stats, table): every section of each pack's nav in order under
// its label, each preview mounting its demo once it nears the view, and
// the demos' own state driving what they show.
import { cleanup, fireEvent, render } from "@solidjs/testing-library"
import type { JSX } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AUTH_NAV } from "@/pages/docs/examples/auth-nav"
import { CHAT_NAV } from "@/pages/docs/examples/chat-nav"
import { NOTIFICATIONS_NAV } from "@/pages/docs/examples/notifications-nav"
import { PRODUCT_NAV } from "@/pages/docs/examples/product-nav"
import { SIDEBAR_NAV } from "@/pages/docs/examples/sidebar-nav"
import { STATS_NAV } from "@/pages/docs/examples/stats-nav"
import { TABLE_NAV } from "@/pages/docs/examples/table-nav"
import AuthExamples from "../../src/pages/docs/examples/AuthExamples"
import ChatExamples from "../../src/pages/docs/examples/ChatExamples"
import NotificationsExamples from "../../src/pages/docs/examples/NotificationsExamples"
import ProductExamples from "../../src/pages/docs/examples/ProductExamples"
import SidebarExamples from "../../src/pages/docs/examples/SidebarExamples"
import StatsExamples from "../../src/pages/docs/examples/StatsExamples"
import TableExamples from "../../src/pages/docs/examples/TableExamples"
import { world } from "@dither-ui/kit/testing/world.ts"

const PACKS: [string, () => JSX.Element, readonly { id: string; label: string }[]][] = [
  ["AuthExamples", AuthExamples, AUTH_NAV],
  ["ChatExamples", ChatExamples, CHAT_NAV],
  ["NotificationsExamples", NotificationsExamples, NOTIFICATIONS_NAV],
  ["ProductExamples", ProductExamples, PRODUCT_NAV],
  ["SidebarExamples", SidebarExamples, SIDEBAR_NAV],
  ["StatsExamples", StatsExamples, STATS_NAV],
  ["TableExamples", TableExamples, TABLE_NAV],
]

let w: ReturnType<typeof world>
let reduced = false
let scrolls = 0
beforeEach(() => {
  w = world()
  // jsdom scrolls nothing: a chat follows its newest message
  scrolls = 0
  Element.prototype.scrollTo = () => void scrolls++
  reduced = false
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduced-motion"),
    addEventListener() {},
    removeEventListener() {},
  }))
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  w.restore()
})

const cards = (root: Element) => [...root.querySelectorAll("[data-demo-card]")]
const words = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim()
/** The pack mounted with every preview in view. */
function shown(Pack: () => JSX.Element) {
  const view = render(() => <Pack />)
  w.show()
  return view
}
/** A section's preview well. */
const well = (root: Element, id: string) => root.querySelector(`section[id="${id}"] .demo-well`)!
const key = (root: Element, name: string) =>
  [...root.querySelectorAll("button")].find((b) => words(b.textContent) === name)!
const type = (input: Element, value: string) => fireEvent.input(input, { target: { value } })
const texts = (root: Element, selector: string) => [...root.querySelectorAll(selector)].map((e) => words(e.textContent))

describe.each(PACKS)("%s", (_name, Pack, nav) => {
  it("writes every section of its nav, in order, under its label", () => {
    const { container } = render(() => <Pack />)
    const sections = [...container.querySelectorAll(":scope > section[id]")]
    expect(sections.map((s) => s.id)).toEqual(nav.map((n) => n.id))
    expect(sections.map((s) => s.querySelector("h2")?.textContent)).toEqual(nav.map((n) => n.label))
    for (const s of sections) {
      expect(s.className).toBe("mt-16 scroll-mt-24")
      expect(s.querySelector("h2")?.className).toBe("text-lg tracking-tight")
      expect(s.firstElementChild?.tagName).toBe("H2")
      // an example is a heading, a line and one preview
      expect(cards(s)).toHaveLength(1)
      expect(s.lastElementChild).toBe(cards(s)[0])
    }
  })

  it("mounts each preview's demo once, when it comes into view", () => {
    const { container } = render(() => <Pack />)
    const wells = cards(container).map((c) => c.querySelector(".demo-well")!)
    expect(wells).toHaveLength(nav.length)
    // the quiet frame waits in every well
    for (const el of wells) expect(words(el.textContent)).toBe("preview")
    w.show()
    for (const el of wells) {
      expect(el.querySelector(":scope > .w-full > .animate-pulse")).toBeNull()
      expect(el.firstElementChild?.childElementCount).toBe(1)
    }
    // latched: a second report mounts nothing again
    const before = container.querySelectorAll(".demo-well *").length
    w.show()
    expect(container.querySelectorAll(".demo-well *").length).toBe(before)
  })
})

describe("AuthExamples", () => {
  it("picks one plan at a time", () => {
    const { container } = shown(AuthExamples)
    const plans = [...well(container, "signup").querySelectorAll('[role="group"][aria-label="Plan"] button')]
    const pressed = () => plans.map((b) => b.getAttribute("aria-pressed"))
    expect(plans.map((b) => b.textContent)).toEqual(["Free", "Pro", "Scale"])
    expect(pressed()).toEqual(["true", "false", "false"])
    expect(plans[0].className).toContain("bg-card text-foreground")
    fireEvent.click(plans[2])
    expect(pressed()).toEqual(["false", "false", "true"])
    expect(plans[0].className).toContain("text-muted-foreground hover:text-foreground")
  })

  it("sends the magic link, echoes the address, and starts over", () => {
    const { container } = shown(AuthExamples)
    const card = well(container, "magic-link")
    fireEvent.click(key(card, "Send magic link"))
    expect(words(card.textContent)).toContain("Check your inboxWe sent a link to your email")
    fireEvent.click(key(card, "use a different email"))
    const input = card.querySelector<HTMLInputElement>('input[name="magic-email"]')!
    expect(input.value).toBe("")
    type(input, "ada@acme.io")
    fireEvent.click(key(card, "Send magic link"))
    expect(card.querySelector("input")).toBeNull()
    expect(words(card.textContent)).toContain("We sent a link to ada@acme.io")
  })

  it("moves the focus to the next code cell as a digit lands", () => {
    const { container } = shown(AuthExamples)
    const cells = [
      ...well(container, "twofactor").querySelectorAll<HTMLInputElement>('[aria-label="Verification code"] input'),
    ]
    expect(cells.map((c) => c.getAttribute("aria-label"))).toEqual([1, 2, 3, 4, 5, 6].map((n) => `Digit ${n}`))
    expect(cells.map((c) => c.name)).toEqual([1, 2, 3, 4, 5, 6].map((n) => `twofactor-digit-${n}`))
    cells[0].focus()
    type(cells[0], "4")
    expect(document.activeElement).toBe(cells[1])
    // an emptied cell keeps the focus
    type(cells[1], "")
    expect(document.activeElement).toBe(cells[1])
    cells[5].focus()
    type(cells[5], "9")
    expect(document.activeElement).toBe(cells[5])
  })
})

describe("ChatExamples", () => {
  it("sends a bubble, types back, and clears a thread's unread count when it opens", async () => {
    vi.useFakeTimers()
    const { container } = shown(ChatExamples)
    const card = well(container, "chat-thread")
    const bubbles = () => texts(card, ".max-w-\\[75\\%\\] > p")
    const send = key(card, "Send") as HTMLButtonElement
    const input = card.querySelector<HTMLInputElement>('input[placeholder="Message…"]')!
    expect(bubbles()).toHaveLength(3)
    expect(send.disabled).toBe(true)
    type(input, "  Ship it  ")
    expect(send.disabled).toBe(false)
    fireEvent.submit(card.querySelector("form")!)
    expect(bubbles()).toEqual([...bubbles().slice(0, 3), "Ship it"])
    expect(input.value).toBe("")
    expect(card.querySelector('[aria-label="Typing"]')).not.toBeNull()
    // the list's last line is the newest message
    expect(texts(card, "aside button")[0]).toContain("Ship it")
    await Promise.resolve()
    expect(scrolls).toBeGreaterThan(0)
    // nothing sends while the other side types
    type(input, "again")
    expect(send.disabled).toBe(true)
    fireEvent.submit(card.querySelector("form")!)
    expect(bubbles()).toHaveLength(4)
    vi.advanceTimersByTime(1200)
    expect(card.querySelector('[aria-label="Typing"]')).toBeNull()
    expect(bubbles()).toHaveLength(5)
    expect(bubbles()[4]).toBe("On it. Give me ten minutes.")

    const threads = [...card.querySelectorAll("aside button")]
    expect(threads.map((t) => t.getAttribute("aria-pressed"))).toEqual(["true", "false"])
    expect(words(threads[1].textContent)).toMatch(/2$/)
    fireEvent.click(threads[1])
    expect(threads.map((t) => t.getAttribute("aria-pressed"))).toEqual(["false", "true"])
    expect(words(threads[1].textContent)).not.toMatch(/2$/)
    expect(bubbles()).toEqual(["Two tickets left in the queue.", "One looks like the export bug again."])
  })

  it("streams the assistant's answer and stops mid-sentence", () => {
    vi.useFakeTimers()
    const { container } = shown(ChatExamples)
    const card = well(container, "chat-assistant")
    const bubbles = () => [...card.querySelectorAll(".max-w-\\[80\\%\\] > p")]
    const chips = [...card.querySelectorAll('[aria-label="Suggestions"] button')]
    expect(chips.length).toBeGreaterThan(0)
    // the space before the text, shown under pre-wrap
    expect(bubbles()[0].textContent).toMatch(/^ Hi, ask me/)
    fireEvent.click(chips[0])
    expect(words(bubbles()[1].textContent)).toBe(words(chips[0].textContent))
    expect(card.querySelector('[aria-label="Suggestions"]')).toBeNull()
    expect(words(card.textContent)).toContain("thinking")
    expect(bubbles()[2].querySelector(".animate-pulse")).not.toBeNull()
    vi.advanceTimersByTime(24 * 3)
    const partial = words(bubbles()[2].textContent).replace("▍", "").trim()
    expect(partial).toHaveLength(9)
    fireEvent.click(key(card, "Stop generating"))
    vi.advanceTimersByTime(24 * 50)
    expect(words(bubbles()[2].textContent)).toBe(partial)
    expect(bubbles()[2].querySelector(".animate-pulse")).toBeNull()
    expect(words(card.textContent)).toContain("ready")
    expect(card.querySelector('[aria-label="Suggestions"]')).not.toBeNull()
  })

  it("lands the assistant's answer whole under reduced motion", () => {
    reduced = true
    const { container } = shown(ChatExamples)
    const card = well(container, "chat-assistant")
    type(card.querySelector('input[placeholder="Ask about the kit…"]')!, "Something else entirely")
    fireEvent.submit(card.querySelector("form")!)
    const bubbles = texts(card, ".max-w-\\[80\\%\\] > p")
    expect(bubbles).toHaveLength(3)
    expect(bubbles[1]).toBe("Something else entirely")
    expect(bubbles[2]).toContain("Try a seed")
    expect(card.querySelector('[aria-label="Suggestions"]')).not.toBeNull()
  })

  it("answers a quick reply and escalates to a ticket", () => {
    vi.useFakeTimers()
    const { container } = shown(ChatExamples)
    const card = well(container, "chat-support")
    const human = key(card, "Talk to a human") as HTMLButtonElement
    fireEvent.click(human)
    expect(human.disabled).toBe(true)
    expect(card.querySelector('[aria-label="Agent typing"]')).not.toBeNull()
    vi.advanceTimersByTime(1100)
    expect(card.querySelector('[aria-label="Agent typing"]')).toBeNull()
    expect(human.disabled).toBe(false)
    expect(texts(card, ".max-w-\\[75\\%\\] > p")).toHaveLength(3)
    expect(card.querySelector("p.px-4.text-center")).toBeNull()
    vi.advanceTimersByTime(900)
    expect(card.querySelector("p.px-4.text-center")?.textContent).toBe(
      "Ticket #4821 opened. Rei joined the conversation.",
    )
  })

  it("groups a channel's rows by author and toggles reactions", () => {
    const { container } = shown(ChatExamples)
    const card = well(container, "chat-channel")
    const rows = () => [...card.querySelectorAll(".min-h-0 > .flex")]
    const named = () => rows().map((r) => r.querySelector("p.flex > span")?.textContent ?? null)
    expect(named()).toEqual(["Rei Toma", null, "Kai Raster", "You"])
    type(card.querySelector('input[placeholder="Message #dither-dev…"]')!, "On it")
    fireEvent.submit(card.querySelector("form")!)
    expect(named()).toEqual(["Rei Toma", null, "Kai Raster", "You", null])
    expect(rows()[4].className).toContain("py-0.5")

    const plus = rows()[0].querySelector<HTMLButtonElement>('button[aria-pressed="false"]')!
    expect(words(plus.textContent)).toBe("+1 2")
    fireEvent.click(plus)
    expect(words(plus.textContent)).toBe("+1 3")
    expect(plus.getAttribute("aria-pressed")).toBe("true")
    fireEvent.click(plus)
    expect(words(plus.textContent)).toBe("+1 2")
    // "+" adds the reader's own; taken back, a reaction of none leaves the row
    const reactions = () => texts(rows()[2], "button[aria-pressed]")
    expect(reactions()).toEqual(["ship it 1"])
    fireEvent.click(rows()[2].querySelector('[aria-label="Add reaction"]')!)
    expect(reactions()).toEqual(["ship it 1", "+1 1"])
    fireEvent.click(rows()[2].querySelectorAll("button[aria-pressed]")[1])
    expect(reactions()).toEqual(["ship it 1"])
    // a row with no reaction shows no "+" either
    expect(rows()[1].querySelector("button")).toBeNull()
  })
})

describe("NotificationsExamples", () => {
  it("clears the unread dot on a click, all at once, and says when nothing is unread", () => {
    const { container } = shown(NotificationsExamples)
    const card = well(container, "notification-center")
    const rows = () => [...card.querySelectorAll(".max-h-72 section > button")]
    const unread = () => rows().filter((r) => r.querySelector(".sr-only")?.textContent === "unread").length
    const markAll = key(card, "Mark all read") as HTMLButtonElement
    expect(texts(card, "h4")).toEqual(["Today", "Earlier"])
    expect(rows()).toHaveLength(6)
    expect(unread()).toBe(3)
    expect(words(card.querySelector("span.flex")!.textContent)).toBe("Notifications 3")
    fireEvent.click(rows()[0])
    expect(unread()).toBe(2)
    expect(rows()[0].className).not.toContain("bg-card/40")

    const tabs = [...card.querySelectorAll('[role="tab"]')]
    expect(tabs.map((t) => words(t.textContent))).toEqual(["All", "Unread"])
    fireEvent.click(tabs[1])
    expect(rows()).toHaveLength(2)
    expect(markAll.disabled).toBe(false)
    fireEvent.click(markAll)
    expect(rows()).toHaveLength(0)
    expect(texts(card, "h4")).toEqual([])
    expect(card.querySelector(".max-h-72 > p")?.textContent).toBe("All caught up.")
    expect(markAll.disabled).toBe(true)
    expect(words(card.querySelector("span.flex")!.textContent)).toBe("Notifications")
  })
})

describe("ProductExamples", () => {
  it("prints the tiers, the feed and the timeline from their tables", () => {
    const { container } = shown(ProductExamples)
    const tiers = [...well(container, "pricing").querySelectorAll(".grid > .relative")]
    expect(tiers).toHaveLength(3)
    // one popular tier wears the wash and the chip
    expect(tiers.filter((t) => words(t.textContent).includes("popular"))).toHaveLength(1)
    expect(well(container, "activity").querySelectorAll(".max-w-md > .px-4.gap-3").length).toBeGreaterThan(2)
    const first = well(container, "activity").querySelector(".max-w-md > .px-4.gap-3")!
    expect(first.className).not.toContain("border-t")
    expect(first.nextElementSibling?.className).toContain("border-t border-border/40")
    const releases = [...well(container, "changelog").querySelectorAll(".max-w-md > .flex")]
    // the newest marker is seeded, the rail stops at the last release
    expect(releases[0].querySelector<HTMLElement>(".size-2")!.style.backgroundColor).not.toBe("")
    expect(releases[1].querySelector(".size-2")!.className).toContain("bg-border")
    expect(releases[0].querySelector(".w-px")).not.toBeNull()
    expect(releases[releases.length - 1].querySelector(".w-px")).toBeNull()
  })
})

describe("StatsExamples", () => {
  it("swaps the whole dataset with the period", () => {
    const { container } = shown(StatsExamples)
    const card = well(container, "stats-cards")
    const periods = [...card.querySelectorAll('[aria-label="Period"] button')]
    const figures = () => texts(card, ".text-\\[19px\\]")
    expect(periods.find((p) => p.getAttribute("aria-pressed") === "true")?.textContent).toBe("30d")
    expect(figures()).toHaveLength(4)
    const before = figures()
    expect(before[0]).toBe("$54,239")
    fireEvent.click(periods[1])
    expect(periods.map((p) => p.getAttribute("aria-pressed"))).toEqual(["false", "true"])
    expect(figures()[0]).toBe("$148,102")
    expect(figures()).toHaveLength(4)
    expect(figures()).not.toEqual(before)
    // a delta says its direction to a reader, and wears its colour
    const chip = card.querySelector<HTMLElement>(".rounded.border.px-1")!
    expect(["up", "down"]).toContain(chip.querySelector(".sr-only")?.textContent)
    expect(chip.style.color).toMatch(/var\(--swatch-(green|red)\)/)
    expect(chip.style.borderColor).toContain("color-mix")
    expect(texts(well(container, "stats-charts"), ".text-\\[19px\\]")).toEqual(["$31,204", "690k", "$34,000"])
  })
})

describe("TableExamples", () => {
  it("filters, sorts, pages, selects a page and removes what is selected", () => {
    const { container } = shown(TableExamples)
    const card = well(container, "table-members")
    const names = () => texts(card, "tbody tr td:nth-child(2) > div:first-child")
    const range = () => card.querySelector(".border-t > span")!.textContent
    const heads = () => [...card.querySelectorAll("th[aria-sort]")].map((h) => h.getAttribute("aria-sort"))
    const boxes = () => [...card.querySelectorAll('[role="checkbox"]')]
    // newest first
    expect(heads()).toEqual(["none", "descending"])
    expect(names()).toEqual(["Sol Bayer", "Mika Dot", "Rio Halftone", "Nia Grid", "Kai Raster"])
    expect(range()).toBe("Showing 1–5 of 9")

    fireEvent.click(key(card, "Member"))
    expect(heads()).toEqual(["ascending", "none"])
    expect(names()[0]).toBe("Ada Byte")
    fireEvent.click(card.querySelector("th[aria-sort] button")!)
    expect(heads()).toEqual(["descending", "none"])
    expect(names()[0]).toBe("Sol Bayer")

    fireEvent.click(card.querySelector('[aria-label="Page 2"]')!)
    expect(names()).toHaveLength(4)
    expect(range()).toBe("Showing 6–9 of 9")
    // a filter starts again from the first page
    type(card.querySelector('input[placeholder="Filter members…"]')!, "ADA")
    expect(names()).toEqual(["Ada Byte"])
    expect(range()).toBe("Showing 1–1 of 1")
    type(card.querySelector('input[placeholder="Filter members…"]')!, "zzz")
    expect(words(card.querySelector("tbody td[colspan]")?.textContent)).toBe("No members match “zzz”.")
    expect(range()).toBe("No members match")
    type(card.querySelector('input[placeholder="Filter members…"]')!, "")

    // page-scoped select-all
    expect(boxes()[0].getAttribute("aria-label")).toBe("Select page")
    fireEvent.click(boxes()[1])
    expect(words(card.textContent)).toContain("1 selected")
    expect(card.querySelector("tbody tr")!.className).toContain("bg-card/50")
    expect(boxes()[0].getAttribute("aria-checked")).toBe("false")
    fireEvent.click(boxes()[0])
    expect(words(card.textContent)).toContain("5 selected")
    expect(boxes().map((b) => b.getAttribute("aria-checked"))).toEqual(Array(6).fill("true"))
    fireEvent.click(key(card, "Remove"))
    expect(key(card, "Remove")).toBeUndefined()
    expect(names()).toHaveLength(4)
    expect(range()).toBe("Showing 1–4 of 4")
  })
})

describe("SidebarExamples", () => {
  const current = (root: Element) => texts(root, 'button[aria-current="true"]')

  it("keeps each app window at a desktop's width, the card scrolling to it on a phone", () => {
    // a phone's walk found the page beside a 224px sidebar crushed and its words cut
    const { container } = shown(SidebarExamples)
    const windows = [...container.querySelectorAll<HTMLElement>(".demo-well .flex.h-96.max-w-2xl")]
    expect(windows.length).toBeGreaterThanOrEqual(9)
    for (const w of windows) {
      expect(w.classList.contains("min-w-[36rem]")).toBe(true)
      expect(w.parentElement!.classList.contains("overflow-x-auto")).toBe(true)
    }
  })

  it("folds the dashboard to its rail from the topbar and echoes the picked row", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-dashboard")
    const toggle = card.querySelector('main button[aria-label="Collapse sidebar"]')!
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    expect(words(card.textContent)).toContain("Upgrade to pro")
    expect(card.querySelector('nav[aria-label="Breadcrumb"]')?.lastElementChild?.textContent).toBe("Dashboard")
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-label")).toBe("Expand sidebar")
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(words(card.textContent)).not.toContain("Upgrade to pro")
    expect(words(card.textContent)).not.toContain("acme.io")
    fireEvent.click(toggle)
    const projects = [...card.querySelectorAll("button")].find((b) => words(b.textContent).startsWith("Projects"))!
    fireEvent.click(projects)
    expect(projects.getAttribute("aria-current")).toBe("true")
    expect(card.querySelector('nav[aria-label="Breadcrumb"]')?.lastElementChild?.textContent).toBe("Projects")
  })

  it("counts the filters it holds and resets them", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-filters")
    const count = () => card.querySelector("main .tabular-nums > span")!.textContent
    const boxes = [...card.querySelectorAll('[role="checkbox"]')]
    expect(boxes.map((b) => words(b.textContent))).toEqual([
      "Prints",
      "Frames",
      "Zines",
      "Stickers",
      "Bayer & Co",
      "Ordered",
      "Halftone",
    ])
    expect(texts(card, "label > span.ml-auto")).toEqual(["(125)", "(89)", "(34)", "(67)", "(45)", "(38)", "(29)"])
    expect(count()).toBe("2 filters")
    fireEvent.click(boxes[1])
    expect(boxes[1].getAttribute("aria-checked")).toBe("true")
    expect(count()).toBe("3 filters")
    type(card.querySelector('input[placeholder="Search products…"]')!, "zine")
    fireEvent.click(key(card, "Reset all"))
    expect(count()).toBe("0 filters")
    expect(boxes.map((b) => b.getAttribute("aria-checked"))).toEqual(Array(7).fill("false"))
    expect(card.querySelector<HTMLInputElement>('input[placeholder="Search products…"]')!.value).toBe("")
    expect(words(card.querySelector("main .tabular-nums")!.textContent)).toBe("0 filters$0–$500")
  })

  it("filters the docs tree by its search, opening what matches", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-docs")
    const subs = () => [...card.querySelectorAll("button[aria-expanded]")]
    const name = (s: Element) => words(s.textContent).replace(/›$/, "")
    expect(subs().map((s) => [name(s), s.getAttribute("aria-expanded")])).toEqual([
      ["Getting started", "true"],
      ["API reference", "false"],
      ["Guides", "false"],
    ])
    expect(current(card)).toEqual(["Installation"])
    fireEvent.click(subs()[1])
    expect(subs()[1].getAttribute("aria-expanded")).toBe("true")
    const search = card.querySelector('input[placeholder="Search docs…"]')!
    type(search, "the")
    expect(subs().map((s) => [name(s), s.getAttribute("aria-expanded")])).toEqual([["Guides", "true"]])
    fireEvent.click(key(card, "Theming"))
    expect(texts(card, "main > div").slice(0, 2)).toEqual(["Docs / Theming", "Theming"])
    type(search, "zzz")
    expect(subs()).toHaveLength(0)
    expect(card.querySelector("p.px-2\\.5")?.textContent).toBe("No pages match “zzz”.")
    // the search cleared, each section is as the reader left it
    type(search, "")
    expect(subs().map((s) => s.getAttribute("aria-expanded"))).toEqual(["true", "true", "false"])
  })

  it("swaps the second tier with the rail's pick", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-dual")
    const panel = card.querySelector('[aria-label="Context panel"]')!
    const rows = () => texts(panel, "button").map((t) => t.replace(/\s*\d+$/, ""))
    expect(rows()).toEqual(["All mail", "Starred", "Drafts", "Archive"])
    const rail = [...card.querySelectorAll('[aria-label="Context rail"] button')]
    fireEvent.click(rail[2])
    expect(rows()).toEqual(["Today", "Upcoming", "Someday", "Done"])
    expect(current(panel)[0]).toContain("Today")
    expect(texts(card, "main div div")).toEqual(["Tasks", "Today"])
  })

  it("follows the todo lists in the footer's count", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-personal")
    const boxes = [...card.querySelectorAll('[role="checkbox"]')]
    expect(boxes).toHaveLength(7)
    expect(words(card.textContent)).toContain("3 of 7 done, synced")
    expect(boxes[0].querySelector("span.line-through")).not.toBeNull()
    fireEvent.click(boxes[1])
    expect(words(card.textContent)).toContain("4 of 7 done, synced")
    expect(boxes[1].querySelector("span.line-through")).not.toBeNull()
    // the month: two blanks before the 1st, today ringed
    const cells = texts(card, ".grid-cols-7:last-child > span")
    expect(cells.slice(0, 3)).toEqual(["", "", "1"])
    expect(cells).toHaveLength(33)
    expect(card.querySelector(".ring-1.ring-border")?.textContent).toBe("21")
  })

  it("counts the calendars shown on the right side", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-right")
    expect(words(card.textContent)).toContain("3 calendars shown")
    const boxes = [...card.querySelectorAll('[role="checkbox"]')]
    expect(boxes.map((b) => words(b.textContent))).toEqual(["Personal", "Work", "Family", "Deadlines"])
    fireEvent.click(boxes[2])
    expect(words(card.textContent)).toContain("4 calendars shown")
    expect(card.querySelector<HTMLElement>("label > span[aria-hidden]")!.style.backgroundColor).toContain(
      "--swatch-blue",
    )
  })

  it("swaps the whole workspace from the header's menu", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-teams")
    const trigger = card.querySelector('button[aria-haspopup="menu"]')!
    expect(words(trigger.textContent)).toContain("Acme IncEnterprise")
    expect(current(card)[0]).toContain("Roadmap")
    fireEvent.click(trigger)
    const items = [...document.querySelectorAll('[role="menuitem"]')]
    expect(items.map((i) => words(i.textContent))).toEqual(["Acme Inc", "Pixel Labs", "Zine Press"])
    fireEvent.click(items[1])
    expect(words(trigger.textContent)).toContain("Pixel LabsStartup")
    // the first row of the new workspace is the one picked
    expect(current(card)[0]).toContain("Experiments")
    expect(texts(card, "main div div")).toEqual(["Pixel Labs", "Experiments"])
    expect(words(card.textContent)).not.toContain("Roadmap")
  })

  it("opens and folds every folder of the tree at once", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-tree")
    const folders = () =>
      Object.fromEntries(
        [...card.querySelectorAll("button[aria-expanded]")].map((b) => [
          words(b.textContent).replace(/›$/, ""),
          b.getAttribute("aria-expanded"),
        ]),
      )
    expect(folders()).toMatchObject({ src: "true", components: "true", public: "false" })
    fireEvent.click(card.querySelector('[aria-label="Collapse all folders"]')!)
    expect(Object.values(folders()).every((v) => v === "false")).toBe(true)
    fireEvent.click(card.querySelector('[aria-label="Expand all folders"]')!)
    expect(folders()).toEqual({ src: "true", components: "true", charts: "true", lib: "true", public: "true" })
    fireEvent.click(key(card, "pixel.ts"))
    expect(current(card)).toEqual(["pixel.ts"])
    expect(card.querySelector("main span.text-foreground")?.textContent).toBe("pixel.ts")
  })

  it("closes the drawer on a pick and names it in the bar", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-drawer")
    expect(document.querySelector('[role="dialog"][aria-label="Navigation"]')).toBeNull()
    fireEvent.click(card.querySelector('[aria-label="Open navigation"]')!)
    const drawer = document.querySelector('[role="dialog"][aria-label="Navigation"]')!
    expect(drawer).not.toBeNull()
    fireEvent.click(key(drawer, "Discover"))
    expect(card.querySelector('[aria-label="Open navigation"]')!.nextElementSibling?.textContent).toBe("Discover")
  })

  it("keeps the rail's pick beside it", () => {
    const { container } = shown(SidebarExamples)
    const card = well(container, "sidebar-rail")
    const items = [...card.querySelectorAll('[aria-label="Rail nav"] button')]
    expect(items).toHaveLength(4)
    expect(card.querySelector("main")?.textContent).toBe("Charts")
    fireEvent.click(items[3])
    expect(items[3].getAttribute("aria-current")).toBe("true")
    expect(card.querySelector("main")?.textContent).toBe("Alerts")
  })
})
