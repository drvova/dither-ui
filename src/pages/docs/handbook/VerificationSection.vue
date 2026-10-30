<script setup lang="ts">
/* Verification, written as a lab report: each claim of the kit, how it is
   measured and against what, and the reading the reader's own browser
   takes, linked to the spec that holds the claim in CI. The checks run when
   the section comes into view (at once without IntersectionObserver) and
   again on demand, one per task so a cold first run never holds a frame;
   the results copy as a Markdown table for an issue. */
import { copyText, DitherIcon } from "@dither-kit"
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue"
import { play } from "@/shared/lib/sound"
import { REPO_URL } from "../seo"
import { CHECKS, type Check, engineOf, type Reading } from "./lab"

// A run: its conditions and the readings taken so far (all of them once it is done).
type Report = { conditions: string; readings: ReadonlyMap<string, Reading> }

const root = ref<HTMLElement | null>(null)
const report = shallowRef<Report | null>(null)
// The copy key in each state: its glyph, its label, what a screen reader hears.
const COPY_KEY = {
  idle: { icon: "Copy", label: "Copy the results", said: "" },
  copied: { icon: "Check", label: "Copied", said: "Results copied" },
  failed: { icon: "Close", label: "Copy failed", said: "The results could not be copied" },
} as const
const copyState = ref<keyof typeof COPY_KEY>("idle")
let timer: ReturnType<typeof setTimeout> | undefined

function measure(check: Check): Reading {
  try {
    return check.run()
  } catch (error) {
    return { holds: false, figure: error instanceof Error ? error.message : "it threw" }
  }
}

const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0))
// The run in progress; a newer run, or leaving the page, stops an older one.
let current = 0

async function run() {
  const mine = ++current
  const when = new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "medium" })
  const conditions = `${engineOf(navigator.userAgent)} on ${when}`
  const readings = new Map<string, Reading>()
  report.value = { conditions, readings: new Map(readings) }
  for (const check of CHECKS) {
    await nextTask()
    if (mine !== current) return
    readings.set(check.id, measure(check))
    report.value = { conditions, readings: new Map(readings) }
  }
}

// Each check beside its reading, none until the first run.
const rows = computed(() => CHECKS.map((check) => ({ check, reading: report.value?.readings.get(check.id) ?? null })))
const held = computed(() => rows.value.filter((r) => r.reading?.holds).length)
const measuring = computed(() => !!report.value && report.value.readings.size < CHECKS.length)

function again() {
  play("tap")
  run()
}

async function copy() {
  if (!report.value || measuring.value) return
  const { conditions, readings } = report.value
  const table = CHECKS.map((c) => {
    const r = readings.get(c.id)!
    return `| ${c.claim} | ${c.against} | ${r.figure} | ${r.holds ? "holds" : "fails"} |`
  })
  const text = [
    `dither-ui verification, measured in ${conditions}`,
    "",
    "| Claim | Against | Reading | Result |",
    "| --- | --- | --- | --- |",
    ...table,
  ].join("\n")
  const ok = await copyText(text)
  if (ok) play("copy")
  copyState.value = ok ? "copied" : "failed"
  clearTimeout(timer)
  timer = setTimeout(() => (copyState.value = "idle"), 1500)
}

let io: IntersectionObserver | null = null
onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return run()
  io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io?.disconnect()
      io = null
      run()
    },
    { rootMargin: "200px" },
  )
  if (root.value) io.observe(root.value)
})
onBeforeUnmount(() => {
  current++
  io?.disconnect()
  clearTimeout(timer)
})
</script>

<template>
  <section id="verification" ref="root" class="mt-16 scroll-mt-24">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 class="text-lg tracking-tight">Verification</h2>
      <div class="flex gap-2">
        <button
          type="button"
          class="-m-2 inline-flex items-center gap-1.5 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          @click="again"
        >
          <DitherIcon name="Refresh" :size="12" :stroke-width="1.5" />Measure again
        </button>
        <button
          type="button"
          class="-m-2 inline-flex items-center gap-1.5 p-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          :disabled="!report || measuring"
          @click="copy"
        >
          <DitherIcon :name="COPY_KEY[copyState].icon" :size="12" :stroke-width="1.5" />{{ COPY_KEY[copyState].label }}
        </button>
        <span class="sr-only" aria-live="polite">{{ COPY_KEY[copyState].said }}</span>
      </div>
    </div>
    <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
      The kit's claims, measured with its own engine in the browser reading this page: what each one claims, how it is
      measured and against what, then the reading. CI takes the same readings on every push, and each claim links the
      test that holds it.
    </p>
    <p class="mt-4 font-mono text-[12px] tabular-nums text-foreground" aria-live="polite">
      <template v-if="measuring">Measuring in {{ report!.conditions }}.</template>
      <template v-else-if="report"
        >Measured in {{ report.conditions }}: {{ held }} of {{ CHECKS.length }} claims hold.</template
      >
      <template v-else>Measured in your browser when this section comes into view.</template>
    </p>
    <dl class="mt-4 border-b border-border/60">
      <div
        v-for="{ check: c, reading } in rows"
        :key="c.id"
        class="grid gap-x-6 gap-y-1 border-t border-border/60 py-3.5 sm:grid-cols-[minmax(0,1fr)_15rem]"
      >
        <dt class="text-[13px] text-foreground">{{ c.claim }}</dt>
        <dd class="text-[13px] leading-relaxed text-muted-foreground sm:col-start-1 sm:row-start-2">
          {{ c.method }}
          <a
            :href="`${REPO_URL}/blob/master/${c.test}`"
            target="_blank"
            rel="noreferrer"
            class="whitespace-nowrap text-foreground underline decoration-border underline-offset-4 hover:decoration-current"
            >Its test<span class="sr-only">: {{ c.claim }} (opens in a new tab)</span></a
          >
        </dd>
        <dd
          class="flex items-baseline gap-1.5 font-mono text-[12px] tabular-nums max-sm:mt-1 sm:col-start-2 sm:row-start-1 sm:justify-end"
        >
          <template v-if="reading">
            <DitherIcon
              :name="reading.holds ? 'Check' : 'Close'"
              :size="12"
              :stroke-width="1.75"
              aria-hidden="true"
              class="shrink-0 self-center"
              :class="reading.holds ? 'text-foreground' : 'text-[var(--swatch-orange)]'"
            />
            <span :class="reading.holds ? 'text-foreground' : 'text-[var(--swatch-orange)]'"
              >{{ reading.figure }}<span class="sr-only">, {{ reading.holds ? "holds" : "fails" }}</span></span
            >
          </template>
          <span v-else class="text-muted-foreground">{{ report ? "measuring" : "not yet measured" }}</span>
        </dd>
        <dd class="font-mono text-[12px] text-muted-foreground sm:col-start-2 sm:row-start-2 sm:text-right">
          against {{ c.against }}
        </dd>
      </div>
    </dl>
  </section>
</template>
