<script lang="ts" module>
  import type { PixelColor } from "../engine/pixel"

  export type WalletAccount = {
    value: string
    label: string
    address: string
    balance: number
    /** Percent change; sign picks the pill color. */
    change?: number
    color?: PixelColor
  }
  export type WalletAction = "send" | "deposit" | "swap" | "buy"

  const ACTIONS: { name: WalletAction; glyph: string; label: string }[] = [
    { name: "send", glyph: "↑", label: "Send" },
    { name: "deposit", glyph: "↓", label: "Deposit" },
    { name: "swap", glyph: "⇄", label: "Swap" },
    { name: "buy", glyph: "+", label: "Buy" },
  ]
  const FMT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const MASK = "*******"
</script>

<script lang="ts">
  import { untrack } from "svelte"
  import { fly, scale } from "svelte/transition"
  import { cssColor } from "../engine/palette"
  import { pixelPrefersReducedMotion } from "../engine/pixel"
  import { CONTROL_BUTTON } from "../runtime/control"
  import { cn } from "../runtime/lib"

  /** Wallet overview card — the account switcher and search morph open from
   * their triggers (the search panel lists recent queries), the balance
   * cascades in with a change pill and privacy toggle, the address copies with
   * feedback, a bell carries an unread pulse, and the four actions report
   * through one callback. Explicit balance/change props override the active
   * account's numbers. */
  type Props = {
    accounts: WalletAccount[]
    /** Selected account value (bindable). */
    value?: string
    /** Override the active account's balance. */
    balance?: number
    /** Override the active account's change. */
    change?: number
    currency?: string
    /** Start with the balance masked. */
    defaultHidden?: boolean
    searchPlaceholder?: string
    /** Recent queries listed in the morphed-open search panel. */
    recent?: string[]
    /** Show an unread pulse on the bell. */
    notifications?: boolean
    color?: PixelColor
    class?: string
    onaction?: (name: WalletAction) => void
    /** Live query text on every keystroke. */
    onsearch?: (query: string) => void
    /** Committed query — Enter or a recent row. */
    onsubmit?: (query: string) => void
    onnotify?: () => void
  }
  let {
    accounts,
    value = $bindable(),
    balance,
    change: changeProp,
    currency = "$",
    defaultHidden = false,
    searchPlaceholder = "Search…",
    recent,
    notifications = false,
    color = "green",
    class: className,
    onaction,
    onsearch,
    onsubmit,
    onnotify,
  }: Props = $props()

  const rm = pixelPrefersReducedMotion()

  let rootEl = $state<HTMLElement | null>(null)
  let switcherEl = $state<HTMLButtonElement | null>(null)
  let switching = $state(false)
  let searching = $state(false)
  let hidden = $state(untrack(() => defaultHidden))
  let copied = $state(false)
  let query = $state("")

  const account = $derived(accounts.find((a) => a.value === value) ?? accounts[0])
  const shownBalance = $derived(balance ?? account?.balance ?? 0)
  const change = $derived(changeProp ?? account?.change ?? 0)
  const digits = $derived(
    hidden ? MASK.split("") : `${currency}${FMT.format(shownBalance)}`.split("")
  )
  const changeColor = $derived(cssColor(change < 0 ? "red" : "green"))
  const shortAddress = $derived.by(() => {
    const a = account?.address ?? ""
    return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
  })

  function onOutside(e: PointerEvent) {
    if (!switching && !searching) return
    if (rootEl?.contains(e.target as Node)) return
    switching = false
    searching = false
  }
  function onWindowKey(e: KeyboardEvent) {
    if (e.key !== "Escape" || (!switching && !searching)) return
    if (switching) switcherEl?.focus()
    switching = false
    searching = false
  }

  function pick(v: string) {
    value = v
    switching = false
    switcherEl?.focus()
  }
  // Input mount = search just morphed open; grab focus.
  function focusOnMount(node: HTMLInputElement) {
    requestAnimationFrame(() => node.focus())
  }
  function submitSearch(q?: string) {
    if (q !== undefined) query = q
    onsubmit?.(query)
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(account?.address ?? "")
      copied = true
      setTimeout(() => {
        copied = false
      }, 1400)
    } catch {
      copied = false
    }
  }
</script>

<svelte:window onpointerdown={onOutside} onkeydown={onWindowKey} />

<div
  bind:this={rootEl}
  class={cn("relative w-80 rounded-xl border border-border/70 bg-card/80 p-4 font-mono select-none", className)}
