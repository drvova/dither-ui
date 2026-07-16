<script setup lang="ts">
import { ref } from "vue"
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
} from "@dither-kit"
import DemoCard from "../DemoCard.vue"
import PropsTable, { type PropRow } from "../PropsTable.vue"

const name = ref("")
const email = ref("not-an-email")
const handle = ref("")
const bio = ref("Dithered interfaces, composed with Vue.")
const website = ref("")
const profileName = ref("Ada Byte")
const profileHandle = ref("ada")
const formEmail = ref("")
const submitted = ref(0)
const qty = ref(3)
const otp = ref("")
const otpComplete = ref(false)

const SNIPPET_INPUT = `<script setup lang="ts">
import { ref } from "vue"
import { DitherInput } from "@dither-kit"

const name = ref("")
const email = ref("not-an-email")
<\/script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <DitherInput v-model="name" placeholder="Ada Byte" />
    <DitherInput v-model="email" type="email" invalid placeholder="you@dither-ui.com" />
  </div>
</template>`

const SNIPPET_TEXTAREA = `<script setup lang="ts">
import { ref } from "vue"
import { DitherField, DitherTextarea } from "@dither-kit"

const bio = ref("")
<\/script>

<template>
  <DitherField label="Bio" description="A short introduction.">
    <DitherTextarea v-model="bio" placeholder="Tell us what you make…" />
  </DitherField>
</template>`

const SNIPPET_FIELD = `<script setup lang="ts">
import { ref } from "vue"
import { DitherField, DitherInput } from "@dither-kit"

const handle = ref("")
const website = ref("")
<\/script>

<template>
  <div class="grid gap-5">
    <DitherField label="Handle" description="Lowercase, no spaces.">
      <DitherInput v-model="handle" placeholder="ada" />
    </DitherField>
    <DitherField label="Website" error="That URL does not resolve.">
      <DitherInput v-model="website" placeholder="https://" />
    </DitherField>
  </div>
</template>`

const SNIPPET_FIELDSET = `<script setup lang="ts">
import { ref } from "vue"
import { DitherField, DitherFieldset, DitherInput } from "@dither-kit"

const name = ref("Ada Byte")
const handle = ref("ada")
<\/script>

<template>
  <DitherFieldset legend="Profile">
    <DitherField label="Name" for="profile-name">
      <DitherInput id="profile-name" v-model="name" />
    </DitherField>
    <DitherField label="Handle" for="profile-handle">
      <DitherInput id="profile-handle" v-model="handle" />
    </DitherField>
  </DitherFieldset>
</template>`

const SNIPPET_FORM = `<script setup lang="ts">
import { ref } from "vue"
import { DitherButton, DitherField, DitherForm, DitherInput } from "@dither-kit"

const email = ref("")
const submitted = ref(0)
<\/script>

<template>
  <DitherForm @submit="submitted++">
    <div class="grid gap-4">
      <DitherField label="Email" for="form-email">
        <DitherInput id="form-email" v-model="email" type="email" placeholder="you@dither-ui.com" />
      </DitherField>
      <DitherButton type="submit" color="blue" class="w-full">Subscribe</DitherButton>
      <p class="text-[11px] text-muted-foreground">submitted {{ submitted }} times</p>
    </div>
  </DitherForm>
</template>`

const SNIPPET_NUMBER = `<script setup lang="ts">
import { ref } from "vue"
import { DitherNumberField } from "@dither-kit"

const qty = ref(3)
<\/script>

<template>
  <div class="flex items-center gap-4">
    <DitherNumberField v-model="qty" :min="0" :max="10" />
    <span class="text-[13px] tabular-nums">{{ qty }} / 10</span>
  </div>
</template>`

const SNIPPET_OTP = `<script setup lang="ts">
import { ref } from "vue"
import { DitherOtpField } from "@dither-kit"

const otp = ref("")
const complete = ref(false)
<\/script>

<template>
  <div class="grid gap-3">
    <DitherOtpField v-model="otp" :length="6" @complete="complete = true" />
    <p v-if="complete" class="text-[11px]">complete!</p>
  </div>
</template>`

const API: Record<string, PropRow[]> = {
  input: [
    { prop: "modelValue", type: "string", default: '""' },
    { prop: "type", type: "string", default: '"text"' },
    { prop: "placeholder", type: "string", default: "—" },
    { prop: "disabled / readonly / invalid", type: "boolean", default: "false" },
    { prop: "class", type: "string", default: "—" },
  ],
  textarea: [
    { prop: "modelValue", type: "string", default: '""' },
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
    { prop: "modelValue", type: "number", default: "—" },
    { prop: "min", type: "number", default: "—" },
    { prop: "max", type: "number", default: "—" },
    { prop: "step", type: "number", default: "1" },
    { prop: "disabled", type: "boolean", default: "false" },
  ],
  otpField: [
    { prop: "length", type: "number", default: "6" },
    { prop: "modelValue", type: "string", default: '""' },
  ],
}
</script>

