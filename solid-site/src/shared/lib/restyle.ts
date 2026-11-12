// The reader's styling system: the rewriter (`@/shared/lib/restyle-rewrite`,
// shared with the Vue site) and the reader's choice among the systems, kept
// across visits. The stored choice is read on first use in a browser, never
// while rendering on a server.
import { createSignal } from "solid-js"
import { isStyling, type Styling } from "@/shared/lib/restyle-rewrite"
import { storage } from "@/shared/lib/storage"

export * from "@/shared/lib/restyle-rewrite"

const STORAGE_KEY = "dither-styling"
const [chosen, setChosen] = createSignal<Styling>("tailwind")
let restored = false

/** Read the stored choice once: call from `onMount` where the choice shows. */
export function restoreStyling(): void {
  if (restored || typeof window === "undefined") return
  restored = true
  const v = storage.get(STORAGE_KEY)
  if (isStyling(v)) setChosen(v)
}

/** The reader's styling system: one choice for the docs and the Studio. */
export const styling = chosen

export function setStyling(next: Styling): void {
  restored = true
  setChosen(next)
  storage.set(STORAGE_KEY, next)
}
