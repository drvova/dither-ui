import { describe, expect, it } from "rstack/test"
import { modKey } from "@/shared/lib"

// A shortcut reads as the reader's keyboard writes it: never ⌘ on a PC.
describe("modKey", () => {
  it("writes ⌘ on Apple keyboards and Ctrl elsewhere", () => {
    expect(modKey("K", true)).toBe("⌘K")
    expect(modKey("K", false)).toBe("Ctrl K")
    expect(modKey("↵", false)).toBe("Ctrl ↵")
  })
})
