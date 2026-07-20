// Public API for Dither Kit (Svelte 5). Mirrors the Vue kit's surface as the
// port lands in batches — this bootstrap covers the canonical patterns:
// a canvas background (Aurora), a CSS text effect (ShinyText), a native canvas
// control (DitherButton), and a context/DI field pair (DitherField/DitherInput).

export { default as Aurora, type AuroraParams } from "./Aurora.svelte"
export { default as ShinyText } from "./ShinyText.svelte"
export {
  default as DitherButton,
  type ButtonVariant,
  type DitherRenderMode,
  type PrecompiledDither,
} from "./DitherButton.svelte"
export { default as DitherField } from "./DitherField.svelte"
export { default as DitherInput } from "./DitherInput.svelte"

// Shared runtime + tokens (also portable on their own).
export { ditherBackground, type DitherBackgroundParams } from "./use-dither-background"
export { CONTROL, CONTROL_BUTTON, POPOVER, setField, useField, type FieldContext } from "./control"

// Engine primitives are framework-agnostic and copied verbatim from the Vue
// kit; import them from their deep paths (e.g. "dither-kit-svelte/palette") to
// avoid barrel name collisions. Only the className helper is surfaced here.
export { cn } from "./lib"
