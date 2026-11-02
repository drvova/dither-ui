/** Apple keyboards say ⌘ where the rest say Ctrl. */
const APPLE = typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform)

/** A shortcut as this keyboard writes it: "⌘K" on Apple, "Ctrl K" elsewhere. */
export const modKey = (key: string, apple = APPLE) => (apple ? `⌘${key}` : `Ctrl ${key}`)
