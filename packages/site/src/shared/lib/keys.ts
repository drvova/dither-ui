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
