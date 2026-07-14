<script setup lang="ts">
import { reactive, ref } from "vue"
import { DitherButton, DitherGradient } from "@dither-kit"
import DemoCard from "../DemoCard.vue"

const PLANS = ["Free", "Pro", "Scale"] as const
const signup = reactive({ plan: "Free" as (typeof PLANS)[number] })

const magicEmail = ref("")
const sent = ref(false)

const codeInputs = ref<HTMLInputElement[]>([])
function onCodeInput(i: number) {
  const el = codeInputs.value[i]
  if (el?.value && i < 5) codeInputs.value[i + 1]?.focus()
}

const SNIPPET_SIGNUP = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="purple" direction="up" :opacity="0.16" />
  <span>dither-ui</span>                    <!-- wordmark -->
  <input name="signup-name" placeholder="Ada Byte" />
  <input name="signup-email" placeholder="you@dither-ui.com" />
  <input type="password" placeholder="••••••••" />
  <div role="group">                        <!-- plan picker -->
    <button v-for="p in plans" :aria-pressed="plan === p"
      @click="plan = p">{{ p }}</button>
  </div>
  <DitherButton color="purple" class="w-full">Create account</DitherButton>
</div>`

const SNIPPET_MAGIC = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="green" direction="up" :opacity="0.14" />
  <span>dither-ui</span>                    <!-- wordmark -->
  <template v-if="!sent">
    <input v-model="email" placeholder="you@dither-ui.com" />
    <DitherButton color="green" class="w-full" @click="sent = true">
      Send magic link
    </DitherButton>
  </template>
  <template v-else>
    <span>✓</span> Check your inbox — {{ email }}
    <button @click="sent = false">use a different email</button>
  </template>
</div>`

const SNIPPET_TWOFACTOR = `<div class="relative overflow-hidden rounded-lg border p-7">
  <DitherGradient from="blue" direction="up" :opacity="0.14" />
  <span>dither-ui</span>                    <!-- wordmark -->
  <div class="flex gap-2">                  <!-- code inputs -->
    <input v-for="i in 6" maxlength="1" inputmode="numeric"
      class="w-9 h-11 text-center" @input="focusNext(i)" />
  </div>
  <DitherButton color="blue" class="w-full">Verify</DitherButton>
  <button>resend in 24s</button>
</div>`
</script>

<template>
  <section id="signup" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Sign up</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      A signup card with a working plan picker — segmented control from plain
      aria-pressed buttons, purple wash behind.
    </p>
    <DemoCard :code="SNIPPET_SIGNUP">
      <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
        <DitherGradient from="purple" to="transparent" direction="up" :opacity="0.16" :cell="3" class="-z-10" />
        <div class="flex items-center gap-2">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          <span class="text-[12px] tracking-tight">dither-ui</span>
        </div>
        <p class="mt-1.5 text-[11px] text-muted-foreground">Create your workspace</p>
        <div class="mt-5 grid gap-2.5">
          <input
            type="text"
            name="signup-name"
            placeholder="Ada Byte"
            autocomplete="off"
            class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
          />
          <input
            type="email"
            name="signup-email"
            placeholder="you@dither-ui.com"
            autocomplete="off"
            class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
          />
          <input
            type="password"
            name="signup-password"
            placeholder="••••••••"
            autocomplete="off"
            class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
          />
          <div class="grid grid-cols-3 gap-1 rounded-md border border-border/60 p-1" role="group" aria-label="Plan">
            <button
              v-for="p in PLANS"
              :key="p"
              type="button"
              :aria-pressed="signup.plan === p"
              class="rounded px-2 py-1 text-[11px] transition-colors"
              :class="signup.plan === p ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'"
              @click="signup.plan = p"
            >
              {{ p }}
            </button>
          </div>
          <DitherButton color="purple" variant="gradient" class="w-full py-2 text-[11px]">Create account</DitherButton>
        </div>
      </div>
    </DemoCard>
  </section>

  <section id="magic-link" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Magic link</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Passwordless in two states — send the link, then echo the address back
      with a pixel checkmark. Green wash, green button.
    </p>
    <DemoCard :code="SNIPPET_MAGIC">
      <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
        <DitherGradient from="green" to="transparent" direction="up" :opacity="0.14" :cell="3" class="-z-10" />
        <div class="flex items-center gap-2">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          <span class="text-[12px] tracking-tight">dither-ui</span>
        </div>
        <template v-if="!sent">
          <p class="mt-1.5 text-[11px] text-muted-foreground">Sign in without a password</p>
          <div class="mt-5 grid gap-2.5">
            <input
              v-model="magicEmail"
              type="email"
              name="magic-email"
              placeholder="you@dither-ui.com"
              autocomplete="off"
              class="w-full rounded-md border border-border bg-background/60 px-2.5 py-1.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-accent/60"
            />
            <DitherButton color="green" variant="gradient" class="w-full py-2 text-[11px]" @click="sent = true">Send magic link</DitherButton>
          </div>
        </template>
        <div v-else class="mt-5 text-center">
          <span class="inline-block" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 10 10" class="text-foreground" shape-rendering="crispEdges">
              <path d="M1 5h1v1H1zM2 6h1v1H2zM3 7h1v1H3zM4 6h1v1H4zM5 5h1v1H5zM6 4h1v1H6zM7 3h1v1H7zM8 2h1v1H8z" fill="currentColor" />
            </svg>
          </span>
          <p class="mt-2 text-[12px] tracking-tight">Check your inbox</p>
          <p class="mt-1 text-[11px] text-muted-foreground">
            We sent a link to {{ magicEmail || "your email" }}
          </p>
          <button
            type="button"
            class="mt-4 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            @click="sent = false; magicEmail = ''"
          >
            use a different email
          </button>
        </div>
      </div>
    </DemoCard>
  </section>

  <section id="twofactor" class="mt-16 scroll-mt-24">
    <h2 class="text-lg tracking-tight">Two-factor</h2>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      Six code cells with auto-advancing focus — plain inputs, token borders,
      blue wash behind.
    </p>
    <DemoCard :code="SNIPPET_TWOFACTOR">
      <div class="relative isolate mx-auto max-w-xs overflow-hidden rounded-lg border border-border/60 p-7">
        <DitherGradient from="blue" to="transparent" direction="up" :opacity="0.14" :cell="3" class="-z-10" />
        <div class="flex items-center gap-2">
          <span class="inline-block size-2.5 rounded-[2px] bg-foreground" />
          <span class="text-[12px] tracking-tight">dither-ui</span>
        </div>
        <p class="mt-1.5 text-[11px] text-muted-foreground">Enter the code from your authenticator</p>
        <div class="mt-5 grid gap-2.5">
          <div class="flex justify-between gap-2" role="group" aria-label="Verification code">
            <input
              v-for="i in 6"
              :key="i"
              ref="codeInputs"
              type="text"
              maxlength="1"
              inputmode="numeric"
              :name="`twofactor-digit-${i}`"
              autocomplete="off"
              :aria-label="`Digit ${i}`"
              class="h-11 w-9 rounded-md border border-border bg-background/60 text-center text-[13px] text-foreground outline-none focus:border-accent/60"
              @input="onCodeInput(i - 1)"
            />
          </div>
          <DitherButton color="blue" variant="gradient" class="w-full py-2 text-[11px]">Verify</DitherButton>
        </div>
        <p class="mt-4 text-center">
          <button type="button" class="text-[10px] text-muted-foreground transition-colors hover:text-foreground">
            resend in 24s
          </button>
        </p>
      </div>
    </DemoCard>
  </section>
</template>
