import { createSignal, Show } from "solid-js"
import { cssColor, DitherField, DitherInput, DitherTextarea, DitherNumberField, DitherOtpField } from "@dither-ui/kit"
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

const SNIPPET_INPUT = `import { createSignal } from "solid-js"
import { DitherInput } from "@dither-kit"

export default function Example() {
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("not-an-email")

  return (
    <div class="grid gap-3 sm:grid-cols-2">
      <DitherInput modelValue={name()} onUpdateModelValue={setName} placeholder="Ada Byte" />
      <DitherInput modelValue={email()} onUpdateModelValue={setEmail} type="email" invalid placeholder="you@dither-ui.com" />
    </div>
  )
}`

const SNIPPET_TEXTAREA = `import { createSignal } from "solid-js"
import { DitherField, DitherTextarea } from "@dither-kit"

export default function Example() {
  const [bio, setBio] = createSignal("")

  return (
    <DitherField label="Bio" description="A short introduction.">
      <DitherTextarea modelValue={bio()} onUpdateModelValue={setBio} placeholder="Tell us what you make…" />
    </DitherField>
  )
}`

const SNIPPET_FIELD = `import { createSignal } from "solid-js"
import { DitherField, DitherInput } from "@dither-kit"

export default function Example() {
  const [handle, setHandle] = createSignal("")
  const [website, setWebsite] = createSignal("")

  return (
    <div class="grid gap-5">
      <DitherField label="Handle" description="Lowercase, no spaces.">
        <DitherInput modelValue={handle()} onUpdateModelValue={setHandle} placeholder="ada" />
      </DitherField>
      <DitherField label="Website" error="That URL does not resolve.">
        <DitherInput modelValue={website()} onUpdateModelValue={setWebsite} placeholder="https://" />
      </DitherField>
    </div>
  )
}`

const SNIPPET_NUMBER = `import { createSignal } from "solid-js"
import { DitherNumberField } from "@dither-kit"

export default function Example() {
  const [qty, setQty] = createSignal(3)

  return (
    <div class="flex items-center gap-4">
      <DitherNumberField modelValue={qty()} onUpdateModelValue={setQty} min={0} max={10} label="Quantity" />
      <span class="text-[13px] tabular-nums">{qty()} / 10</span>
    </div>
  )
}`

const SNIPPET_OTP = `import { createSignal, Show } from "solid-js"
import { DitherOtpField } from "@dither-kit"

export default function Example() {
  const [otp, setOtp] = createSignal("")
  const [complete, setComplete] = createSignal(false)

  return (
    <div class="grid gap-3">
      <DitherOtpField modelValue={otp()} onUpdateModelValue={setOtp} length={6} onComplete={() => setComplete(true)} />
      <Show when={complete()}><p class="text-[11px]">complete!</p></Show>
    </div>
  )
}`

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
  const [name, setName] = createSignal("")
  const [email, setEmail] = createSignal("not-an-email")
  const [handle, setHandle] = createSignal("")
  const [bio, setBio] = createSignal("Dithered interfaces, composed with Solid.")
  const [website, setWebsite] = createSignal("")
  const [qty, setQty] = createSignal(3)
  const [otp, setOtp] = createSignal("")
  const [otpComplete, setOtpComplete] = createSignal(false)

  return (
    <>
      <DocSection id="input">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A monospace text input on the token border stack: the border warms to the accent on focus, and{" "}
          <code class="text-foreground/80">invalid</code> swaps it for the red seed with{" "}
          <code class="text-foreground/80">aria-invalid</code>.
        </p>
        <DemoCard code={SNIPPET_INPUT}>
          <div class="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
            <DitherInput modelValue={name()} onUpdateModelValue={setName} placeholder="Ada Byte" />
            <DitherInput
              modelValue={email()}
              onUpdateModelValue={setEmail}
              type="email"
              invalid
              placeholder="you@dither-ui.com"
            />
          </div>
        </DemoCard>
        <PropsTable rows={API.input} />
      </DocSection>

      <DocSection id="textarea">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          The multiline companion to Input, with the same field context, invalid, read-only, focus, and disabled
          contracts. Resize behavior stays explicit.
        </p>
        <DemoCard code={SNIPPET_TEXTAREA}>
          <div class="mx-auto max-w-sm">
            <DitherField label="Bio" description="A short introduction.">
              <DitherTextarea modelValue={bio()} onUpdateModelValue={setBio} placeholder="Tell us what you make…" />
            </DitherField>
          </div>
        </DemoCard>
        <PropsTable rows={API.textarea} />
      </DocSection>

      <DocSection id="field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          Label, control, and one line of small print. The <code class="text-foreground/80">error</code> replaces the
          description and drops a red pixel marker in front of the text.
        </p>
        <DemoCard code={SNIPPET_FIELD}>
          <div class="mx-auto grid max-w-sm gap-5">
            <DitherField label="Handle" description="Lowercase, no spaces.">
              <DitherInput modelValue={handle()} onUpdateModelValue={setHandle} placeholder="ada" />
            </DitherField>
            <DitherField label="Website" error="That URL does not resolve.">
              <DitherInput modelValue={website()} onUpdateModelValue={setWebsite} placeholder="https://" />
            </DitherField>
          </div>
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
        <DemoCard code={SNIPPET_NUMBER}>
          <div class="mx-auto flex max-w-sm items-center justify-center gap-4">
            <DitherNumberField modelValue={qty()} onUpdateModelValue={setQty} min={0} max={10} label="Quantity" />
            <span class="text-[13px] tabular-nums">{qty()} / 10</span>
          </div>
        </DemoCard>
        <PropsTable rows={API.numberField} />
      </DocSection>

      <DocSection id="otp-field">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          One box per digit with auto-advancing focus. Backspace on an empty box steps back, and pasting a full code
          distributes it across the boxes. <code class="text-foreground/80">complete</code> fires once every box is
          filled.
        </p>
        <DemoCard code={SNIPPET_OTP}>
          <div class="mx-auto grid max-w-sm justify-items-center gap-3">
            <DitherOtpField
              modelValue={otp()}
              onUpdateModelValue={setOtp}
              length={6}
              onComplete={() => setOtpComplete(true)}
            />
            <Show when={otpComplete()}>
              <p class="text-[11px]" style={{ color: cssColor("green") }}>
                complete!
              </p>
            </Show>
          </div>
        </DemoCard>
        <PropsTable rows={API.otpField} />
      </DocSection>
    </>
  )
}
