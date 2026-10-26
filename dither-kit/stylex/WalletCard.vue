<!-- Generated from ../tailwind/WalletCard.vue by src/shared/lib/stylex-layer.ts: edit that file, then npx rs test -u tests/stylex-layer.spec.ts -->
<script lang="ts">
import * as stylex from "@stylexjs/stylex"

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

const styles = stylex.create({
  frame: {
    position: "relative",
    width: "20rem",
    borderRadius: "0.75rem",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 70%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--card) 80%, transparent)",
    padding: "1rem",
    fontFamily: "var(--font-mono)",
    WebkitUserSelect: "none",
    userSelect: "none",
  },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" },
  button: {
    display: "flex",
    minWidth: "0px",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    fontSize: "12px",
    color: "var(--foreground)",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text: { width: "0.375rem", height: "0.375rem", flexShrink: "0", borderRadius: "calc(infinity * 1px)" },
  text2: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  text3: {
    fontSize: "10px",
    color: "var(--muted-foreground)",
    transitionProperty: {
      default: "transform, translate, scale, rotate",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  text4: { rotate: "180deg" },
  row2: { display: "flex", flexShrink: "0", alignItems: "center", gap: "0.25rem" },
  row3: {
    display: "flex",
    height: "2rem",
    alignItems: "center",
    overflow: "hidden",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    transitionProperty: { default: "width", "@media (prefers-reduced-motion: reduce)": "none" },
    transitionTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
    transitionDuration: "200ms",
  },
  button2: {
    display: "grid",
    width: "2rem",
    height: "2rem",
    flexShrink: "0",
    placeItems: "center",
    fontSize: "13px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text5: { paddingLeft: "0.625rem", fontSize: "13px", color: "var(--muted-foreground)" },
  input: {
    width: "100%",
    backgroundColor: "transparent",
    paddingInline: "0.5rem",
    fontSize: "12px",
    color: "var(--foreground)",
    outlineStyle: "none",
    "::placeholder": { color: "color-mix(in oklab, var(--muted-foreground) 60%, transparent)" },
  },
  button3: {
    position: "relative",
    display: "grid",
    width: "2rem",
    height: "2rem",
    placeItems: "center",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: "color-mix(in oklab, var(--background) 60%, transparent)",
    fontSize: "13px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  row4: {
    position: "absolute",
    top: "0.375rem",
    right: "0.375rem",
    display: "flex",
    width: "0.375rem",
    height: "0.375rem",
  },
  row5: {
    position: "absolute",
    display: "inline-flex",
    height: "100%",
    width: "100%",
    animation: {
      default: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    borderRadius: "calc(infinity * 1px)",
    opacity: "60%",
  },
  row6: {
    position: "relative",
    display: "inline-flex",
    width: "0.375rem",
    height: "0.375rem",
    borderRadius: "calc(infinity * 1px)",
  },
  ul: {
    position: "absolute",
    top: "3rem",
    left: "1rem",
    zIndex: "20",
    minWidth: "11rem",
    transformOrigin: "0 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  button4: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "12px",
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--background) 60%, transparent)",
      },
    },
  },
  textForeground: { color: "var(--foreground)" },
  textMutedForeground: { color: "var(--muted-foreground)" },
  text6: { minWidth: "0px", flex: "1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  layer: {
    position: "absolute",
    top: "3rem",
    right: "3.5rem",
    zIndex: "20",
    minWidth: "10rem",
    transformOrigin: "100% 0",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "var(--border)",
    backgroundColor: "var(--card)",
    padding: "0.25rem",
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.7)",
  },
  box: {
    paddingInline: "0.625rem",
    paddingTop: "0.25rem",
    paddingBottom: "0.125rem",
    fontSize: "9px",
    letterSpacing: "0.2em",
    color: "color-mix(in oklab, var(--muted-foreground) 70%, transparent)",
    textTransform: "uppercase",
  },
  button5: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: "0.5rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.625rem",
    paddingBlock: "0.375rem",
    textAlign: "left",
    fontSize: "12px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    backgroundColor: {
      default: null,
      ":hover": {
        default: null,
        "@media (hover: hover)": "color-mix(in oklab, var(--background) 60%, transparent)",
      },
    },
  },
  text7: { fontSize: "11px" },
  stack: {
    marginTop: "1.25rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  row7: { display: "flex", alignItems: "center", gap: "0.375rem" },
  text8: {
    fontSize: "10px",
    letterSpacing: "0.2em",
    color: "var(--muted-foreground)",
    textTransform: "uppercase",
  },
  button6: {
    fontSize: "11px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
      ":focus-visible": "var(--foreground)",
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
    outlineStyle: "none",
  },
  row8: {
    marginTop: "0.25rem",
    display: "flex",
    fontSize: "24px",
    lineHeight: "1",
    color: "var(--foreground)",
  },
  text9: { animation: { default: null, "@media (prefers-reduced-motion: reduce)": "none" } },
  row9: {
    marginTop: "0.375rem",
    display: "flex",
    height: "1.5rem",
    alignItems: "center",
    justifyContent: "center",
  },
  text10: {
    translate: "0 2px",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "0.3em",
    color: "var(--muted-foreground)",
  },
  frame2: {
    position: "relative",
    overflow: "hidden",
    borderRadius: "calc(infinity * 1px)",
    paddingInline: "0.5rem",
    paddingBlock: "0.125rem",
    fontSize: "10px",
  },
  layer2: { position: "absolute", inset: "0px", opacity: "15%" },
  row10: { position: "relative", display: "flex", alignItems: "center", gap: "0.25rem" },
  text11: {
    width: "0.25rem",
    height: "0.25rem",
    animation: {
      default: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    borderRadius: "calc(infinity * 1px)",
  },
  button7: {
    marginTop: "0.25rem",
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    borderRadius: "var(--radius)",
    paddingInline: "0.375rem",
    paddingBlock: "0.25rem",
    fontSize: "11px",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  grid: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "0.5rem",
  },
  button8: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    borderRadius: "calc(var(--radius) + 2px)",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: "color-mix(in oklab, var(--border) 60%, transparent)",
    backgroundColor: {
      default: "color-mix(in oklab, var(--background) 60%, transparent)",
      ":hover": { default: null, "@media (hover: hover)": "var(--background)" },
    },
    paddingBlock: "0.5rem",
    color: {
      default: "var(--muted-foreground)",
      ":hover": { default: null, "@media (hover: hover)": "var(--foreground)" },
    },
    transitionProperty: "color, background-color, border-color, outline-color, text-decoration-color, fill, stroke",
    transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    transitionDuration: "150ms",
  },
  text12: { fontSize: "14px" },
  text13: { fontSize: "10px" },
})
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { cssColor } from "../engine/palette"
import { CONTROL_BUTTON } from "./control"
import { cn, type StyleProp } from "./lib"
import { copyText } from "../engine/copy-text"
import type { PixelColor } from "../engine/pixel"

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
    xstyle?: StyleProp
  }>(),
  { currency: "$", defaultHidden: false, searchPlaceholder: "Search…", notifications: false, color: "green" },
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

