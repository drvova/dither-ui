// Generated from @dither-ui/kit/solid/WalletCard.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createEffect, createMemo, createSignal, For, mergeProps, on, onCleanup, onMount, Show } from "solid-js"
import { copyText } from "@dither-ui/kit/engine/copy-text.ts"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import type { PixelColor } from "@dither-ui/kit/engine/pixel.ts"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import "@dither-ui/kit/solid/WalletCard.css"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" },
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "calc(infinity * 1px)" },
  text2: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rotate180: { rotate: "180deg" },
  text3: {
    fontSize: "10px",
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  row2: { display: "flex", flexShrink: "0", alignItems: "center", gap: "0.25rem" },
  row3: {
    display: "flex",
    height: "2rem",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text4: { paddingLeft: "0.625rem", fontSize: "13px", color: "var(--muted-foreground)" },
  input: {
    width: "100%",
    backgroundColor: "transparent",
    paddingInline: "0.5rem",
    fontSize: "12px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
  },
  row4: {
    position: "absolute",
    top: "0.375rem",
    right: "0.375rem",
    display: "flex",
    width: "0.375rem",
    height: "0.375rem",
  },
  row5: {
    position: "absolute",
    display: "inline-flex",
    height: "100%",
    width: "100%",
    animation: {
      default: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    borderRadius: "calc(infinity * 1px)",
    opacity: "60%",
  },
  row6: {
    position: "relative",
    display: "inline-flex",
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
  },
  ul: {
    position: "absolute",
    top: "3rem",
    left: "1rem",
    zIndex: "20",
    minWidth: "11rem",
    transformOrigin: "0 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  text5: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  layer: {
    position: "absolute",
    top: "3rem",
    right: "3.5rem",
    zIndex: "20",
    minWidth: "10rem",
    transformOrigin: "100% 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  box: {
    paddingInline: "0.625rem",
    paddingTop: "0.25rem",
    paddingBottom: "0.125rem",
    fontSize: "9px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  text6: { fontSize: "11px" },
  stack: {
    marginTop: "1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  row7: { display: "flex", alignItems: "center", gap: "0.375rem" },
  text7: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  button: {
    fontSize: "11px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
  },
  row8: {
    marginTop: "0.25rem",
    display: "flex",
    fontSize: "24px",
    lineHeight: "1",
    color: "var(--foreground)",
  },
  text8: { animation: { default: null, "@media (prefers-reduced-motion: reduce)": "none" } },
  row9: {
    marginTop: "0.375rem",
    display: "flex",
    height: "1.5rem",
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "calc(infinity * 1px)",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
  },
  layer2: { position: "absolute", inset: "0px" },
  row10: { position: "relative", display: "flex", alignItems: "center", gap: "0.25rem" },
  text9: {
    width: "0.25rem",
    height: "0.25rem",
    animation: {
      default: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    borderRadius: "calc(infinity * 1px)",
  },
  text10: {
    translate: "0 2px",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "0.3em",
    color: "var(--muted-foreground)",
  },
  grid: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "0.5rem",
  },
  text11: { fontSize: "14px" },
  text12: { fontSize: "10px" },
  frame2: {
    position: "relative",
    width: "20rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    padding: "1rem",
    fontFamily: "var(--font-mono)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  button2: {
    display: "flex",
    minWidth: "0px",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button3: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    fontSize: "13px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button4: {
    position: "relative",
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    fontSize: "13px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button5: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--background) 60%, transparent)",
      },
    },
  },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
  button6: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--background) 60%, transparent)",
      },
    },
  },
  button7: {
    marginTop: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.375rem",
    paddingBlock: "0.25rem",
    fontSize: "11px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  button8: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingBlock: "0.5rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
})

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
  /** @docs { value, label, address, balance, change?, color? }[]
   * @default required */
  accounts: WalletAccount[]
  /** @docs string (with onUpdateModelValue): selected account
   * @default first account */
  modelValue?: string
  /** Override the active account's balance.
   * @docs number: override the active account's numbers
   * @default account data */
  balance?: number
  /** Override the active account's change.
   * @docs number: override the active account's numbers
   * @default account data */
  change?: number
  /** @docs string: balance prefix */
  currency?: string
  /** Start with the balance masked.
   * @docs boolean: start masked */
  defaultHidden?: boolean
  searchPlaceholder?: string
  /** Recent queries listed in the morphed-open search panel.
   * @docs string[]: recent queries in the search panel
   * @default undefined */
  recent?: string[]
  /** Show an unread pulse on the bell.
   * @docs boolean: unread pulse on the bell */
  notifications?: boolean
  /** @docs PixelColor: card accent */
  color?: PixelColor
  class?: string
  xstyle?: StyleProp
  onUpdateModelValue?: (value: string) => void
  /** @docs ("send" | "deposit" | "swap" | "buy") */
  onAction?: (name: WalletAction) => void
  /** Live query text on every keystroke.
   * @docs (query), live text on every keystroke */
  onSearch?: (query: string) => void
  /** Committed query — Enter or a recent row.
   * @docs (query) on Enter or a recent row */
  onSubmit?: (query: string) => void
  /** @docs () when the bell is pressed */
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
    <div ref={(el) => (root = el)} class={cn(styles.frame2, props.xstyle, props.class)}>
      <div {...stylex.props(styles.row)}>
        <button
          ref={(el) => (switcher = el)}
          type="button"
          aria-expanded={switching()}
          aria-haspopup="listbox"
          class={cn(CONTROL_BUTTON, styles.button2)}
          onClick={() => {
            setSwitching(!switching())
            setSearching(false)
          }}
        >
          <span
            aria-hidden="true"
            {...stylex.props(styles.text)}
            style={{ background: cssColor(account()?.color ?? props.color) }}
          />
          <span {...stylex.props(styles.text2)}>{account()?.label}</span>
          <span aria-hidden="true" class={cn(styles.text3, switching() && styles.rotate180)}>
            ▾
          </span>
        </button>
        <div {...stylex.props(styles.row2)}>
          <div {...stylex.props(styles.row3)} style={{ width: searching() ? "148px" : "32px" }}>
            <Show
              when={!searching()}
              fallback={
                <>
                  <span aria-hidden="true" {...stylex.props(styles.text4)}>
                    ⌕
                  </span>
                  <input
                    ref={(el) => (searchInput = el)}
                    value={query()}
                    type="text"
                    aria-label="Search wallet"
                    placeholder={props.searchPlaceholder}
                    {...stylex.props(styles.input)}
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
                class={cn(CONTROL_BUTTON, styles.button3)}
                onClick={openSearch}
              >
                ⌕
              </button>
            </Show>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            class={cn(CONTROL_BUTTON, styles.button4)}
            onClick={() => props.onNotify?.()}
          >
            ⍾
            <Show when={props.notifications}>
              <span aria-hidden="true" {...stylex.props(styles.row4)}>
                <span {...stylex.props(styles.row5)} style={{ background: cssColor(props.color) }} />
                <span {...stylex.props(styles.row6)} style={{ background: cssColor(props.color) }} />
              </span>
            </Show>
          </button>
        </div>
      </div>

      <Presence when={switching()} name="dk-wc-morph">
        <ul role="listbox" aria-label="Accounts" {...stylex.props(styles.ul)}>
          <For each={props.accounts}>
            {(a) => (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={a.value === account()?.value}
                  class={cn(
                    CONTROL_BUTTON,
                    styles.button5,
                    a.value === account()?.value ? styles.textForeground : styles.textMutedForeground,
                  )}
                  onClick={() => pick(a.value)}
                >
                  <span
                    aria-hidden="true"
                    {...stylex.props(styles.text)}
                    style={{ background: cssColor(a.color ?? props.color) }}
                  />
                  <span {...stylex.props(styles.text5)}>{a.label}</span>
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
        <div {...stylex.props(styles.layer)}>
          <div {...stylex.props(styles.box)}>Recent</div>
          <For each={props.recent}>
            {(r) => (
              <button type="button" class={cn(CONTROL_BUTTON, styles.button6)} onClick={() => submitSearch(r)}>
                <span aria-hidden="true" {...stylex.props(styles.text6)}>
                  ⌕
                </span>
                <span {...stylex.props(styles.text5)}>{r}</span>
              </button>
            )}
          </For>
        </div>
      </Presence>

      <div {...stylex.props(styles.stack)}>
        <div {...stylex.props(styles.row7)}>
          <span {...stylex.props(styles.text7)}>Balance</span>
          <button
            type="button"
            aria-pressed={hidden()}
            aria-label={hidden() ? "Show balance" : "Hide balance"}
            {...stylex.props(styles.button)}
            onClick={() => setHidden(!hidden())}
          >
            {hidden() ? "◒" : "◉"}
          </button>
        </div>
        <div {...stylex.props(styles.row8)} aria-live="polite">
          <For each={digitKeys()}>
            {(key, i) => (
              <span class={cn(styles.text8, "dk-wc-digit")} style={{ "animation-delay": `${i() * 36}ms` }}>
                {key.slice(-1)}
              </span>
            )}
          </For>
        </div>
        <div {...stylex.props(styles.row9)}>
          <Show
            when={hidden()}
            fallback={
              <span {...stylex.props(styles.frame)} style={{ color: changeColor() }}>
                <span
                  aria-hidden="true"
                  {...stylex.props(styles.layer2)}
                  style={{ background: changeColor(), opacity: CHANGE_TINT }}
                />
                <span {...stylex.props(styles.row10)}>
                  <span aria-hidden="true" {...stylex.props(styles.text9)} style={{ background: changeColor() }} />
                  {change() < 0 ? "▼" : "▲"} {Math.abs(change()).toFixed(1)}%
                </span>
              </span>
            }
          >
            <span {...stylex.props(styles.text10)} aria-hidden="true">
              *****
            </span>
          </Show>
        </div>
        <button
          type="button"
          aria-label={copied() ? "Address copied" : "Copy address"}
          class={cn(CONTROL_BUTTON, styles.button7)}
          onClick={copy}
        >
          <span>{shortAddress()}</span>
          <span aria-hidden="true" style={copied() ? { color: cssColor(props.color) } : undefined}>
            {copied() ? "✓" : "⧉"}
          </span>
        </button>
      </div>

      <div {...stylex.props(styles.grid)}>
        <For each={ACTIONS}>
          {(a) => (
            <button type="button" class={cn(CONTROL_BUTTON, styles.button8)} onClick={() => props.onAction?.(a.name)}>
              <span aria-hidden="true" {...stylex.props(styles.text11)} style={{ color: cssColor(props.color) }}>
                {a.glyph}
              </span>
              <span {...stylex.props(styles.text12)}>{a.label}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  )
}
