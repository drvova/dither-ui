// Generated from @dither-ui/kit/solid/DitherCommand.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  mergeProps,
  on,
  onMount,
  Show,
} from "solid-js"
import { Portal } from "solid-js/web"
import { isTab } from "@dither-ui/kit/engine/keys.ts"
import { CONTROL_BUTTON, POPOVER } from "./control"
import { cn, type StyleProp } from "./lib"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: {
    position: "fixed",
    inset: "0px",
    zIndex: "50",
    display: "grid",
    placeItems: "start",
    justifyContent: "center",
    paddingTop: "18vh",
  },
  layer: {
    position: "absolute",
    inset: "0px",
    backgroundColor: "color-mix(in oklab, var(--background) 70%, transparent)",
    WebkitBackdropFilter: "blur(2px)        ",
    backdropFilter: "blur(2px)        ",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    borderBottomStyle: "solid",
    borderBottomWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.75rem",
  },
  text: { fontSize: "12px", color: "var(--muted-foreground)" },
  input: {
    height: "2.75rem",
    width: "100%",
    backgroundColor: "transparent",
    fontSize: "13px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "var(--placeholder, var(--muted-foreground))" },
  },
  text2: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "9px",
    color: "var(--muted-foreground)",
  },
  ul: { maxHeight: "18rem", overflowY: "auto", padding: "0.375rem" },
  li: {
    paddingInline: "0.625rem",
    paddingBlock: "1.5rem",
    textAlign: "center",
    fontSize: "12px",
    color: "var(--muted-foreground)",
  },
  li2: {
    paddingInline: "0.625rem",
    paddingTop: "0.5rem",
    paddingBottom: "0.25rem",
    fontSize: "9px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  text3: {
    width: "0.375rem",
    height: "0.375rem",
    flexShrink: "0",
    borderRadius: "1px",
    backgroundColor: "currentcolor",
    opacity: "60%",
  },
  text4: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  kbd: {
    borderRadius: "0.25rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    paddingInline: "0.25rem",
    fontSize: "9px",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  frame: {
    position: "relative",
    width: "min(92vw, 480px)",
    overflow: "hidden",
    fontFamily: "var(--font-mono)",
  },
  li3: {
    display: "flex",
    cursor: "pointer",
    alignItems: "center",
    gap: "0.625rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.5rem",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  bgCard: { backgroundColor: "var(--card)", color: "var(--foreground)" },
  textMutedForeground: {
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--card) 60%, transparent)",
      },
    },
  },
})

export type CommandItem = { value: string; label: string; group?: string; kbd?: string }

/** Command palette — type to filter, arrows to walk, Enter runs, Escape
 * leaves. Same open/close contract as the dialog; wire your own hotkey:
 * `window.addEventListener("keydown", e => e.metaKey && e.key === "k" && open())`. */
export type DitherCommandProps = {
  /** @docs boolean (onClose asks to leave)
   * @default required */
  open: boolean
  /** @docs { value, label, group?, kbd? }[]
   * @default required */
  items: CommandItem[]
  placeholder?: string
  /** Shown when nothing matches; given as a function (of the query), it
   * draws that instead.
   * @docs string (no-match line) | ({ query }) => JSX.Element, drawn in its place */
  empty?: string | ((scope: { query: string }) => JSX.Element)
  class?: string
  xstyle?: StyleProp
  onClose?: () => void
  /** @docs (value), fired before close */
  onSelect?: (value: string) => void
}

