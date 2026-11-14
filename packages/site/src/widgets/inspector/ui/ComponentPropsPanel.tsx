import { For, Match, Show, Switch } from "solid-js"
import type { ComponentEntry, PropSpec } from "@/entities/widget"
import { colorToHex } from "@dither-ui/kit"
import { breakable, safeUrl } from "@/shared/lib"
import { ColorField, NumberField, Segmented, Toggle } from "@/shared/ui"

export type ComponentPropsPanelProps = {
  entry: ComponentEntry
  target: { props: Record<string, unknown>; slotText: string | null }
}

const FIELD =
  "w-full rounded-md border border-edge bg-background/60 px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
const ROW = "flex items-center gap-2 text-[11px] text-muted-foreground"

/** Spec-driven prop controls for a registry component — shared between the
 * standalone component artboard panel and screen-cell editing. */
export default function ComponentPropsPanel(props: ComponentPropsPanelProps) {
  const inputValue = (e: Event) => (e.target as HTMLInputElement).value
  const listText = (v: unknown) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""))
  const setProp = (key: string, value: unknown) => {
    props.target.props[key] = value
  }
  /** A url prop takes only what the document's sanitizer would keep; a
   * script URL typed here never reaches the component. */
  const setText = (spec: PropSpec, value: string) =>
    setProp(spec.key, spec.kind !== "url" || safeUrl(value) ? value : "")
  const setSlotText = (value: string) => {
    props.target.slotText = value
  }
  function setList(key: string, e: Event) {
    setProp(
      key,
      inputValue(e)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  }
  const asFieldColor = (c: unknown) => (typeof c === "number" ? colorToHex(c) : c) as string

  return (
    <div class="flex flex-col gap-3">
      <Show when={props.target.slotText != null}>
        <label class={ROW}>
          <span class="prop-name">text</span>
          <input
            value={props.target.slotText ?? ""}
            type="text"
            name="component-slot"
            autocomplete="off"
            class={FIELD}
            onInput={(e) => setSlotText(inputValue(e))}
          />
        </label>
      </Show>
      <For each={props.entry.props}>
        {(spec) => (
          <Switch>
            <Match when={spec.kind === "text" || spec.kind === "url"}>
              <label class={ROW}>
                <span class="prop-name">{breakable(spec.key)}</span>
                <input
                  value={props.target.props[spec.key] as string}
                  type={spec.kind === "url" ? "url" : "text"}
                  name={`prop-${spec.key}`}
                  autocomplete="off"
                  class={FIELD}
                  onInput={(e) => setText(spec, inputValue(e))}
                />
              </label>
            </Match>
            <Match when={spec.kind === "list"}>
              <label class={ROW}>
                <span class="prop-name">{breakable(spec.key)}</span>
                <input
                  value={listText(props.target.props[spec.key])}
                  type="text"
                  name={`prop-${spec.key}`}
                  autocomplete="off"
                  placeholder="One, Two, Three"
                  class={FIELD}
                  onChange={(e) => setList(spec.key, e)}
                />
              </label>
            </Match>
            <Match when={spec.kind === "number" && spec}>
              {(num) => (
                <NumberField
                  modelValue={props.target.props[spec.key] as number}
                  label={spec.key}
                  min={num().min}
                  max={num().max}
                  step={num().step}
                  onUpdateModelValue={(v) => setProp(spec.key, v)}
                />
              )}
            </Match>
            <Match when={spec.kind === "select" && spec}>
              {(choice) => (
                <Segmented
                  modelValue={props.target.props[spec.key] as string}
                  options={choice().options}
                  label={spec.key}
                  onUpdateModelValue={(v) => setProp(spec.key, v)}
                />
              )}
            </Match>
            <Match when={spec.kind === "color"}>
              <div class="text-[11px] text-muted-foreground">
                <span class="mb-1 block">{breakable(spec.key)}</span>
                <ColorField
                  modelValue={asFieldColor(props.target.props[spec.key])}
                  onUpdateModelValue={(v) => setProp(spec.key, v)}
                />
              </div>
            </Match>
            <Match when={spec.kind === "boolean"}>
              <Toggle
                modelValue={props.target.props[spec.key] as boolean}
                label={spec.key}
                onUpdateModelValue={(v) => setProp(spec.key, v)}
              />
            </Match>
          </Switch>
        )}
      </For>
    </div>
  )
}
