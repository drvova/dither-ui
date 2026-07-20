<script lang="ts" module>
  import { getContext, setContext } from "svelte"

  export type SidebarVariant = "default" | "floating" | "inset" | "washed"
  export type SidebarCollapse = "rail" | "hide" | "none"
  export type SidebarDensity = "default" | "compact"

  // Svelte 5 reactive context: live getters replace Vue's two injected `Ref`s.
  // `collapsed` is true while the sidebar shows its icon rail (items fold labels);
  // `compact` mirrors density="compact".
  export type SidebarContext = {
    readonly collapsed: boolean
    readonly compact: boolean
  }
  const SIDEBAR_KEY = Symbol("dither-sidebar")

  export function setSidebar(ctx: SidebarContext): void {
    setContext(SIDEBAR_KEY, ctx)
  }
  export function useSidebar(): SidebarContext {
    return getContext<SidebarContext>(SIDEBAR_KEY) ?? { collapsed: false, compact: false }
  }
</script>

<script lang="ts">
  import type { Snippet } from "svelte"
  import DitherGradient from "./DitherGradient.svelte"
  import { cn } from "../runtime/lib"
  import type { PixelColor } from "../engine/pixel"

  type Props = {
    /** Collapsed state (bindable). Meaning depends on `collapse` mode. */
    collapsed?: boolean
    label?: string
    /** default: edge panel · floating: detached card · inset: bare · washed: dither gradient chrome. */
    variant?: SidebarVariant
    /** Which edge it sits on — flips the border. */
    side?: "left" | "right"
    /** rail: folds to icons · hide: folds away entirely · none: no toggle. */
    collapse?: SidebarCollapse
    /** compact tightens rows — dense trees, inspector panels. */
    density?: SidebarDensity
    /** Hide the built-in rail toggle (permanent rail: collapse="rail" + collapsed=true). */
    toggle?: boolean
    /** Wash color for variant="washed". */
    washColor?: PixelColor
    class?: string
    header?: Snippet
    children?: Snippet
    footer?: Snippet
  }

  let {
    collapsed = $bindable(false),
    label = "Sidebar",
    variant = "default",
    side = "left",
    collapse = "rail",
    density = "default",
    toggle = true,
    washColor = "blue",
    class: className,
    header,
    children,
    footer,
  }: Props = $props()

  /** Items only fold labels in rail mode — a hidden sidebar keeps full labels. */
  const railCollapsed = $derived(collapse === "rail" && collapsed)
  setSidebar({
    get collapsed() {
      return railCollapsed
    },
    get compact() {
      return density === "compact"
    },
  })

  const hidden = $derived(collapse === "hide" && collapsed)
  const width = $derived(
    hidden ? "w-0 overflow-hidden border-transparent p-0" : railCollapsed ? "w-14" : "w-56"
  )
  const chrome = $derived.by(() => {
    if (variant === "floating")
      return "m-2 h-[calc(100%-1rem)] rounded-lg border border-border/60 bg-card/50"
    if (variant === "inset") return "bg-transparent"
    const edge = side === "right" ? "border-l" : "border-r"
    if (variant === "washed") return `relative isolate overflow-hidden ${edge} border-border/60`
    return `${edge} border-border/60 bg-background/40`
  })
</script>

<aside
  aria-label={label}
  class={cn(
    "flex h-full shrink-0 flex-col p-2 transition-[width] duration-200 motion-reduce:transition-none",
    chrome,
    width,
    className
  )}
>
  {#if variant === "washed" && !hidden}
    <DitherGradient from={washColor} to="transparent" direction="up" opacity={0.12} cell={4} class="-z-10" />
  {/if}
  {@render header?.()}
  <nav class="mt-2 grid min-h-0 flex-1 content-start gap-0.5 overflow-y-auto">
    {@render children?.()}
  </nav>
  {@render footer?.()}
  {#if collapse === "rail" && toggle}
    <button
      type="button"
      class="mt-2 flex h-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      aria-label={railCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!railCollapsed}
      onclick={() => (collapsed = !collapsed)}
    >
      <span class="text-[13px]" aria-hidden="true"
        >{railCollapsed
          ? side === "right"
            ? "‹"
            : "›"
          : side === "right"
            ? "›"
            : "‹"}</span
      >
    </button>
  {/if}
</aside>