export default function DitherCommand(raw: DitherCommandProps) {
  const props = mergeProps({ placeholder: "Type a command…", empty: "No results." }, raw)

  const idBase = `dk-command-${createUniqueId()}`
  const [query, setQuery] = createSignal("")
  const [active, setActive] = createSignal(0)
  let input: HTMLInputElement | undefined
  let previousFocus: HTMLElement | null = null

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase()
    return q ? props.items.filter((i) => i.label.toLowerCase().includes(q)) : props.items
  })
  /** Group order follows first appearance; ungrouped items fall under "". */
  const groups = createMemo(() => {
    const out = new Map<string, CommandItem[]>()
    for (const item of filtered()) {
      const g = item.group ?? ""
      if (!out.has(g)) out.set(g, [])
      out.get(g)!.push(item)
    }
    return out
  })
  const flat = createMemo(() => [...groups().values()].flat())

  onMount(() => {
    createEffect(
      on(
        () => props.open,
        (open) => {
          if (open) {
            previousFocus = document.activeElement as HTMLElement | null
            setQuery("")
            setActive(0)
            queueMicrotask(() => input?.focus())
          } else {
            previousFocus?.focus()
            previousFocus = null
          }
        },
        { defer: true },
      ),
    )
    createEffect(on(query, () => setActive(0), { defer: true }))
  })

  function pick(value: string) {
    props.onSelect?.(value)
    props.onClose?.()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation()
      props.onClose?.()
      return
    }
    // Modal: Tab never leaves the palette — the input is its one field and
    // the list is driven by the arrow keys.
    if (isTab(e)) {
      e.preventDefault()
      input?.focus()
      return
    }
    const n = flat().length
    if (!n) return
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((active() + 1) % n))
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((active() - 1 + n) % n))
    else if (e.key === "Home") (e.preventDefault(), setActive(0))
    else if (e.key === "End") (e.preventDefault(), setActive(n - 1))
    else if (e.key === "Enter") {
      e.preventDefault()
      const item = flat()[active()]
      if (item) pick(item.value)
    }
  }
  const indexOf = (item: CommandItem) => flat().indexOf(item)
  const empty = () => {
    const e = props.empty
    return typeof e === "function" ? e({ query: query().trim() }) : e
  }

  return (
    <Portal>
      <Show when={props.open}>
        <div {...stylex.props(styles.grid)} onKeyDown={onKeydown}>
          <div {...stylex.props(styles.layer)} aria-hidden="true" onClick={() => props.onClose?.()} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={props.placeholder}
            class={cn(styles.frame, POPOVER, props.xstyle, props.class)}
          >
            <div {...stylex.props(styles.row)}>
              <span {...stylex.props(styles.text)} aria-hidden="true">
                ›
              </span>
              <input
                ref={(el) => (input = el)}
                value={query()}
                onInput={(e) => setQuery(e.currentTarget.value)}
                type="text"
                role="combobox"
                aria-expanded={true}
                aria-controls={`${idBase}-list`}
                aria-activedescendant={flat()[active()] ? `${idBase}-${indexOf(flat()[active()])}` : undefined}
                placeholder={props.placeholder}
                {...stylex.props(styles.input)}
              />
              <span {...stylex.props(styles.text2)} aria-hidden="true">
                esc
              </span>
            </div>
            <ul id={`${idBase}-list`} role="listbox" {...stylex.props(styles.ul)}>
              <Show when={!flat().length}>
                <li {...stylex.props(styles.li)}>{empty()}</li>
              </Show>
              <For each={[...groups()]}>
                {([group, groupItems]) => (
                  <>
                    <Show when={group}>
                      <li aria-hidden="true" {...stylex.props(styles.li2)}>
                        {group}
                      </li>
                    </Show>
                    <For each={groupItems}>
                      {(item) => (
                        <li
                          id={`${idBase}-${indexOf(item)}`}
                          role="option"
                          aria-selected={indexOf(item) === active()}
                          class={cn(
                            styles.li3,
                            CONTROL_BUTTON,
                            indexOf(item) === active() ? styles.bgCard : styles.textMutedForeground,
                          )}
                          onClick={() => pick(item.value)}
                          onPointerMove={() => setActive(indexOf(item))}
                        >
                          <span {...stylex.props(styles.text3)} aria-hidden="true" />
                          <span {...stylex.props(styles.text4)}>{item.label}</span>
                          <Show when={item.kbd}>
                            <kbd {...stylex.props(styles.kbd)}>{item.kbd}</kbd>
                          </Show>
                        </li>
                      )}
                    </For>
                  </>
                )}
              </For>
            </ul>
          </div>
        </div>
      </Show>
    </Portal>
  )
}
