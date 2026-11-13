// Generated from ../solid/DitherForm.tsx by src/shared/lib/stylex-layer-solid.ts: edit that
// file, then npx rs test -u tests/stylex-layer-solid.spec.ts
import { type JSX, splitProps } from "solid-js"

type Own = { onSubmit?: () => void; children?: JSX.Element }
const OWN = ["onSubmit", "children"] as const satisfies readonly (keyof Own)[]

/** Everything a `<form>` takes (attributes, listeners, ARIA) reaches the form. */
export type DitherFormProps = Own & Omit<JSX.FormHTMLAttributes<HTMLFormElement>, keyof Own>

// Semantics only: a <form> that suppresses the native validation UI and
// exposes a clean submit event.
export default function DitherForm(raw: DitherFormProps) {
  const [props, rest] = splitProps(raw, OWN)
  return (
    <form
      {...rest}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        props.onSubmit?.()
      }}
    >
      {props.children}
    </form>
  )
}
