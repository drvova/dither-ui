import { describe, expect, it } from "rstack/test"
import { isApple, modKey } from "@/shared/lib/keys"

// A shortcut reads as the reader's keyboard writes it: never ⌘ on a PC.
describe("modKey", () => {
  it("writes ⌘ on Apple keyboards and Ctrl elsewhere", () => {
    expect(modKey("K", true)).toBe("⌘K")
    expect(modKey("K", false)).toBe("Ctrl K")
    expect(modKey("↵", false)).toBe("Ctrl ↵")
  })

  it("knows an Apple keyboard by the platform, and an iPad or iPhone by its agent where the platform is the host's", () => {
    const ipad =
      "Mozilla/5.0 (iPad; CPU OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1"
    const ipadDesktop =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15"
    expect(isApple({ platform: "MacIntel", userAgent: ipadDesktop })).toBe(true)
    expect(isApple({ platform: "iPad", userAgent: ipad })).toBe(true)
    // a browser on an iPad that names no platform, or another's
    expect(isApple({ platform: "", userAgent: ipad })).toBe(true)
    expect(isApple({ platform: "Linux x86_64", userAgent: ipad })).toBe(true)
    expect(isApple({ userAgentData: { platform: "macOS" }, userAgent: "" })).toBe(true)
    // a PC, an Android tablet and no browser at all
    expect(isApple({ platform: "Win32", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" })).toBe(false)
    expect(isApple({ platform: "Linux armv8l", userAgent: "Mozilla/5.0 (Linux; Android 14; SM-X710)" })).toBe(false)
    expect(isApple(undefined)).toBe(false)
  })
})
