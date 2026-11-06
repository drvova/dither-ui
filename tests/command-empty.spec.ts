// @rstest-environment jsdom
// The command palette with nothing matching: its `empty` line, or the
// `empty` slot drawn in its place and handed the query (the docs' search
// puts the mascot there).
import { mount } from "@vue/test-utils"
import { nextTick } from "vue"
import { describe, expect, it } from "rstack/test"
import { DitherCommand } from "@dither-kit"

const items = [{ value: "button", label: "Button" }]
async function typed(slots: Record<string, unknown> = {}) {
  const w = mount(DitherCommand, { props: { open: true, items, empty: "None." }, slots, attachTo: document.body })
  await nextTick()
  const input = document.body.querySelector<HTMLInputElement>('input[role="combobox"], input')!
  input.value = "  zz  "
  input.dispatchEvent(new Event("input"))
  await nextTick()
  return w
}

describe("the command palette's empty state", () => {
  it("shows the empty line when nothing matches", async () => {
    const w = await typed()
    expect(document.body.textContent).toContain("None.")
    w.unmount()
  })
  it("draws the empty slot instead, given the trimmed query", async () => {
    const w = await typed({ empty: ({ query }: { query: string }) => `No “${query}” here.` })
    expect(document.body.textContent).toContain("No “zz” here.")
    expect(document.body.textContent).not.toContain("None.")
    w.unmount()
  })
})
