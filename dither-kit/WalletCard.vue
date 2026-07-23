<script lang="ts">
export type WalletAccount = {
  value: string
  label: string
  address: string
  balance: number
  /** Percent change; sign picks the pill color. */
  change?: number
  color?: PixelColor
}
export type WalletAction = "send" | "deposit" | "swap" | "buy"

const ACTIONS: { name: WalletAction; glyph: string; label: string }[] = [
  { name: "send", glyph: "↑", label: "Send" },
  { name: "deposit", glyph: "↓", label: "Deposit" },
  { name: "swap", glyph: "⇄", label: "Swap" },
  { name: "buy", glyph: "+", label: "Buy" },
]
const FMT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const MASK = "*******"
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { cssColor } from "./palette"
import { CONTROL_BUTTON } from "./control"
import { cn } from "./lib"
import type { PixelColor } from "./pixel"

/** Wallet overview card — the account switcher and search morph open from
 * their triggers (the search panel lists recent queries), the balance
 * cascades in with a change pill and privacy toggle, the address copies with
 * feedback, a bell carries an unread pulse, and the four actions report
 * through one event. Explicit balance/change props override the active
 * account's numbers. */
const props = withDefaults(
  defineProps<{
    accounts: WalletAccount[]
    modelValue?: string
    /** Override the active account's balance. */
    balance?: number
    /** Override the active account's change. */
    change?: number
    currency?: string
    /** Start with the balance masked. */
    defaultHidden?: boolean
    searchPlaceholder?: string
    /** Recent queries listed in the morphed-open search panel. */
    recent?: string[]
    /** Show an unread pulse on the bell. */
    notifications?: boolean
    color?: PixelColor
    class?: string
  }>(),
  { currency: "$", defaultHidden: false, searchPlaceholder: "Search…", notifications: false, color: "green" }
)
const emit = defineEmits<{
  "update:modelValue": [value: string]
  action: [name: WalletAction]
  /** Live query text on every keystroke. */
  search: [query: string]
  /** Committed query — Enter or a recent row. */
  submit: [query: string]
  notify: []
}>()

const account = computed(
  () => props.accounts.find((a) => a.value === props.modelValue) ?? props.accounts[0]
)
const rootRef = ref<HTMLElement | null>(null)
const switcherRef = ref<HTMLButtonElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)
const switching = ref(false)
const searching = ref(false)
const hidden = ref(props.defaultHidden)
const copied = ref(false)
const query = ref("")

const shownBalance = computed(() => props.balance ?? account.value?.balance ?? 0)
const change = computed(() => props.change ?? account.value?.change ?? 0)
const digits = computed(() =>
  hidden.value ? MASK.split("") : `${props.currency}${FMT.format(shownBalance.value)}`.split("")
)
const changeColor = computed(() => cssColor(change.value < 0 ? "red" : "green"))
const shortAddress = computed(() => {
  const a = account.value?.address ?? ""
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a
})

function onOutside(e: PointerEvent) {
  if (rootRef.value?.contains(e.target as Node)) return
  switching.value = false
  searching.value = false
}
function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return
  if (switching.value) switcherRef.value?.focus()
  switching.value = false
  searching.value = false
}
let timer = 0
watch([switching, searching], ([a, b]) => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", onOutside)
  window.removeEventListener("keydown", onKey)
  if (a || b) {
    // defer so the opening click doesn't immediately close it
    timer = window.setTimeout(() => {
      window.addEventListener("pointerdown", onOutside)
      window.addEventListener("keydown", onKey)
    }, 0)
  }
})
onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener("pointerdown", onOutside)
  window.removeEventListener("keydown", onKey)
})

