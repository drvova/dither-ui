import { createEffect, createMemo, createSignal, For, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { copyText } from "../engine/copy-text"
import { cssColor } from "../engine/palette"
import type { PixelColor } from "../engine/pixel"
import { CONTROL_BUTTON } from "../tailwind/control"
import { cn } from "../tailwind/lib"
import { Presence } from "./runtime/presence"
import "./WalletCard.css"

/** The change pill's ground: its own colour at this share over the card,
 * light enough that the change, printed in that colour, reads at 4.5:1 in
 * the light theme's deeper swatches. */
export const CHANGE_TINT = 0.1

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

/** Wallet overview card — the account switcher and search morph open from
 * their triggers (the search panel lists recent queries), the balance
 * cascades in with a change pill and privacy toggle, the address copies with
 * feedback, a bell carries an unread pulse, and the four actions report
 * through one event. Explicit balance/change props override the active
 * account's numbers. */
export type WalletCardProps = {
  accounts: WalletAccount[]
  modelValue?: string
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
  onUpdateModelValue?: (value: string) => void
  onAction?: (name: WalletAction) => void
  /** Live query text on every keystroke. */
  onSearch?: (query: string) => void
  /** Committed query — Enter or a recent row. */
  onSubmit?: (query: string) => void
  onNotify?: () => void
}

export default function WalletCard(raw: WalletCardProps) {
  const props = mergeProps(
    {
      currency: "$",
      defaultHidden: false,
      searchPlaceholder: "Search…",
      notifications: false,
      color: "green" as PixelColor,
    },
    raw,
  )

  const account = createMemo(() => props.accounts.find((a) => a.value === props.modelValue) ?? props.accounts[0])
  let root: HTMLDivElement | undefined
  let switcher: HTMLButtonElement | undefined
  let searchInput: HTMLInputElement | undefined
  const [switching, setSwitching] = createSignal(false)
  const [searching, setSearching] = createSignal(false)
  const [hidden, setHidden] = createSignal(props.defaultHidden)
  const [copied, setCopied] = createSignal(false)
  const [query, setQuery] = createSignal("")

  const shownBalance = createMemo(() => props.balance ?? account()?.balance ?? 0)
  const change = createMemo(() => props.change ?? account()?.change ?? 0)
  const digits = createMemo(() =>
    hidden() ? MASK.split("") : `${props.currency}${FMT.format(shownBalance())}`.split(""),
  )
  /** One key a digit: a place whose figure, account or masking changed is a
   * new element, so it rises in again; the rest stay. Its last character is
   * the digit. */
  const digitKeys = createMemo(() => digits().map((c, i) => `${account()?.value}-${hidden()}-${i}-${c}`))
  const changeColor = createMemo(() => cssColor(change() < 0 ? "red" : "green"))
  const shortAddress = createMemo(() => {
    const a = account()?.address ?? ""
    return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
  })

  function onOutside(e: PointerEvent) {
    if (root?.contains(e.target as Node)) return
    setSwitching(false)
    setSearching(false)
  }
  function onKey(e: KeyboardEvent) {
    if (e.key !== "Escape") return
    if (switching()) switcher?.focus()
    setSwitching(false)
    setSearching(false)
  }
  onMount(() => {
    let timer = 0
    createEffect(
      on(
        [switching, searching],
        ([a, b]) => {
          clearTimeout(timer)
          window.removeEventListener("pointerdown", onOutside)
          window.removeEventListener("keydown", onKey)
          if (a || b) {
            // defer so the opening click doesn't immediately close it
            timer = window.setTimeout(() => {
              window.addEventListener("pointerdown", onOutside)
              window.addEventListener("keydown", onKey)
            }, 0)
          }
        },
        { defer: true },
      ),
    )
    onCleanup(() => {
      clearTimeout(timer)
      window.removeEventListener("pointerdown", onOutside)
      window.removeEventListener("keydown", onKey)
    })
  })

  function pick(value: string) {
    props.onUpdateModelValue?.(value)
    setSwitching(false)
    switcher?.focus()
  }
  function openSearch() {
    setSearching(true)
    queueMicrotask(() => searchInput?.focus())
  }
  function type() {
    props.onSearch?.(query())
  }
  function submitSearch(q?: string) {
    if (q !== undefined) setQuery(q)
    props.onSubmit?.(query())
  }
  async function copy() {
    setCopied(await copyText(account()?.address ?? ""))
    if (copied())
      setTimeout(() => {
        setCopied(false)
      }, 1400)
  }

  return (
    <div
      ref={(el) => (root = el)}
      class={cn("relative w-80 rounded-xl border border-border/70 bg-card/80 p-4 font-mono select-none", props.class)}
    >
      <div class="flex items-center justify-between gap-2">
        <button
          ref={(el) => (switcher = el)}
          type="button"
          aria-expanded={switching()}
          aria-haspopup="listbox"
          class={cn(
            CONTROL_BUTTON,
            "flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-background",
          )}
          onClick={() => {
            setSwitching(!switching())
            setSearching(false)
          }}
        >
          <span
            aria-hidden="true"
            class="size-1.5 shrink-0 rounded-full"
            style={{ background: cssColor(account()?.color ?? props.color) }}
          />
          <span class="truncate">{account()?.label}</span>
          <span
            aria-hidden="true"
            class="text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none"
            classList={{ "rotate-180": switching() }}
          >
            ▾
          </span>
        </button>
        <div class="flex shrink-0 items-center gap-1">
          <div
            class="flex h-8 items-center overflow-hidden rounded-md border border-border/60 bg-background/60 transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: searching() ? "148px" : "32px" }}
          >
            <Show
              when={!searching()}
              fallback={
                <>
                  <span aria-hidden="true" class="pl-2.5 text-[13px] text-muted-foreground">
                    ⌕
                  </span>
                  <input
                    ref={(el) => (searchInput = el)}
                    value={query()}
                    type="text"
                    aria-label="Search wallet"
                    placeholder={props.searchPlaceholder}
                    class="w-full bg-transparent px-2 text-[12px] text-foreground outline-none placeholder:text-placeholder"
                    onInput={(e) => {
                      setQuery(e.currentTarget.value)
                      type()
                    }}
                    onKeyDown={(e) => e.key === "Enter" && submitSearch()}
                  />
                </>
              }
            >
              <button
                type="button"
                aria-label="Search wallet"
                class={cn(
                  CONTROL_BUTTON,
                  "grid size-8 shrink-0 place-items-center text-[13px] text-muted-foreground transition-colors hover:text-foreground",
                )}
                onClick={openSearch}
              >
                ⌕
              </button>
            </Show>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            class={cn(
              CONTROL_BUTTON,
              "relative grid size-8 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px] text-muted-foreground transition-colors hover:text-foreground",
            )}
            onClick={() => props.onNotify?.()}
          >
            ⍾
            <Show when={props.notifications}>
              <span aria-hidden="true" class="absolute top-1.5 right-1.5 flex size-1.5">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none"
                  style={{ background: cssColor(props.color) }}
                />
                <span
                  class="relative inline-flex size-1.5 rounded-full"
                  style={{ background: cssColor(props.color) }}
                />
              </span>
            </Show>
          </button>
        </div>
      </div>

      <Presence when={switching()} name="dk-wc-morph">
        <ul
          role="listbox"
          aria-label="Accounts"
          class="absolute top-12 left-4 z-20 min-w-44 origin-top-left rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
        >
          <For each={props.accounts}>
            {(a) => (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={a.value === account()?.value}
                  class={cn(
                    CONTROL_BUTTON,
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-background/60",
                    a.value === account()?.value ? "text-foreground" : "text-muted-foreground",
                  )}
                  onClick={() => pick(a.value)}
                >
                  <span
                    aria-hidden="true"
                    class="size-1.5 shrink-0 rounded-full"
                    style={{ background: cssColor(a.color ?? props.color) }}
                  />
                  <span class="min-w-0 flex-1 truncate">{a.label}</span>
                  <Show when={a.value === account()?.value}>
                    <span aria-hidden="true">✓</span>
                  </Show>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Presence>

      <Presence when={Boolean(searching() && props.recent?.length && !query())} name="dk-wc-morph">
        <div class="absolute top-12 right-14 z-20 min-w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]">
          <div class="px-2.5 pt-1 pb-0.5 text-[9px] tracking-[0.2em] text-muted-foreground uppercase">Recent</div>
          <For each={props.recent}>
            {(r) => (
              <button
                type="button"
                class={cn(
                  CONTROL_BUTTON,
                  "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground",
                )}
                onClick={() => submitSearch(r)}
              >
                <span aria-hidden="true" class="text-[11px]">
                  ⌕
                </span>
                <span class="min-w-0 flex-1 truncate">{r}</span>
              </button>
            )}
          </For>
        </div>
      </Presence>

      <div class="mt-5 flex flex-col items-center text-center">
        <div class="flex items-center gap-1.5">
          <span class="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Balance</span>
          <button
            type="button"
            aria-pressed={hidden()}
            aria-label={hidden() ? "Show balance" : "Hide balance"}
            class="text-[11px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
            onClick={() => setHidden(!hidden())}
          >
            {hidden() ? "◒" : "◉"}
          </button>
        </div>
        <div class="mt-1 flex text-[24px] leading-none text-foreground" aria-live="polite">
          <For each={digitKeys()}>
            {(key, i) => (
              <span class="dk-wc-digit motion-reduce:animate-none" style={{ "animation-delay": `${i() * 36}ms` }}>
                {key.slice(-1)}
              </span>
            )}
          </For>
        </div>
        <div class="mt-1.5 flex h-6 items-center justify-center">
          <Show
            when={hidden()}
            fallback={
              <span
                class="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px]"
                style={{ color: changeColor() }}
              >
                <span
                  aria-hidden="true"
                  class="absolute inset-0"
                  style={{ background: changeColor(), opacity: CHANGE_TINT }}
                />
                <span class="relative flex items-center gap-1">
                  <span
                    aria-hidden="true"
                    class="size-1 animate-pulse rounded-full motion-reduce:animate-none"
                    style={{ background: changeColor() }}
                  />
                  {change() < 0 ? "▼" : "▲"} {Math.abs(change()).toFixed(1)}%
                </span>
              </span>
            }
          >
            <span
              class="translate-y-[2px] text-[12px] leading-none tracking-[0.3em] text-muted-foreground"
              aria-hidden="true"
            >
              *****
            </span>
          </Show>
        </div>
        <button
          type="button"
          aria-label={copied() ? "Address copied" : "Copy address"}
          class={cn(
            CONTROL_BUTTON,
            "mt-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground",
          )}
          onClick={copy}
        >
          <span>{shortAddress()}</span>
          <span aria-hidden="true" style={copied() ? { color: cssColor(props.color) } : undefined}>
            {copied() ? "✓" : "⧉"}
          </span>
        </button>
      </div>

      <div class="mt-4 grid grid-cols-4 gap-2">
        <For each={ACTIONS}>
          {(a) => (
            <button
              type="button"
              class={cn(
                CONTROL_BUTTON,
                "flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 py-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
              )}
              onClick={() => props.onAction?.(a.name)}
            >
              <span aria-hidden="true" class="text-[14px]" style={{ color: cssColor(props.color) }}>
                {a.glyph}
              </span>
              <span class="text-[10px]">{a.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
