// The reader's styling system: the rewriter (`restyle-rewrite.ts`, where
// `restyle` lives) and the reader's choice among the systems, kept across
// visits.
import { ref } from "vue"
import { isStyling, type Styling } from "./restyle-rewrite"
import { storage } from "./storage"

export * from "./restyle-rewrite"

/* ------------------------------ the preference ---------------------------- */

const STORAGE_KEY = "dither-styling"
const stored = (): Styling => {
  const v = storage.get(STORAGE_KEY)
  return isStyling(v) ? v : "tailwind"
}

/** The reader's styling system — one choice for the docs and the Studio. */
export const styling = ref<Styling>(stored())

export function setStyling(next: Styling): void {
  styling.value = next
  storage.set(STORAGE_KEY, next)
}
