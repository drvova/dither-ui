import { DitherField } from "@dither-ui/kit"
import { type JSX, Show } from "solid-js"

/** A text field inside the DitherField that carries its visible label (the
 * kit's own pairing: the label tied to the control by the field's context),
 * anything else as it is. The code export writes the same (`fieldLabel`).
 * The Solid DitherField takes no class, so the one the Vue field took
 * stands on a box around it. */
export function FieldWrap(props: { label: string | null; class?: string; children?: JSX.Element }) {
  return (
    <Show when={props.label} fallback={props.children}>
      {(label) => (
        <div class={props.class}>
          <DitherField label={label()}>{props.children}</DitherField>
        </div>
      )}
    </Show>
  )
}
