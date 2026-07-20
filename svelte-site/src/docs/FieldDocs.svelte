<script lang="ts">
  import {
    cssColor,
    DitherButton,
    DitherField,
    DitherFieldset,
    DitherForm,
    DitherInput,
    DitherTextarea,
    DitherNumberField,
    DitherOtpField,
  } from "@dither-kit-svelte"
  import DemoCard from "./DemoCard.svelte"
  import PropsTable, { type PropRow } from "./PropsTable.svelte"

  let name = $state("")
  let email = $state("not-an-email")
  let handle = $state("")
  let bio = $state("Dithered interfaces, composed with Svelte.")
  let website = $state("")
  let profileName = $state("Ada Byte")
  let profileHandle = $state("ada")
  let formEmail = $state("")
  let submitted = $state(0)
  let qty = $state(3)
  let otp = $state("")
  let otpComplete = $state(false)

  const SNIPPET_INPUT = `<script lang="ts">
  import { DitherInput } from "@dither-kit-svelte"

  let name = $state("")
  let email = $state("not-an-email")
<\/script>

<div class="grid gap-3 sm:grid-cols-2">
  <DitherInput bind:value={name} placeholder="Ada Byte" />
  <DitherInput bind:value={email} type="email" invalid placeholder="you@dither-ui.com" />
</div>`

  const SNIPPET_TEXTAREA = `<script lang="ts">
  import { DitherField, DitherTextarea } from "@dither-kit-svelte"

  let bio = $state("")
<\/script>

<DitherField label="Bio" description="A short introduction.">
  <DitherTextarea bind:value={bio} placeholder="Tell us what you make…" />
</DitherField>`

  const SNIPPET_FIELD = `<script lang="ts">
  import { DitherField, DitherInput } from "@dither-kit-svelte"

  let handle = $state("")
  let website = $state("")
<\/script>

<div class="grid gap-5">
  <DitherField label="Handle" description="Lowercase, no spaces.">
    <DitherInput bind:value={handle} placeholder="ada" />
  </DitherField>
  <DitherField label="Website" error="That URL does not resolve.">
    <DitherInput bind:value={website} placeholder="https://" />
  </DitherField>
</div>`

  const SNIPPET_FIELDSET = `<script lang="ts">
  import { DitherField, DitherFieldset, DitherInput } from "@dither-kit-svelte"

  let name = $state("Ada Byte")
  let handle = $state("ada")
<\/script>

<DitherFieldset legend="Profile">
  <DitherField label="Name" for="profile-name">
    <DitherInput id="profile-name" bind:value={name} />
  </DitherField>
  <DitherField label="Handle" for="profile-handle">
    <DitherInput id="profile-handle" bind:value={handle} />
  </DitherField>
</DitherFieldset>`

  const SNIPPET_FORM = `<script lang="ts">
  import { DitherButton, DitherField, DitherForm, DitherInput } from "@dither-kit-svelte"

  let email = $state("")
  let submitted = $state(0)
<\/script>

<DitherForm onsubmit={() => submitted++}>
  <div class="grid gap-4">
    <DitherField label="Email" for="form-email">
      <DitherInput id="form-email" bind:value={email} type="email" placeholder="you@dither-ui.com" />
    </DitherField>
    <DitherButton type="submit" color="blue" class="w-full">Subscribe</DitherButton>
    <p class="text-[11px] text-muted-foreground">submitted {submitted} times</p>
  </div>
</DitherForm>`

  const SNIPPET_NUMBER = `<script lang="ts">
  import { DitherNumberField } from "@dither-kit-svelte"

  let qty = $state(3)
<\/script>

<div class="flex items-center gap-4">
  <DitherNumberField bind:value={qty} min={0} max={10} />
  <span class="text-[13px] tabular-nums">{qty} / 10</span>
</div>`

  const SNIPPET_OTP = `<script lang="ts">
  import { DitherOtpField } from "@dither-kit-svelte"

  let otp = $state("")
  let complete = $state(false)
<\/script>

<div class="grid gap-3">
  <DitherOtpField bind:value={otp} length={6} oncomplete={() => (complete = true)} />
  {#if complete}<p class="text-[11px]">complete!</p>{/if}
</div>`

  const API: Record<string, PropRow[]> = {
    input: [
      { prop: "value", type: "string", default: '""' },
      { prop: "type", type: "string", default: '"text"' },
      { prop: "placeholder", type: "string", default: "—" },
      { prop: "disabled / readonly / invalid", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    textarea: [
      { prop: "value", type: "string", default: '""' },
      { prop: "placeholder", type: "string", default: "—" },
      { prop: "rows", type: "number", default: "4" },
      { prop: "resize", type: '"none" | "vertical" | "horizontal" | "both"', default: '"vertical"' },
      { prop: "disabled / readonly / invalid", type: "boolean", default: "false" },
      { prop: "class", type: "string", default: "—" },
    ],
    field: [
      { prop: "label", type: "string", default: "—" },
      { prop: "description", type: "string", default: "—" },
      { prop: "error", type: "string", default: "—" },
      { prop: "for", type: "string", default: "—" },
    ],
    fieldset: [{ prop: "legend", type: "string", default: "—" }],
    form: [],
    numberField: [
      { prop: "value", type: "number", default: "0" },
      { prop: "min", type: "number", default: "—" },
      { prop: "max", type: "number", default: "—" },
      { prop: "step", type: "number", default: "1" },
      { prop: "disabled", type: "boolean", default: "false" },
    ],
    otpField: [
      { prop: "length", type: "number", default: "6" },
      { prop: "value", type: "string", default: '""' },
    ],
  }
</script>

<section id="input" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Input</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A monospace text input on the token border stack — the border warms to
    the accent on focus, and <code class="text-foreground/80">invalid</code>
    swaps it for the red seed with <code class="text-foreground/80">aria-invalid</code>.
  </p>
  <DemoCard code={SNIPPET_INPUT}>
    <div class="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
      <DitherInput bind:value={name} placeholder="Ada Byte" />
      <DitherInput bind:value={email} type="email" invalid placeholder="you@dither-ui.com" />
    </div>
  </DemoCard>
  <PropsTable rows={API.input} />
</section>

<section id="textarea" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Textarea</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    The multiline companion to Input, with the same field context, invalid,
    read-only, focus, and disabled contracts. Resize behavior stays explicit.
  </p>
  <DemoCard code={SNIPPET_TEXTAREA}>
    <div class="mx-auto max-w-sm">
      <DitherField label="Bio" description="A short introduction.">
        <DitherTextarea bind:value={bio} placeholder="Tell us what you make…" />
      </DitherField>
    </div>
  </DemoCard>
  <PropsTable rows={API.textarea} />
</section>

<section id="field" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Field</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Label, control, and one line of small print — the
    <code class="text-foreground/80">error</code> replaces the description
    and drops a red pixel marker in front of the text.
  </p>
  <DemoCard code={SNIPPET_FIELD}>
    <div class="mx-auto grid max-w-sm gap-5">
      <DitherField label="Handle" description="Lowercase, no spaces.">
        <DitherInput bind:value={handle} placeholder="ada" />
      </DitherField>
      <DitherField label="Website" error="That URL does not resolve.">
        <DitherInput bind:value={website} placeholder="https://" />
      </DitherField>
    </div>
  </DemoCard>
  <PropsTable rows={API.field} />
</section>

<section id="fieldset" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Fieldset</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Groups related fields inside a bordered box with a tracking-spaced
    legend — native <code class="text-foreground/80">&lt;fieldset&gt;</code>
    semantics, kit skin.
  </p>
  <DemoCard code={SNIPPET_FIELDSET}>
    <div class="mx-auto max-w-sm">
      <DitherFieldset legend="Profile">
        <DitherField label="Name" for="profile-name">
          <DitherInput id="profile-name" bind:value={profileName} />
        </DitherField>
        <DitherField label="Handle" for="profile-handle">
          <DitherInput id="profile-handle" bind:value={profileHandle} />
        </DitherField>
      </DitherFieldset>
    </div>
  </DemoCard>
  <PropsTable rows={API.fieldset} />
</section>

<section id="form" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Form</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    A deliberately tiny wrapper: <code class="text-foreground/80">novalidate</code>
    suppresses the browser's validation bubbles and submit is prevented and
    re-emitted as a clean <code class="text-foreground/80">submit</code> event.
  </p>
  <DemoCard code={SNIPPET_FORM}>
    <div class="mx-auto max-w-sm">
      <DitherForm onsubmit={() => submitted++}>
        <div class="grid gap-4">
          <DitherField label="Email" for="form-email">
            <DitherInput id="form-email" bind:value={formEmail} type="email" placeholder="you@dither-ui.com" />
          </DitherField>
          <DitherButton type="submit" color="blue" class="w-full">Subscribe</DitherButton>
          <p class="text-[11px] text-muted-foreground">submitted {submitted} times</p>
        </div>
      </DitherForm>
    </div>
  </DemoCard>
  <PropsTable rows={API.form} />
</section>

<section id="number-field" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">Number Field</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    Stepper buttons around a spinbutton input — arrow keys step, typed
    values clamp and snap to the step on blur, and the buttons disable at
    the bounds.
  </p>
  <DemoCard code={SNIPPET_NUMBER}>
    <div class="mx-auto flex max-w-sm items-center justify-center gap-4">
      <DitherNumberField bind:value={qty} min={0} max={10} />
      <span class="text-[13px] tabular-nums">{qty} / 10</span>
    </div>
  </DemoCard>
  <PropsTable rows={API.numberField} />
</section>

<section id="otp-field" class="mt-20 scroll-mt-20">
  <h2 class="text-lg tracking-tight">OTP Field</h2>
  <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
    One box per digit with auto-advancing focus — Backspace on an empty box
    steps back, and pasting a full code distributes it across the boxes.
    <code class="text-foreground/80">complete</code> fires once every box is
    filled.
  </p>
  <DemoCard code={SNIPPET_OTP}>
    <div class="mx-auto grid max-w-sm justify-items-center gap-3">
      <DitherOtpField bind:value={otp} length={6} oncomplete={() => (otpComplete = true)} />
      {#if otpComplete}
        <p class="text-[11px]" style:color={cssColor("green")}>complete!</p>
      {/if}
    </div>
  </DemoCard>
  <PropsTable rows={API.otpField} />
</section>
