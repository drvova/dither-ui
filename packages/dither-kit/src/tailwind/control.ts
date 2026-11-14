export const CONTROL =
  "min-h-10 rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-[13px] text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-placeholder hover:border-foreground/25 focus-visible:border-ring disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"
/** A field drawn invalid keeps its edge in the signal ink as it takes focus
 * (the edge is its style, which no focus class outranks): focus rings it in
 * the ring ink instead. */
export const CONTROL_INVALID = "focus-visible:ring-1 focus-visible:ring-ring"
export const CONTROL_BUTTON =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40"
export const POPOVER = "rounded-lg border border-border/80 bg-card shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