>
  <div class="flex items-center justify-between gap-2">
    <button
      bind:this={switcherEl}
      type="button"
      aria-expanded={switching}
      aria-haspopup="listbox"
      class={cn(
        CONTROL_BUTTON,
        "flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-background"
      )}
      onclick={() => {
        switching = !switching
        searching = false
      }}
    >
      <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full" style:background={cssColor(account?.color ?? color)}></span>
      <span class="truncate">{account?.label}</span>
      <span
        aria-hidden="true"
        class="text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none {switching ? 'rotate-180' : ''}"
      >
        ▾
      </span>
    </button>
    <div class="flex shrink-0 items-center gap-1">
      <div
        class="flex h-8 items-center overflow-hidden rounded-md border border-border/60 bg-background/60 transition-[width] duration-200 ease-out motion-reduce:transition-none"
        style:width={searching ? "148px" : "32px"}
      >
        {#if !searching}
          <button
            type="button"
            aria-label="Search wallet"
            class={cn(CONTROL_BUTTON, "grid size-8 shrink-0 place-items-center text-[13px] text-muted-foreground transition-colors hover:text-foreground")}
            onclick={() => (searching = true)}
          >
            ⌕
          </button>
        {:else}
          <span aria-hidden="true" class="pl-2.5 text-[13px] text-muted-foreground">⌕</span>
          <input
            bind:value={query}
            use:focusOnMount
            type="text"
            aria-label="Search wallet"
            placeholder={searchPlaceholder}
            class="w-full bg-transparent px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
            oninput={() => onsearch?.(query)}
            onkeydown={(e) => {
              if (e.key === "Enter") submitSearch()
            }}
          />
        {/if}
      </div>
      <button
        type="button"
        aria-label="Notifications"
        class={cn(CONTROL_BUTTON, "relative grid size-8 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px] text-muted-foreground transition-colors hover:text-foreground")}
        onclick={() => onnotify?.()}
      >
        ⍾
        {#if notifications}
          <span aria-hidden="true" class="absolute top-1.5 right-1.5 flex size-1.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style:background={cssColor(color)}></span>
            <span class="relative inline-flex size-1.5 rounded-full" style:background={cssColor(color)}></span>
          </span>
        {/if}
      </button>
    </div>
  </div>

  {#if switching}
    <ul
      role="listbox"
      aria-label="Accounts"
      class="absolute top-12 left-4 z-20 min-w-44 origin-top-left rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      transition:scale={{ duration: rm ? 0 : 160, start: 0.85 }}
    >
      {#each accounts as a (a.value)}
        <li>
          <button
            type="button"
            role="option"
            aria-selected={a.value === account?.value}
            class={cn(
              CONTROL_BUTTON,
              "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-background/60",
              a.value === account?.value ? "text-foreground" : "text-muted-foreground"
            )}
            onclick={() => pick(a.value)}
          >
            <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full" style:background={cssColor(a.color ?? color)}></span>
            <span class="min-w-0 flex-1 truncate">{a.label}</span>
            {#if a.value === account?.value}<span aria-hidden="true">✓</span>{/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if searching && recent?.length && !query}
    <div
      class="absolute top-12 right-14 z-20 min-w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      transition:scale={{ duration: rm ? 0 : 160, start: 0.85 }}
    >
      <div class="px-2.5 pt-1 pb-0.5 text-[9px] tracking-[0.2em] text-muted-foreground/70 uppercase">Recent</div>
      {#each recent as r (r)}
        <button
          type="button"
          class={cn(CONTROL_BUTTON, "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground")}
          onclick={() => submitSearch(r)}
        >
          <span aria-hidden="true" class="text-[11px]">⌕</span>
          <span class="min-w-0 flex-1 truncate">{r}</span>
        </button>
      {/each}
    </div>
  {/if}

  <div class="mt-5 flex flex-col items-center text-center">
    <div class="flex items-center gap-1.5">
      <span class="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Balance</span>
      <button
        type="button"
        aria-pressed={hidden}
        aria-label={hidden ? "Show balance" : "Hide balance"}
        class="text-[11px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
        onclick={() => (hidden = !hidden)}
      >
        {hidden ? "◒" : "◉"}
      </button>
    </div>
    <div class="mt-1 flex text-[24px] leading-none text-foreground" aria-live="polite">
      {#each digits as c, i (`${account?.value}-${hidden}-${i}-${c}`)}
        <span in:fly={{ y: rm ? 0 : 8, duration: rm ? 0 : 260, delay: rm ? 0 : i * 36 }}>{c}</span>
      {/each}
    </div>
    <div class="mt-1.5 flex h-6 items-center justify-center">
      {#if hidden}
        <span class="translate-y-[2px] text-[12px] leading-none tracking-[0.3em] text-muted-foreground" aria-hidden="true">*****</span>
      {:else}
        <span class="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px]" style:color={changeColor}>
          <span aria-hidden="true" class="absolute inset-0 opacity-15" style:background={changeColor}></span>
          <span class="relative flex items-center gap-1">
            <span aria-hidden="true" class="size-1 animate-pulse rounded-full motion-reduce:animate-none" style:background={changeColor}></span>
            {change < 0 ? "▼" : "▲"} {Math.abs(change).toFixed(1)}%
          </span>
        </span>
      {/if}
    </div>
    <button
      type="button"
      aria-label={copied ? "Address copied" : "Copy address"}
      class={cn(CONTROL_BUTTON, "mt-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground")}
      onclick={copy}
    >
      <span>{shortAddress}</span>
      <span aria-hidden="true" style:color={copied ? cssColor(color) : undefined}>{copied ? "✓" : "⧉"}</span>
    </button>
  </div>

  <div class="mt-4 grid grid-cols-4 gap-2">
    {#each ACTIONS as a (a.name)}
      <button
        type="button"
        class={cn(CONTROL_BUTTON, "flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 py-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground")}
        onclick={() => onaction?.(a.name)}
      >
        <span aria-hidden="true" class="text-[14px]" style:color={cssColor(color)}>{a.glyph}</span>
        <span class="text-[10px]">{a.label}</span>
      </button>
    {/each}
  </div>
</div>