<template>
  <section id="input" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Input</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A monospace text input on the token border stack — the border warms to
      the accent on focus, and <code class="text-foreground/80">invalid</code>
      swaps it for the red seed with <code class="text-foreground/80">aria-invalid</code>.
    </p>
    <DemoCard :code="SNIPPET_INPUT">
      <div class="mx-auto grid max-w-md gap-3 sm:grid-cols-2">
        <DitherInput v-model="name" placeholder="Ada Byte" />
        <DitherInput v-model="email" type="email" invalid placeholder="you@dither-ui.com" />
      </div>
    </DemoCard>
    <PropsTable :rows="API.input" />
  </section>

  <section id="textarea" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Textarea</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The multiline companion to Input, with the same field context, invalid,
      read-only, focus, and disabled contracts. Resize behavior stays explicit.
    </p>
    <DemoCard :code="SNIPPET_TEXTAREA">
      <div class="mx-auto max-w-sm">
        <DitherField label="Bio" description="A short introduction.">
          <DitherTextarea v-model="bio" placeholder="Tell us what you make…" />
        </DitherField>
      </div>
    </DemoCard>
    <PropsTable :rows="API.textarea" />
  </section>

  <section id="field" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Field</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Label, control, and one line of small print — the
      <code class="text-foreground/80">error</code> replaces the description
      and drops a red pixel marker in front of the text.
    </p>
    <DemoCard :code="SNIPPET_FIELD">
      <div class="mx-auto grid max-w-sm gap-5">
        <DitherField label="Handle" description="Lowercase, no spaces.">
          <DitherInput v-model="handle" placeholder="ada" />
        </DitherField>
        <DitherField label="Website" error="That URL does not resolve.">
          <DitherInput v-model="website" placeholder="https://" />
        </DitherField>
      </div>
    </DemoCard>
    <PropsTable :rows="API.field" />
  </section>

  <section id="fieldset" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Fieldset</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Groups related fields inside a bordered box with a tracking-spaced
      legend — native <code class="text-foreground/80">&lt;fieldset&gt;</code>
      semantics, kit skin.
    </p>
    <DemoCard :code="SNIPPET_FIELDSET">
      <div class="mx-auto max-w-sm">
        <DitherFieldset legend="Profile">
          <DitherField label="Name" for="profile-name">
            <DitherInput id="profile-name" v-model="profileName" />
          </DitherField>
          <DitherField label="Handle" for="profile-handle">
            <DitherInput id="profile-handle" v-model="profileHandle" />
          </DitherField>
        </DitherFieldset>
      </div>
    </DemoCard>
    <PropsTable :rows="API.fieldset" />
  </section>

  <section id="form" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Form</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A deliberately tiny wrapper: <code class="text-foreground/80">novalidate</code>
      suppresses the browser's validation bubbles and submit is prevented and
      re-emitted as a clean <code class="text-foreground/80">submit</code> event.
    </p>
    <DemoCard :code="SNIPPET_FORM">
      <div class="mx-auto max-w-sm">
        <DitherForm @submit="submitted++">
          <div class="grid gap-4">
            <DitherField label="Email" for="form-email">
              <DitherInput id="form-email" v-model="formEmail" type="email" placeholder="you@dither-ui.com" />
            </DitherField>
            <DitherButton type="submit" color="blue" class="w-full">Subscribe</DitherButton>
            <p class="text-[11px] text-muted-foreground">submitted {{ submitted }} times</p>
          </div>
        </DitherForm>
      </div>
    </DemoCard>
    <PropsTable :rows="API.form" />
  </section>

  <section id="number-field" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Number Field</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Stepper buttons around a spinbutton input — arrow keys step, typed
      values clamp and snap to the step on blur, and the buttons disable at
      the bounds.
    </p>
    <DemoCard :code="SNIPPET_NUMBER">
      <div class="mx-auto flex max-w-sm items-center justify-center gap-4">
        <DitherNumberField v-model="qty" :min="0" :max="10" />
        <span class="text-[13px] tabular-nums">{{ qty }} / 10</span>
      </div>
    </DemoCard>
    <PropsTable :rows="API.numberField" />
  </section>

  <section id="otp-field" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">OTP Field</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      One box per digit with auto-advancing focus — Backspace on an empty box
      steps back, and pasting a full code distributes it across the boxes.
      <code class="text-foreground/80">complete</code> fires once every box is
      filled.
    </p>
    <DemoCard :code="SNIPPET_OTP">
      <div class="mx-auto grid max-w-sm justify-items-center gap-3">
        <DitherOtpField v-model="otp" :length="6" @complete="otpComplete = true" />
        <p v-if="otpComplete" class="text-[11px]" :style="{ color: cssColor('green') }">
          complete!
        </p>
      </div>
    </DemoCard>
    <PropsTable :rows="API.otpField" />
  </section>
</template>
