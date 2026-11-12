// Docs framework toggle, and a snippet as the reader reads it. Snippets are
// authored once, in Vue's notation; the reader of this site sees them in
// Solid (`solid.ts`) or Svelte (`@/pages/docs/svelte-code`), never in Vue.
// The stored choice is read on first use in a browser, never while
// rendering on a server.
import { createSignal } from "solid-js"
import { toSvelteCode } from "@/pages/docs/svelte-code"
import { storage } from "@/shared/lib/storage"
import {
  restoreStyling,
  restyle,
  restyleSolid,
  type Sheet,
  type Styling,
  styling,
  STYLINGS,
} from "~/shared/lib/restyle"
import { toSolidCode } from "./solid"

export { toSolidCode, toSvelteCode }

export type DocsFramework = "solid" | "svelte"

const STORAGE_KEY = "dither-docs-framework"
const [chosen, setChosen] = createSignal<DocsFramework>("solid")
let restored = false

/** Read the stored choices (framework and styling system) once: call from
 * `onMount` where they show. */
export function restoreDocsFramework(): void {
  restoreStyling()
  if (restored || typeof window === "undefined") return
  restored = true
  if (storage.get(STORAGE_KEY) === "svelte") setChosen("svelte")
}

/** The reader's framework: one choice for every code tab. */
export const docsFramework = chosen

export function setDocsFramework(next: DocsFramework) {
  restored = true
  setChosen(next)
  storage.set(STORAGE_KEY, next)
}

// ---- the reader's styling system ------------------------------------------

/** The styling systems a snippet can be written in for the current framework:
 * a Svelte component has no CSS Modules, so Svelte readers get the other three. */
export const docsStylings = (): readonly Styling[] => STYLINGS.filter((s) => s !== "modules" || chosen() === "solid")

/** The styling system the snippets are shown in: the preference, or CSS
 * while it names CSS Modules under Svelte. */
export const docsStyling = (): Styling => (styling() === "modules" && chosen() === "svelte" ? "css" : styling())

/** An authored docs snippet as the reader reads it: their framework, their
 * styling system (a Solid file's stylesheet under it, named). */
export function docsCode(vue: string): string {
  const framework = chosen()
  return restyle(framework === "svelte" ? toSvelteCode(vue) : toSolidCode(vue), docsStyling(), framework)
}

/** The same snippet as the files the reader takes: the code, and the
 * stylesheet a Solid file imports on CSS or CSS Modules, named after it. */
export function docsFiles(vue: string, name?: string): { code: string; sheet: Sheet | null } {
  if (chosen() === "solid") return restyleSolid(toSolidCode(vue), docsStyling(), name)
  return { code: restyle(toSvelteCode(vue), docsStyling(), "svelte"), sheet: null }
}
