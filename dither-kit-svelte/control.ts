import { getContext, setContext } from "svelte"

export const CONTROL =
  "min-h-10 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
export const CONTROL_BUTTON =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
export const POPOVER = "rounded-lg border border-border/80 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.32)]"

/**
 * Field context read by native controls. Svelte 5 replaces Vue's `Ref` with
 * live getters — a provider exposes `{ get controlId() { ... } }` backed by
 * `$derived`, so consumers read a reactive value without unwrapping `.value`.
 */
export type FieldContext = {
  readonly controlId: string
  readonly describedBy: string | undefined
  readonly invalid: boolean
}

const FIELD_KEY = Symbol("dither-field")

export function setField(ctx: FieldContext): void {
  setContext(FIELD_KEY, ctx)
}

export function useField(): FieldContext | null {
  return getContext<FieldContext>(FIELD_KEY) ?? null
}