const account = computed(() => props.accounts.find((a) => a.value === props.modelValue) ?? props.accounts[0])
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
  hidden.value ? MASK.split("") : `${props.currency}${FMT.format(shownBalance.value)}`.split(""),
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
  copied.value = await copyText(account.value?.address ?? "")
  if (copied.value)
    setTimeout(() => {
      copied.value = false
    }, 1400)
}
</script>

<template>
  <div ref="rootRef" :class="cn(styles.frame, props.xstyle, props.class)">
    <div v-bind="stylex.attrs(styles.row)">
      <button
        ref="switcherRef"
        type="button"
        :aria-expanded="switching"
        aria-haspopup="listbox"
        :class="cn(CONTROL_BUTTON, styles.button)"
        @click="
          () => {
            switching = !switching
            searching = false
          }
        "
      >
        <span
          aria-hidden="true"
          v-bind="stylex.attrs(styles.text)"
          :style="{ background: cssColor(account?.color ?? props.color) }"
        />
        <span v-bind="stylex.attrs(styles.text2)">{{ account?.label }}</span>
        <span aria-hidden="true" :class="cn(styles.text3, switching ? styles.text4 : null)">▾</span>
      </button>
      <div v-bind="stylex.attrs(styles.row2)">
        <div v-bind="stylex.attrs(styles.row3)" :style="{ width: searching ? '148px' : '32px' }">
          <button
            v-if="!searching"
            type="button"
            aria-label="Search wallet"
            :class="cn(CONTROL_BUTTON, styles.button2)"
            @click="openSearch"
          >
            ⌕
          </button>
          <template v-else>
            <span aria-hidden="true" v-bind="stylex.attrs(styles.text5)">⌕</span>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              aria-label="Search wallet"
              :placeholder="props.searchPlaceholder"
              v-bind="stylex.attrs(styles.input)"
              @input="type"
              @keydown.enter="submitSearch()"
            />
          </template>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          :class="cn(CONTROL_BUTTON, styles.button3)"
          @click="emit('notify')"
        >
          ⍾
          <span v-if="props.notifications" aria-hidden="true" v-bind="stylex.attrs(styles.row4)">
            <span v-bind="stylex.attrs(styles.row5)" :style="{ background: cssColor(props.color) }" />
            <span v-bind="stylex.attrs(styles.row6)" :style="{ background: cssColor(props.color) }" />
          </span>
        </button>
      </div>
    </div>

    <Transition name="dk-wc-morph">
      <ul v-if="switching" role="listbox" aria-label="Accounts" v-bind="stylex.attrs(styles.ul)">
        <li v-for="a in props.accounts" :key="a.value">
          <button
            type="button"
            role="option"
            :aria-selected="a.value === account?.value"
            :class="
              cn(
                CONTROL_BUTTON,
                styles.button4,
                a.value === account?.value ? styles.textForeground : styles.textMutedForeground,
              )
            "
            @click="pick(a.value)"
          >
            <span
              aria-hidden="true"
              v-bind="stylex.attrs(styles.text)"
              :style="{ background: cssColor(a.color ?? props.color) }"
            />
            <span v-bind="stylex.attrs(styles.text6)">{{ a.label }}</span>
            <span v-if="a.value === account?.value" aria-hidden="true">✓</span>
          </button>
        </li>
      </ul>
    </Transition>

    <Transition name="dk-wc-morph">
      <div v-if="searching && props.recent?.length && !query" v-bind="stylex.attrs(styles.layer)">
        <div v-bind="stylex.attrs(styles.box)">Recent</div>
        <button
          v-for="r in props.recent"
          :key="r"
          type="button"
          :class="cn(CONTROL_BUTTON, styles.button5)"
          @click="submitSearch(r)"
        >
          <span aria-hidden="true" v-bind="stylex.attrs(styles.text7)">⌕</span>
          <span v-bind="stylex.attrs(styles.text6)">{{ r }}</span>
        </button>
      </div>
    </Transition>

    <div v-bind="stylex.attrs(styles.stack)">
      <div v-bind="stylex.attrs(styles.row7)">
        <span v-bind="stylex.attrs(styles.text8)">Balance</span>
        <button
          type="button"
          :aria-pressed="hidden"
          :aria-label="hidden ? 'Show balance' : 'Hide balance'"
          v-bind="stylex.attrs(styles.button6)"
          @click="hidden = !hidden"
        >
          {{ hidden ? "◒" : "◉" }}
        </button>
      </div>
      <div v-bind="stylex.attrs(styles.row8)" aria-live="polite">
        <span
          v-for="(c, i) in digits"
          :key="`${account?.value}-${hidden}-${i}-${c}`"
          v-bind="stylex.attrs(styles.text9)"
          class="dk-wc-digit"
          :style="{ animationDelay: `${i * 36}ms` }"
          >{{ c }}</span
        >
      </div>
      <div v-bind="stylex.attrs(styles.row9)">
        <span v-if="hidden" v-bind="stylex.attrs(styles.text10)" aria-hidden="true">*****</span>
        <span v-else v-bind="stylex.attrs(styles.frame2)" :style="{ color: changeColor }">
          <span aria-hidden="true" v-bind="stylex.attrs(styles.layer2)" :style="{ background: changeColor }" />
          <span v-bind="stylex.attrs(styles.row10)">
            <span aria-hidden="true" v-bind="stylex.attrs(styles.text11)" :style="{ background: changeColor }" />
            {{ change < 0 ? "▼" : "▲" }} {{ Math.abs(change).toFixed(1) }}%
          </span>
        </span>
      </div>
      <button
        type="button"
        :aria-label="copied ? 'Address copied' : 'Copy address'"
        :class="cn(CONTROL_BUTTON, styles.button7)"
        @click="copy"
      >
        <span>{{ shortAddress }}</span>
        <span aria-hidden="true" :style="copied ? { color: cssColor(props.color) } : undefined">{{
          copied ? "✓" : "⧉"
        }}</span>
      </button>
    </div>

    <div v-bind="stylex.attrs(styles.grid)">
      <button
        v-for="a in ACTIONS"
        :key="a.name"
        type="button"
        :class="cn(CONTROL_BUTTON, styles.button8)"
        @click="emit('action', a.name)"
      >
        <span aria-hidden="true" v-bind="stylex.attrs(styles.text12)" :style="{ color: cssColor(props.color) }">{{
          a.glyph
        }}</span>
        <span v-bind="stylex.attrs(styles.text13)">{{ a.label }}</span>
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
