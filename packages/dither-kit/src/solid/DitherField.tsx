import { createMemo, createUniqueId, type JSX, Match, Show, Switch } from "solid-js"
import { cssColor } from "../engine/palette"
import { FieldContextKey } from "./runtime/field"

export type DitherFieldProps = {
  label?: string
  description?: string
  error?: string
  for?: string
  children?: JSX.Element
}

export default function DitherField(props: DitherFieldProps) {
  const base = `dk-field-${createUniqueId()}`
  const controlId = createMemo(() => props.for ?? `${base}-control`)
  const helpId = `${base}-help`
  const describedBy = createMemo(() => (props.error || props.description ? helpId : undefined))
  const invalid = createMemo(() => !!props.error)

  return (
    <FieldContextKey.Provider value={{ controlId, describedBy, invalid }}>
      <div class="grid gap-1.5">
        <Show when={props.label}>
          <label for={controlId()} class="text-[12px] font-medium text-foreground/90">
            {props.label}
          </label>
        </Show>
        {props.children}
        <Switch>
          <Match when={props.error}>
            <p
              id={helpId}
              role="alert"
              class="flex items-center gap-1.5 text-[11px]"
              style={{ color: cssColor("red") }}
            >
              <span aria-hidden="true" class="inline-block size-1.5" style={{ background: cssColor("red") }} />
              {props.error}
            </p>
          </Match>
          <Match when={props.description}>
            <p id={helpId} class="text-[11px] leading-relaxed text-muted-foreground">
              {props.description}
            </p>
          </Match>
        </Switch>
      </div>
    </FieldContextKey.Provider>
  )
}
