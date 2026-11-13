import { createMemo, createSignal, For, mergeProps, Show } from "solid-js"
import { cn } from "../tailwind/lib"

export type TransferListProps = {
  source?: string[]
  value?: string[]
  onUpdateModelValue?: (value: string[]) => void
  disabled?: boolean
  sourceLabel?: string
  targetLabel?: string
  class?: string
}

const panelClass =
  "grid min-h-32 content-start gap-0.5 overflow-auto rounded-md border border-border bg-background/60 p-1"
const rowClass =
  "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] transition-colors hover:bg-accent/10 motion-reduce:transition-none"
const btnClass =
  "rounded border border-border/70 px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none"

/** Two-panel transfer shuttle: the source pool stays put, the destination IS
 * the model. Native checkboxes select in both directions, Add/Remove move the
 * selection, Add all/Remove all flush. Everything keyboard-reachable. */
export default function TransferList(raw: TransferListProps) {
  const props = mergeProps(
    { source: [] as string[], sourceLabel: "Available", targetLabel: "Selected", disabled: false },
    raw,
  )

  const [sourceSel, setSourceSel] = createSignal<Set<string>>(new Set())
  const [targetSel, setTargetSel] = createSignal<Set<string>>(new Set())

  const target = createMemo(() => props.value ?? [])
  const available = createMemo(() => props.source.filter((s) => !target().includes(s)))

  function toggle(side: "source" | "target", item: string, checked: boolean) {
    const [held, setHeld] = side === "source" ? [sourceSel, setSourceSel] : [targetSel, setTargetSel]
    const next = new Set(held())
    if (checked) next.add(item)
    else next.delete(item)
    setHeld(next)
  }

  function add() {
    props.onUpdateModelValue?.([...target(), ...sourceSel()])
    setSourceSel(new Set<string>())
  }
  function remove() {
    props.onUpdateModelValue?.(target().filter((t) => !targetSel().has(t)))
    setTargetSel(new Set<string>())
  }
  function addAll() {
    props.onUpdateModelValue?.([...target(), ...available()])
    setSourceSel(new Set<string>())
  }
  function removeAll() {
    props.onUpdateModelValue?.([])
    setTargetSel(new Set<string>())
  }

  return (
    <div class={cn("grid gap-3 sm:grid-cols-[1fr_auto_1fr]", props.class)}>
      <div>
        <p class="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{props.sourceLabel}</p>
        <ul class={panelClass} aria-disabled={props.disabled || undefined}>
          <Show when={available().length === 0}>
            <li class="px-2 py-1.5 text-[12px] text-muted-foreground">Nothing left</li>
          </Show>
          <For each={available()}>
            {(item) => (
              <li>
                <label class={rowClass}>
                  <input
                    type="checkbox"
                    class="size-3.5 accent-[currentColor]"
                    checked={sourceSel().has(item)}
                    disabled={props.disabled}
                    onChange={(e) => toggle("source", item, e.currentTarget.checked)}
                  />
                  {item}
                </label>
              </li>
            )}
          </For>
        </ul>
      </div>

      <div class="flex flex-row justify-center gap-1.5 sm:flex-col sm:justify-center">
        <button type="button" class={btnClass} disabled={props.disabled || sourceSel().size === 0} onClick={add}>
          Add →
        </button>
        <button type="button" class={btnClass} disabled={props.disabled || targetSel().size === 0} onClick={remove}>
          ← Remove
        </button>
        <button type="button" class={btnClass} disabled={props.disabled || available().length === 0} onClick={addAll}>
          Add all
        </button>
        <button type="button" class={btnClass} disabled={props.disabled || target().length === 0} onClick={removeAll}>
          Remove all
        </button>
      </div>

      <div>
        <p class="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{props.targetLabel}</p>
        <ul class={panelClass} aria-disabled={props.disabled || undefined}>
          <Show when={target().length === 0}>
            <li class="px-2 py-1.5 text-[12px] text-muted-foreground">Empty</li>
          </Show>
          <For each={target()}>
            {(item) => (
              <li>
                <label class={rowClass}>
                  <input
                    type="checkbox"
                    class="size-3.5 accent-[currentColor]"
                    checked={targetSel().has(item)}
                    disabled={props.disabled}
                    onChange={(e) => toggle("target", item, e.currentTarget.checked)}
                  />
                  {item}
                </label>
              </li>
            )}
          </For>
        </ul>
      </div>
    </div>
  )
}
