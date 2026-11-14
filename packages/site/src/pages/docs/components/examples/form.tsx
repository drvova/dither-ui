import { createSignal } from "solid-js"
import { DitherButton, DitherField, DitherForm, DitherInput } from "@dither-kit"

export default function Example() {
  const [email, setEmail] = createSignal("")
  const [submitted, setSubmitted] = createSignal(0)

  return (
    <DitherForm onSubmit={() => setSubmitted(submitted() + 1)}>
      <div class="grid gap-4">
        <DitherField label="Email" for="form-email">
          <DitherInput
            id="form-email"
            modelValue={email()}
            onUpdateModelValue={setEmail}
            type="email"
            placeholder="you@dither-ui.com"
          />
        </DitherField>
        <DitherButton type="submit" color="blue" class="w-full">
          Subscribe
        </DitherButton>
        <p class="text-[11px] text-muted-foreground">submitted {submitted()} times</p>
      </div>
    </DitherForm>
  )
}
