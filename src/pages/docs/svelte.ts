// Docs framework toggle, and a snippet as the reader reads it. The Vue →
// Svelte translation itself is `svelte-code.ts` (framework-free).
import { computed, ref } from "vue"
import { restyle, type Styling, styling, STYLINGS } from "@/shared/lib/restyle"
import { storage } from "@/shared/lib/storage"
import { toSvelteCode } from "./svelte-code"

export { toSvelteCode }

export type DocsFramework = "vue" | "svelte"

const STORAGE_KEY = "dither-docs-framework"

export const docsFramework = ref<DocsFramework>(storage.get(STORAGE_KEY) === "svelte" ? "svelte" : "vue")

export function setDocsFramework(next: DocsFramework) {
  docsFramework.value = next
  storage.set(STORAGE_KEY, next)
}

// ---- the reader's styling system ------------------------------------------

/** The styling systems a snippet can be written in for the current framework:
 * CSS Modules are a Vue SFC feature, so Svelte readers get the other three. */
export const docsStylings = computed<readonly Styling[]>(() =>
  STYLINGS.filter((s) => s !== "modules" || docsFramework.value === "vue"),
)

/** The styling system the snippets are shown in — the preference, or CSS
 * while it names CSS Modules under Svelte. */
export const docsStyling = computed<Styling>(() =>
  styling.value === "modules" && docsFramework.value === "svelte" ? "css" : styling.value,
)

/** A Vue docs snippet as the reader reads it: their framework, their styling system. */
export function docsCode(vue: string): string {
  const framework = docsFramework.value
  return restyle(framework === "svelte" ? toSvelteCode(vue) : vue, docsStyling.value, framework)
}
