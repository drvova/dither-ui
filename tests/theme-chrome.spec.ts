// @rstest-environment jsdom
// The browser's chrome (iOS Safari's bar) follows the theme the reader
// picks, not the system's scheme: every theme-color the page declares takes
// the page's ground as the theme turns.
import { mount } from "@vue/test-utils"
import { defineComponent } from "vue"
import { describe, expect, it } from "rstack/test"
import { useTheme } from "../src/shared/lib/useTheme"

describe("theme chrome", () => {
  it("tints every theme-color with the page's ground on mount and on a toggle", () => {
    document.head.innerHTML = `
      <meta name="theme-color" content="#08090b" media="(prefers-color-scheme: dark)" />
      <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />`
    document.body.style.backgroundColor = "rgb(8, 9, 11)"
    let theme!: ReturnType<typeof useTheme>
    const w = mount(
      defineComponent({
        setup() {
          theme = useTheme()
          return () => null
        },
      }),
    )
    const tints = () =>
      [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].map((m) => m.content)
    expect(tints()).toEqual(["rgb(8, 9, 11)", "rgb(8, 9, 11)"])
    document.body.style.backgroundColor = "rgb(255, 255, 255)"
    theme.toggle()
    expect(tints()).toEqual(["rgb(255, 255, 255)", "rgb(255, 255, 255)"])
    w.unmount()
  })
})
