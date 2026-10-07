// @vitest-environment jsdom
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { afterEach, describe, expect, it, vi } from "vitest"
import NumberText from "../../dither-kit/NumberText.vue"
import CurrencyText from "../../dither-kit/CurrencyText.vue"
import PercentText from "../../dither-kit/PercentText.vue"
import FileSizeText from "../../dither-kit/FileSizeText.vue"
import DurationText from "../../dither-kit/DurationText.vue"
import RelativeTime from "../../dither-kit/RelativeTime.vue"
import DateTimeText from "../../dither-kit/DateTimeText.vue"
import PluralText from "../../dither-kit/PluralText.vue"
import Emoji from "../../dither-kit/Emoji.vue"

afterEach(() => {
  vi.useRealTimers()
})

describe("NumberText", () => {
  it("formats with locale, decimals and grouping", () => {
    expect(mount(NumberText, { props: { value: 1234567.5, decimals: 2 } }).text()).toBe("1,234,567.50")
    expect(mount(NumberText, { props: { value: 1234567.5, grouping: false } }).text()).toBe("1234567.5")
    expect(mount(NumberText, { props: { value: 1234.5, locale: "de-DE" } }).text()).toBe("1.234,5")
  })
})

describe("CurrencyText", () => {
  it("places the symbol per locale and honors the currency", () => {
    expect(mount(CurrencyText, { props: { value: 12.5 } }).text()).toBe("$12.50")
    expect(mount(CurrencyText, { props: { value: 12.5, currency: "EUR", locale: "de-DE" } }).text()).toContain("€")
    expect(mount(CurrencyText, { props: { value: 49, currency: "JPY", decimals: 0 } }).text()).toBe("¥49")
  })
})

describe("PercentText", () => {
  it("treats the input as a fraction", () => {
    expect(mount(PercentText, { props: { value: 0.42 } }).text()).toBe("42%")
    expect(mount(PercentText, { props: { value: 0.5, decimals: 1 } }).text()).toBe("50.0%")
    expect(mount(PercentText, { props: { value: 1 } }).text()).toBe("100%")
  })
})

describe("FileSizeText", () => {
  it("walks 1024-based units and keeps sub-KB whole", () => {
    expect(mount(FileSizeText, { props: { bytes: 0 } }).text()).toBe("0 B")
    expect(mount(FileSizeText, { props: { bytes: 1023 } }).text()).toBe("1023 B")
    expect(mount(FileSizeText, { props: { bytes: 1024 } }).text()).toBe("1.0 KB")
    expect(mount(FileSizeText, { props: { bytes: 1536 } }).text()).toBe("1.5 KB")
    expect(mount(FileSizeText, { props: { bytes: 1048576 } }).text()).toBe("1.0 MB")
    expect(mount(FileSizeText, { props: { bytes: 10737418240 } }).text()).toBe("10.0 GB")
    expect(mount(FileSizeText, { props: { bytes: -1024 } }).text()).toBe("-1.0 KB")
  })
})

describe("DurationText", () => {
  it("drops precision as magnitude grows", () => {
    expect(mount(DurationText, { props: { ms: 500 } }).text()).toBe("500ms")
    expect(mount(DurationText, { props: { ms: 45000 } }).text()).toBe("45s")
    expect(mount(DurationText, { props: { ms: 125000 } }).text()).toBe("2m 5s")
    expect(mount(DurationText, { props: { ms: 600000 } }).text()).toBe("10m")
    expect(mount(DurationText, { props: { ms: 80400000 } }).text()).toBe("22h 20m")
    expect(mount(DurationText, { props: { ms: 90061000 } }).text()).toBe("1d 1h")
    expect(mount(DurationText, { props: { ms: 172800000 } }).text()).toBe("2d")
  })
})

describe("RelativeTime", () => {
  const NOW = Date.UTC(2026, 9, 7, 12, 0, 0)

  it("picks the largest sane unit against a frozen clock", () => {
    const cases: Array<[number, string]> = [
      [-90_000, "1 minute ago"], // Math.round(-1.5) = -1 in JS
      [-3_600_000, "1 hour ago"],
      [-86_400_000, "yesterday"],
      [86_400_000 * 2, "in 2 days"],
      [-86_400_000 * 400, "last year"],
    ]
    for (const [offset, expected] of cases) {
      const w = mount(RelativeTime, { props: { date: NOW + offset, now: NOW, auto: false } })
      expect(w.text()).toBe(expected)
      expect(w.element.tagName).toBe("TIME")
    }
  })

  it("renders 'now' at zero via numeric auto", () => {
    const w = mount(RelativeTime, { props: { date: NOW, now: NOW, auto: false } })
    expect(w.text()).toBe("now")
  })

  it("re-ticks on its interval while auto is on", async () => {
    vi.useFakeTimers()
    const base = Date.now()
    vi.setSystemTime(base)
    const w = mount(RelativeTime, { props: { date: base - 1000, updateInterval: 30_000 } })
    expect(w.text()).toBe("1 second ago")
    vi.advanceTimersByTime(30_000)
    await nextTick() // interval fired -> ref tick -> Vue re-render is a microtask
    expect(w.text()).toBe("31 seconds ago")
    w.unmount() // interval must be gone: advancing further must not throw
    vi.advanceTimersByTime(60_000)
  })
})

describe("DateTimeText", () => {
  it("renders per options and dashes an invalid date", () => {
    const iso = "2026-10-07T15:04:00Z"
    const w = mount(DateTimeText, { props: { date: iso, options: { timeZone: "UTC" } } })
    expect(w.text()).toContain("2026")
    expect(w.text()).toContain("3:04")
    const bad = mount(DateTimeText, { props: { date: "not a date" } })
    expect(bad.text()).toBe("—")
  })
})

describe("PluralText", () => {
  it("switches slots by plural category with count in scope", () => {
    const w = mount(PluralText, {
      props: { count: 1 },
      slots: {
        default: (scope: { count: number }) => `${scope.count} cats`,
        one: (scope: { count: number }) => `${scope.count} cat`,
      },
    })
    expect(w.text()).toBe("1 cat")
    const many = mount(PluralText, {
      props: { count: 7 },
      slots: {
        default: (scope: { count: number }) => `${scope.count} cats`,
        one: (scope: { count: number }) => `${scope.count} cat`,
      },
    })
    expect(many.text()).toBe("7 cats")
  })

  it("falls back to the default slot when the category slot is absent", () => {
    const w = mount(PluralText, { props: { count: 1 }, slots: { default: "always this" } })
    expect(w.text()).toBe("always this")
  })
})

describe("Emoji", () => {
  it("exposes the glyph as an image with an accessible name", () => {
    const w = mount(Emoji, { props: { char: "🚀", label: "launch" } })
    expect(w.attributes("role")).toBe("img")
    expect(w.attributes("aria-label")).toBe("launch")
    expect(w.text()).toBe("🚀")
    const bare = mount(Emoji, { props: { char: "🔥" } })
    expect(bare.attributes("aria-label")).toBeUndefined()
  })
})
