import DemoCard from "../DemoCard"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import inputProps from "virtual:dither-props/DitherInput"
import textareaProps from "virtual:dither-props/DitherTextarea"
import fieldProps from "virtual:dither-props/DitherField"
import formProps from "virtual:dither-props/DitherForm"
import fieldsetProps from "virtual:dither-props/DitherFieldset"
import numberFieldProps from "virtual:dither-props/DitherNumberField"
import otpFieldProps from "virtual:dither-props/DitherOtpField"
import DocSection from "../DocSection"
import FieldsetExample from "./examples/fieldset"
import fieldsetCode from "./examples/fieldset.tsx?raw"
import FormExample from "./examples/form"
import formCode from "./examples/form.tsx?raw"
import InputExample from "./examples/input"
import inputCode from "./examples/input.tsx?raw"
import TextareaExample from "./examples/textarea"
import textareaCode from "./examples/textarea.tsx?raw"
import FieldExample from "./examples/field"
import fieldCode from "./examples/field.tsx?raw"
import NumberFieldExample from "./examples/number-field"
import numberFieldCode from "./examples/number-field.tsx?raw"
import OtpFieldExample from "./examples/otp-field"
import otpFieldCode from "./examples/otp-field.tsx?raw"

export const API: Record<string, PropRow[]> = {
  input: kitTable(inputProps, { join: [["disabled", "readonly", "invalid"]] }),
  textarea: kitTable(textareaProps, { join: [["disabled", "readonly", "invalid"]] }),
  field: kitTable(fieldProps),
  fieldset: kitTable(fieldsetProps),
  form: kitTable(formProps),
  numberField: kitTable(numberFieldProps),
  otpField: kitTable(otpFieldProps),
}

export default function FieldDocs() {
  return (
    <>
      <DocSection id="input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A monospace text input on the token border stack: the border warms to the accent on focus, and{" "}
          <code class="text-foreground/80">invalid</code> swaps it for the red seed with{" "}
          <code class="text-foreground/80">aria-invalid</code>.
        </p>
        <DemoCard code={inputCode}>
          <InputExample />
        </DemoCard>
        <PropsTable rows={API.input} />
      </DocSection>

      <DocSection id="textarea">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The multiline companion to Input, with the same field context, invalid, read-only, focus, and disabled
          contracts. Resize behavior stays explicit.
        </p>
        <DemoCard code={textareaCode}>
          <div class="mx-auto max-w-sm">
            <TextareaExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.textarea} />
      </DocSection>

      <DocSection id="field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Label, control, and one line of small print. The <code class="text-foreground/80">error</code> replaces the
          description and drops a red pixel marker in front of the text.
        </p>
        <DemoCard code={fieldCode}>
          <FieldExample />
        </DemoCard>
        <PropsTable rows={API.field} />
      </DocSection>

      <DocSection id="fieldset">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Groups related fields inside a bordered box with a tracking-spaced legend. Native{" "}
          <code class="text-foreground/80">&lt;fieldset&gt;</code> semantics, kit skin.
        </p>
        <DemoCard code={fieldsetCode}>
          <div class="mx-auto max-w-sm">
            <FieldsetExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.fieldset} />
      </DocSection>

      <DocSection id="form">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A deliberately tiny wrapper: <code class="text-foreground/80">novalidate</code> suppresses the browser's
          validation bubbles and submit is prevented and handed on as a clean{" "}
          <code class="text-foreground/80">onSubmit</code> call.
        </p>
        <DemoCard code={formCode}>
          <div class="mx-auto max-w-sm">
            <FormExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.form} />
      </DocSection>

      <DocSection id="number-field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Stepper buttons around a spinbutton input: arrow keys step, typed values clamp and snap to the step on blur,
          and the buttons disable at the bounds.
        </p>
        <DemoCard code={numberFieldCode}>
          <NumberFieldExample />
        </DemoCard>
        <PropsTable rows={API.numberField} />
      </DocSection>

      <DocSection id="otp-field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One box per digit with auto-advancing focus. Backspace on an empty box steps back, and pasting a full code
          distributes it across the boxes. <code class="text-foreground/80">complete</code> fires once every box is
          filled.
        </p>
        <DemoCard code={otpFieldCode}>
          <OtpFieldExample />
        </DemoCard>
        <PropsTable rows={API.otpField} />
      </DocSection>
    </>
  )
}
