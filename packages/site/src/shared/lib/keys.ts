/** What a browser says of the machine it runs on. */
type Machine = { platform?: string; userAgent?: string; userAgentData?: { platform?: string } }

/** Whether the keyboard is an Apple one, which says ⌘ where the rest say
 * Ctrl. The platform where the browser names it (a Mac, an iPhone; an iPad
 * says "MacIntel" or "iPad"), else its agent: a browser that hides the
 * platform, or one on an iPad that names its host's, still carries the
 * device in its agent string. */
export function isApple(machine: Machine | undefined): boolean {
  if (!machine) return false
  const platform = machine.userAgentData?.platform || machine.platform || ""
  return /mac|iphone|ipad|ipod/i.test(platform) || /\b(iPhone|iPad|iPod|Macintosh)\b/.test(machine.userAgent ?? "")
}

const APPLE = isApple(typeof navigator === "undefined" ? undefined : (navigator as Machine))

/** A shortcut as this keyboard writes it: "⌘K" on Apple, "Ctrl K" elsewhere. */
export const modKey = (key: string, apple = APPLE) => (apple ? `⌘${key}` : `Ctrl ${key}`)

/** The fields that keep the keys they are given: any `<input>` (a text
 * box's letters, a checkbox's Space, a range's arrows), a `<textarea>`, a
 * `<select>` (its arrows, letters and Space choose) and anything
 * `contenteditable`. While one has focus no page or canvas shortcut
 * answers. A button, a menu's items included, is not a field: a menu's
 * arrows and the shortcuts answer over it. Read by tag, not `instanceof`,
 * so an element of another frame reads the same. */
export function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null
  if (!el || typeof el.tagName !== "string") return false
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable === true
}
