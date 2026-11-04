import { DitherField } from "@dither-kit"
import { type FunctionalComponent, h } from "vue"

/** A text field inside the DitherField that carries its visible label (the
 * kit's own pairing: the label tied to the control by the field's context),
 * anything else as it is. The code export writes the same (`fieldLabel`). */
export const FieldWrap: FunctionalComponent<{ label: string | null }> = (props, { slots, attrs }) =>
  props.label ? h(DitherField, { ...attrs, label: props.label }, slots) : slots.default?.()
FieldWrap.props = ["label"]
