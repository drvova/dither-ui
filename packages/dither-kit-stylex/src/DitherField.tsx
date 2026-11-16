// Generated from @dither-ui/kit/solid/DitherField.tsx by packages/restyle/src/stylex-layer-solid.ts: edit that
// file, then npx rs test -u packages/dither-kit-stylex/tests/stylex-layer-solid.spec.ts
import { createMemo, createUniqueId, type JSX, Match, Show, Switch } from "solid-js"
import { cssColor } from "@dither-ui/kit/engine/palette.ts"
import { FieldContextKey } from "@dither-ui/kit/solid/runtime/field.ts"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  grid: { display: "grid", gap: "0.375rem" },
  label: {
    fontSize: "12px",
    fontWeight: "500",
    color: "color-mix(in oklab, var(--foreground) 90%, transparent)",
  },
  p: { display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "11px" },
  text: { display: "inline-block", width: "0.375rem", height: "0.375rem" },
  p2: { fontSize: "11px", lineHeight: "1.625", color: "var(--muted-foreground)" },
})

export type DitherFieldProps = {
  label?: string
  description?: string
  error?: string
  for?: string
  /** @docs content */
  children?: JSX.Element
}

export default function DitherField(props: DitherFieldProps) {
  const base = `dk-field-${createUniqueId()}`
  const controlId = createMemo(() => props.for ?? `${base}-control`)
  const helpId = `${base}-help`
  const labelId = `${base}-label`
  const describedBy = createMemo(() => (props.error || props.description ? helpId : undefined))
  const invalid = createMemo(() => !!props.error)

  return (
    <FieldContextKey.Provider
      value={{ controlId, labelId: () => (props.label ? labelId : undefined), describedBy, invalid }}
    >
      <div {...stylex.props(styles.grid)}>
        <Show when={props.label}>
          <label id={labelId} for={controlId()} {...stylex.props(styles.label)}>
            {props.label}
          </label>
        </Show>
        {props.children}
        <Switch>
          <Match when={props.error}>
            <p id={helpId} role="alert" {...stylex.props(styles.p)} style={{ color: cssColor("red") }}>
              <span aria-hidden="true" {...stylex.props(styles.text)} style={{ background: cssColor("red") }} />
              {props.error}
            </p>
          </Match>
          <Match when={props.description}>
            <p id={helpId} {...stylex.props(styles.p2)}>
              {props.description}
            </p>
          </Match>
        </Switch>
      </div>
    </FieldContextKey.Provider>
  )
}