function pick(value: string) {
  emit("update:modelValue", value)
  switching.value = false
  switcherRef.value?.focus()
}
function openSearch() {
  searching.value = true
  nextTick(() => searchInput.value?.focus())
}
function type() {
  emit("search", query.value)
}
function submitSearch(q?: string) {
  if (q !== undefined) query.value = q
  emit("submit", query.value)
}
async function copy() {
  try {
    await navigator.clipboard.writeText(account.value?.address ?? "")
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1400)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div
    ref="rootRef"
    :class="cn('relative w-80 rounded-xl border border-border/70 bg-card/80 p-4 font-mono select-none', props.class)"
  >
    <div class="flex items-center justify-between gap-2">
      <button
        ref="switcherRef"
        type="button"
        :aria-expanded="switching"
        aria-haspopup="listbox"
        :class="cn(CONTROL_BUTTON, 'flex min-w-0 items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-[12px] text-foreground transition-colors hover:bg-background')"
        @click="switching = !switching; searching = false"
      >
        <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full" :style="{ background: cssColor(account?.color ?? props.color) }" />
        <span class="truncate">{{ account?.label }}</span>
        <span aria-hidden="true" class="text-[10px] text-muted-foreground transition-transform duration-200 motion-reduce:transition-none" :class="switching ? 'rotate-180' : ''">▾</span>
      </button>
      <div class="flex shrink-0 items-center gap-1">
        <div
          class="flex h-8 items-center overflow-hidden rounded-md border border-border/60 bg-background/60 transition-[width] duration-200 ease-out motion-reduce:transition-none"
          :style="{ width: searching ? '148px' : '32px' }"
        >
          <button
            v-if="!searching"
            type="button"
            aria-label="Search wallet"
            :class="cn(CONTROL_BUTTON, 'grid size-8 shrink-0 place-items-center text-[13px] text-muted-foreground transition-colors hover:text-foreground')"
            @click="openSearch"
          >
            ⌕
          </button>
          <template v-else>
            <span aria-hidden="true" class="pl-2.5 text-[13px] text-muted-foreground">⌕</span>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              aria-label="Search wallet"
              :placeholder="props.searchPlaceholder"
              class="w-full bg-transparent px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
              @input="type"
              @keydown.enter="submitSearch()"
            />
          </template>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          :class="cn(CONTROL_BUTTON, 'relative grid size-8 place-items-center rounded-md border border-border/60 bg-background/60 text-[13px] text-muted-foreground transition-colors hover:text-foreground')"
          @click="emit('notify')"
        >
          ⍾
          <span v-if="props.notifications" aria-hidden="true" class="absolute top-1.5 right-1.5 flex size-1.5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" :style="{ background: cssColor(props.color) }" />
            <span class="relative inline-flex size-1.5 rounded-full" :style="{ background: cssColor(props.color) }" />
          </span>
        </button>
      </div>
    </div>

    <Transition name="dk-wc-morph">
      <ul
        v-if="switching"
        role="listbox"
        aria-label="Accounts"
        class="absolute top-12 left-4 z-20 min-w-44 origin-top-left rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      >
        <li v-for="a in props.accounts" :key="a.value">
          <button
            type="button"
            role="option"
            :aria-selected="a.value === account?.value"
            :class="cn(CONTROL_BUTTON, 'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-background/60', a.value === account?.value ? 'text-foreground' : 'text-muted-foreground')"
            @click="pick(a.value)"
          >
            <span aria-hidden="true" class="size-1.5 shrink-0 rounded-full" :style="{ background: cssColor(a.color ?? props.color) }" />
            <span class="min-w-0 flex-1 truncate">{{ a.label }}</span>
            <span v-if="a.value === account?.value" aria-hidden="true">✓</span>
          </button>
        </li>
      </ul>
    </Transition>

    <Transition name="dk-wc-morph">
      <div
        v-if="searching && props.recent?.length && !query"
        class="absolute top-12 right-14 z-20 min-w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)]"
      >
        <div class="px-2.5 pt-1 pb-0.5 text-[9px] tracking-[0.2em] text-muted-foreground/70 uppercase">Recent</div>
        <button
          v-for="r in props.recent"
          :key="r"
          type="button"
          :class="cn(CONTROL_BUTTON, 'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground')"
          @click="submitSearch(r)"
        >
          <span aria-hidden="true" class="text-[11px]">⌕</span>
          <span class="min-w-0 flex-1 truncate">{{ r }}</span>
        </button>
      </div>
    </Transition>

    <div class="mt-5 flex flex-col items-center text-center">
      <div class="flex items-center gap-1.5">
        <span class="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Balance</span>
        <button
          type="button"
          :aria-pressed="hidden"
          :aria-label="hidden ? 'Show balance' : 'Hide balance'"
          class="text-[11px] text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
          @click="hidden = !hidden"
        >
          {{ hidden ? "◒" : "◉" }}
        </button>
      </div>
      <div class="mt-1 flex text-[24px] leading-none text-foreground" aria-live="polite">
        <span
          v-for="(c, i) in digits"
          :key="`${account?.value}-${hidden}-${i}-${c}`"
          class="dk-wc-digit motion-reduce:animate-none"
          :style="{ animationDelay: `${i * 36}ms` }"
        >{{ c }}</span>
      </div>
      <div class="mt-1.5 flex h-6 items-center justify-center">
        <span
          v-if="hidden"
          class="translate-y-[2px] text-[12px] leading-none tracking-[0.3em] text-muted-foreground"
          aria-hidden="true"
        >*****</span>
        <span
          v-else
          class="relative overflow-hidden rounded-full px-2 py-0.5 text-[10px]"
          :style="{ color: changeColor }"
        >
          <span aria-hidden="true" class="absolute inset-0 opacity-15" :style="{ background: changeColor }" />
          <span class="relative flex items-center gap-1">
            <span aria-hidden="true" class="size-1 animate-pulse rounded-full motion-reduce:animate-none" :style="{ background: changeColor }" />
            {{ change < 0 ? "▼" : "▲" }} {{ Math.abs(change).toFixed(1) }}%
          </span>
        </span>
      </div>
      <button
        type="button"
        :aria-label="copied ? 'Address copied' : 'Copy address'"
        :class="cn(CONTROL_BUTTON, 'mt-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground')"
        @click="copy"
      >
        <span>{{ shortAddress }}</span>
        <span aria-hidden="true" :style="copied ? { color: cssColor(props.color) } : undefined">{{ copied ? "✓" : "⧉" }}</span>
      </button>
    </div>

    <div class="mt-4 grid grid-cols-4 gap-2">
      <button
        v-for="a in ACTIONS"
        :key="a.name"
        type="button"
        :class="cn(CONTROL_BUTTON, 'flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-background/60 py-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground')"
        @click="emit('action', a.name)"
      >
        <span aria-hidden="true" class="text-[14px]" :style="{ color: cssColor(props.color) }">{{ a.glyph }}</span>
        <span class="text-[10px]">{{ a.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dk-wc-digit {
  animation: dk-wc-rise 260ms cubic-bezier(0.2, 0, 0, 1) both;
}
@keyframes dk-wc-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.dk-wc-morph-enter-active,
.dk-wc-morph-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms cubic-bezier(0.2, 0, 0, 1);
}
.dk-wc-morph-enter-from,
.dk-wc-morph-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
@media (prefers-reduced-motion: reduce) {
  .dk-wc-digit {
    animation: none;
  }
  .dk-wc-morph-enter-active,
  .dk-wc-morph-leave-active {
    transition: none;
  }
}
</style>
