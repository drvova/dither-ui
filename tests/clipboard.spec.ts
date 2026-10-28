// @rstest-environment jsdom
import { describe, expect, it, rs } from "rstack/test"
import { copyText } from "../dither-kit/engine/copy-text"

const clipboard = (value: unknown) => Object.defineProperty(navigator, "clipboard", { value, configurable: true })

describe("copyText", () => {
  it("uses the async clipboard when it exists", async () => {
    const writeText = rs.fn(async () => {})
    clipboard({ writeText })
    expect(await copyText("hi")).toBe(true)
    expect(writeText).toHaveBeenCalledWith("hi")
  })

  it("falls back to the selection path when the clipboard is missing or refuses, and cleans up", async () => {
    clipboard(undefined)
    const exec = rs.fn(() => true)
    ;(document as Document & { execCommand: typeof exec }).execCommand = exec
    expect(await copyText("legacy")).toBe(true)
    expect(exec).toHaveBeenCalledWith("copy")
    expect(document.querySelector("textarea")).toBeNull()
    clipboard({
      writeText: async () => {
        throw new Error("denied")
      },
    })
    exec.mockReturnValue(false)
    expect(await copyText("denied")).toBe(false)
  })
})
