// The reader's styling system: the rewriter (the `restyle` package,
// framework free) and the reader's choice among the systems, kept
// across visits. The stored choice is read on first use in a browser, never
// while rendering on a server.
import { createSignal } from "solid-js"
import { isStyling, type Styling } from "@dither-ui/restyle"
import { storage } from "@/shared/lib/storage"
import { STORAGE_KEYS } from "@/shared/config/storage"

export * from "@dither-ui/restyle"

const [chosen, setChosen] = createSignal<Styling>("tailwind")
let restored = false

/** Read the stored choice once: call from `onMount` where the choice shows. */
export function restoreStyling(): void {
  if (restored || typeof window === "undefined") return
  restored = true
  const v = storage.get(STORAGE_KEYS.styling)
  if (isStyling(v)) setChosen(v)
}

/** The reader's styling system: one choice for the docs and the Studio. */
export const styling = chosen

export function setStyling(next: Styling): void {
  restored = true
  setChosen(next)
  storage.set(STORAGE_KEYS.styling, next)
}
