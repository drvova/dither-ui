import { inject, type InjectionKey, type Ref } from "vue"

export const CONTROL = "min-h-10 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/60 hover:border-foreground/25 focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/20 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
export const CONTROL_BUTTON = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
export const POPOVER = "rounded-lg border border-border/80 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.32)]"

export type FieldContext = {
  controlId: Ref<string>
  describedBy: Ref<string | undefined>
  invalid: Ref<boolean>
}

export const FIELD_CONTEXT: InjectionKey<FieldContext> = Symbol("dither-field")
export const useField = () => inject(FIELD_CONTEXT, null)
