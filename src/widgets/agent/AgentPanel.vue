<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { DitherFocusScope } from "@dither-kit"
import { editor, selectArtboard, selectedArtboard } from "@/entities/editor"
import { evolveSelected, runCommand } from "@/features/agent"
import {
  type AgentConfig,
  type AgentEvent,
  type AgentMessage,
  DEFAULT_MODELS,
  loadAgentConfig,
  runAgent,
  saveAgentConfig,
  type Usage,
} from "@/features/agent/llm"
import { undo } from "@/features/history"

// The agent panel is a COMPOSER in the sense pi, omp and Claude Code users
// know: a transcript of turns (your prompt, the agent's prose, one
// collapsible block per tool call with its arguments and the Studio's
// answer), a prompt line with slash commands, ↑/↓ history and Esc to stop,
// steering (type while it works — delivered before its next turn), and a
// status line with the model, the session's token usage and the last
// turn's time. Every tool call runs through the Studio protocol, so each
// placement is one undo away.
const emit = defineEmits<{ close: [] }>()

/* ------------------------------ configuration ----------------------------- */

const config = ref<AgentConfig>(loadAgentConfig())
const configured = computed(() => config.value.apiKey.trim().length > 0 && config.value.model.trim().length > 0)
const settingsOpen = ref(!configured.value)
watch(
  () => config.value.kind,
  (kind, prev) => {
    if (config.value.model === DEFAULT_MODELS[prev] || !config.value.model) config.value.model = DEFAULT_MODELS[kind]
  },
)
watch(config, (c) => saveAgentConfig(c), { deep: true })
const maskedKey = computed(() => (config.value.apiKey ? `…${config.value.apiKey.slice(-4)}` : "no key"))

/* -------------------------------- transcript ------------------------------ */

type Entry =
  | { kind: "user" | "assistant" | "system" | "error" | "steer"; text: string }
  | { kind: "tool"; name: string; args: Record<string, unknown>; ok: boolean; summary: string; detail: string; open: boolean }

const entries = ref<Entry[]>([])
const transcript = ref<AgentMessage[]>([])
const log = ref<HTMLElement | null>(null)
const scrollLog = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))
const push = (e: Entry) => {
  entries.value.push(e)
  scrollLog()
}

/* --------------------------------- status --------------------------------- */

const busy = ref(false)
const step = ref(0)
const started = ref(0)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | undefined
const elapsed = computed(() => (busy.value ? Math.max(0, now.value - started.value) : 0))
const session = ref<Usage>({ input: 0, output: 0 })
const lastTurnMs = ref(0)
const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : String(n))
const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`)

/* ---------------------------- tool call rendering -------------------------- */

const short = (v: unknown, n = 36): string => {
  const s = typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : typeof v === "object" && v ? "{…}" : String(v)
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function describeArgs(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "add_screen":
      return `${short(args.name ?? "screen")} · ${Array.isArray(args.rows) ? args.rows.length : 0} rows`
    case "add_component":
      return `${short(args.is)}${args.name ? ` · ${short(args.name)}` : ""}`
    case "add_chart": {
      const d = args.data as { labels?: unknown[] } | undefined
      return `${short(args.chart)}${args.name ? ` · ${short(args.name)}` : ""}${d?.labels ? ` · ${d.labels.length} points` : ""}`
    }
    case "add_widget":
      return short(args.widget)
    case "update_artboard":
      return `${short(args.id, 14)} · ${Object.keys((args.patch as object) ?? {}).join(", ") || "patch"}`
    case "evolve":
      return `×${args.count ?? 4}${args.strength != null ? ` · strength ${args.strength}` : ""}`
    case "get_registry":
      return args.is ? short(args.is) : "all"
    default:
      return Object.entries(args)
        .filter(([, v]) => v != null)
        .map(([k, v]) => `${k}=${short(v, 20)}`)
        .join(" ")
  }
}

function describeResult(result: { ok: true; data: unknown } | { ok: false; error: string }): string {
  if (!result.ok) return result.error
  const d = result.data as Record<string, unknown> | unknown[] | null
  if (Array.isArray(d)) return `${d.length} ${d.length === 1 ? "item" : "items"}`
  if (d && typeof d === "object") {
    if (typeof d.code === "string") return `${d.code.split("\n").length} lines`
    if (typeof d.name === "string") return `${d.name}${typeof d.kind === "string" ? ` · ${d.kind}` : ""}${Array.isArray(d.dropped) && d.dropped.length ? ` · dropped ${d.dropped.join(", ")}` : ""}`
    if (Array.isArray(d.components)) return `${d.components.length} components`
    if (Array.isArray(d.artboards)) return `${d.artboards.length} frames`
    if (typeof d.removed === "string") return "removed"
  }
  return "ok"
}

function onEvent(e: AgentEvent) {
  if (e.type === "assistant") push({ kind: "assistant", text: e.text })
  else if (e.type === "steer") push({ kind: "steer", text: e.text })
  else if (e.type === "tool") {
    const detail = `${JSON.stringify(e.args, null, 1)}\n→ ${e.result.ok ? JSON.stringify(e.result.data, null, 1).slice(0, 1600) : e.result.error}`
    push({ kind: "tool", name: e.name, args: e.args, ok: e.result.ok, summary: `${describeArgs(e.name, e.args)}  ⎿ ${describeResult(e.result)}`, detail, open: !e.result.ok })
  } else if (e.type === "turn") {
    step.value = e.step
    lastTurnMs.value = e.elapsedMs
    if (e.usage) session.value = { input: session.value.input + e.usage.input, output: session.value.output + e.usage.output }
  } else if (e.type === "error") push({ kind: "error", text: e.message })
}

/* -------------------------------- composer -------------------------------- */

const input = ref("")
const box = ref<HTMLTextAreaElement | null>(null)
const history = ref<string[]>([])
let cursor = -1
let draft = ""
const steering = ref<string[]>([])
let controller: AbortController | null = null

const rows = computed(() => Math.min(6, Math.max(1, input.value.split("\n").length)))

type Slash = { name: string; args?: string; desc: string }
const SLASH: Slash[] = [
  { name: "help", desc: "list commands" },
  { name: "model", args: "<name>", desc: "switch the model" },
  { name: "provider", args: "anthropic | openai", desc: "switch the wire format" },
  { name: "base", args: "<url>", desc: "OpenAI-compatible base URL" },
  { name: "key", args: "<api key>", desc: "set the API key (not echoed)" },
  { name: "remember", args: "on | off", desc: "keep the key on this device" },
  { name: "settings", desc: "toggle the settings form" },
  { name: "evolve", args: "[count]", desc: "seeded variants of the selection" },
  { name: "select", args: "<name>", desc: "select a frame by name" },
  { name: "code", desc: "the selection as a Vue SFC" },
  { name: "undo", desc: "undo the last edit" },
  { name: "clear", desc: "clear the transcript" },
  { name: "stop", desc: "interrupt the run" },
]
const slashOpen = computed(() => /^\/[\w-]*$/.test(input.value))
const slashMatches = computed(() => {
  const q = input.value.slice(1).toLowerCase()
  return SLASH.filter((c) => c.name.startsWith(q))
})
const slashIndex = ref(0)
watch(slashMatches, () => (slashIndex.value = 0))

function system(text: string) {
  push({ kind: "system", text })
}

function slash(line: string): boolean {
  const [cmd, ...rest] = line.slice(1).trim().split(/\s+/)
  const arg = rest.join(" ").trim()
  switch (cmd) {
    case "help":
      system(SLASH.map((c) => `/${c.name}${c.args ? ` ${c.args}` : ""} — ${c.desc}`).join("\n"))
      return true
    case "model":
      if (arg) config.value.model = arg
      system(`model ${config.value.model}`)
      return true
    case "provider":
      if (arg === "anthropic" || arg === "openai") config.value.kind = arg
      system(`provider ${config.value.kind}`)
      return true
    case "base":
      config.value.baseUrl = arg
      system(arg ? `base ${arg}` : "base reset to the provider default")
      return true
    case "key":
      if (arg) config.value.apiKey = arg
      system(`key ${maskedKey.value}`)
      return true
    case "remember":
      if (arg === "on" || arg === "off") config.value.remember = arg === "on"
      system(`remember ${config.value.remember ? "on" : "off"}`)
      return true
    case "settings":
      settingsOpen.value = !settingsOpen.value
      return true
    case "evolve": {
      const count = Number(arg) || undefined
      const gen = evolveSelected({ count })
      system(gen.length ? `evolve → ${gen.length} variants` : "select a frame first")
      return true
    }
    case "select": {
      const q = arg.toLowerCase()
      const hit = editor.artboards.find((a) => a.name.toLowerCase().includes(q) || a.id === arg)
      if (hit) selectArtboard(hit.id)
      system(hit ? `selected ${hit.name}` : `no frame matches "${arg}"`)
      return true
    }
    case "code": {
      const a = selectedArtboard.value
      const r = a ? runCommand({ type: "code.get", id: a.id }) : null
      system(r?.ok ? String((r.data as { code: string }).code) : "select a frame first")
      return true
    }
    case "undo":
      undo()
      system("undone")
      return true
    case "clear":
      entries.value = []
      transcript.value = []
      session.value = { input: 0, output: 0 }
      return true
    case "stop":
      stop()
      return true
    default:
      system(`unknown command /${cmd} — try /help`)
      return true
  }
}

async function send() {
  const text = input.value.trim()
  if (!text) return
  input.value = ""
  cursor = -1
  draft = ""
  if (text.startsWith("/")) {
    slash(text)
    return
  }
  if (!configured.value) {
    system("add an API key first: /key <key>, or the ⚙ form")
    return
  }
  history.value.push(text)
  if (busy.value) {
    // Steering: shown immediately, delivered before the agent's next turn.
    steering.value.push(text)
    return
  }
  push({ kind: "user", text })
  busy.value = true
  step.value = 0
  started.value = Date.now()
  now.value = started.value
  clock = setInterval(() => (now.value = Date.now()), 250)
  controller = new AbortController()
  const { remember: _remember, ...provider } = config.value
  void _remember
  transcript.value = await runAgent({
    provider,
    goal: text,
    history: transcript.value,
    onEvent,
    signal: controller.signal,
    pull: () => steering.value.splice(0),
  })
  // Anything still queued after the run becomes the next prompt.
  const leftover = steering.value.splice(0)
  clearInterval(clock)
  busy.value = false
  controller = null
  if (leftover.length) {
    input.value = leftover.join("\n")
    void send()
  }
}

function stop() {
  controller?.abort()
}

function onKey(e: KeyboardEvent) {
  if (slashOpen.value && slashMatches.value.length) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      slashIndex.value = (slashIndex.value + 1) % slashMatches.value.length
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      slashIndex.value = (slashIndex.value - 1 + slashMatches.value.length) % slashMatches.value.length
      return
    }
    if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey && `/${slashMatches.value[slashIndex.value].name}` !== input.value)) {
      e.preventDefault()
      const c = slashMatches.value[slashIndex.value]
      input.value = `/${c.name}${c.args ? " " : ""}`
      return
    }
  }
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    void send()
    return
  }
  if (e.key === "Escape") {
    if (busy.value) {
      e.preventDefault()
      stop()
    }
    return
  }
  const single = !input.value.includes("\n")
  if (e.key === "ArrowUp" && single && history.value.length) {
    e.preventDefault()
    if (cursor === -1) draft = input.value
    cursor = cursor === -1 ? history.value.length - 1 : Math.max(0, cursor - 1)
    input.value = history.value[cursor]
  } else if (e.key === "ArrowDown" && single && cursor !== -1) {
    e.preventDefault()
    cursor = cursor + 1 >= history.value.length ? -1 : cursor + 1
    input.value = cursor === -1 ? draft : history.value[cursor]
  }
}

function pickSlash(c: Slash) {
  input.value = `/${c.name}${c.args ? " " : ""}`
  box.value?.focus()
}

onBeforeUnmount(() => {
  controller?.abort()
  clearInterval(clock)
})
</script>

<template>
  <div class="agent">
    <div class="head">
      <span class="title">Agent</span>
      <button type="button" class="model" :title="`${config.kind} · ${maskedKey}`" @click="settingsOpen = !settingsOpen">{{ config.model || "model" }}</button>
      <div class="head-actions">
        <button type="button" class="head-btn" :aria-pressed="settingsOpen" aria-label="Provider settings" title="Provider settings (/settings)" @click="settingsOpen = !settingsOpen">⚙</button>
        <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">×</button>
      </div>
    </div>

    <DitherFocusScope v-if="settingsOpen" :trapped="false" :restore-focus="false" class="settings">
      <label class="field"><span>provider</span>
        <select v-model="config.kind" name="agent-provider" class="input">
          <option value="anthropic">anthropic · api key</option>
          <option value="openai">openai-compatible · api key</option>
        </select>
      </label>
      <label class="field"><span>model</span><input v-model.trim="config.model" name="agent-model" type="text" class="input" :placeholder="DEFAULT_MODELS[config.kind]" autocomplete="off" spellcheck="false" /></label>
      <label v-if="config.kind === 'openai'" class="field"><span>base url</span><input v-model.trim="config.baseUrl" name="agent-base-url" type="url" class="input" placeholder="https://api.openai.com" autocomplete="off" spellcheck="false" /></label>
      <label class="field"><span>api key</span><input v-model.trim="config.apiKey" name="agent-key" type="password" class="input" autocomplete="off" placeholder="sk-…" /></label>
      <label class="remember"><input v-model="config.remember" type="checkbox" name="agent-remember" class="accent-foreground" />remember on this device</label>
      <p class="note">Calls go straight from this browser to the provider; nothing passes through dither-ui.com. Subscription logins are not offered — drive the Studio from your own Claude Code, Codex, pi or omp with <a href="/agent/SKILL.md" target="_blank" rel="noreferrer">the Studio skill</a>.</p>
    </DitherFocusScope>

    <div ref="log" class="log" aria-live="polite">
      <div v-if="!entries.length" class="empty">
        <p>Describe a screen, a chart or a control. The agent composes it from the kit's registry through the Studio protocol; every placement is one undo away.</p>
        <p class="dim">try: a sign-in screen with email, password and a primary button<br />/evolve on a selected frame · /help for commands</p>
      </div>
      <template v-for="(e, i) in entries" :key="i">
        <details v-if="e.kind === 'tool'" class="tool" :open="e.open" :data-ok="String(e.ok)">
          <summary><span class="mark" aria-hidden="true">{{ e.ok ? "⚙" : "×" }}</span><span class="name">{{ e.name }}</span><span class="sum">{{ e.summary }}</span></summary>
          <pre class="detail">{{ e.detail }}</pre>
        </details>
        <div v-else class="entry" :data-kind="e.kind">
          <span class="mark" aria-hidden="true">{{ e.kind === "user" ? "›" : e.kind === "assistant" ? "⏺" : e.kind === "error" ? "!" : e.kind === "steer" ? "↳" : "·" }}</span>
          <span class="text">{{ e.text }}</span>
        </div>
      </template>
      <div v-if="busy" class="entry working" data-kind="system">
        <span class="mark spin" aria-hidden="true">✻</span>
        <span class="text">working… {{ fmtMs(elapsed) }}{{ step ? ` · turn ${step}` : "" }}<span v-if="steering.length"> · {{ steering.length }} steering</span> <span class="dim">(esc to stop)</span></span>
      </div>
    </div>

    <div v-if="steering.length" class="queued">
      <span v-for="(s, i) in steering" :key="i" class="chip" :title="s">↳ {{ s.length > 32 ? `${s.slice(0, 31)}…` : s }}</span>
    </div>

    <div class="composer">
      <div v-if="slashOpen && slashMatches.length" class="slash" role="listbox" aria-label="Commands">
        <button v-for="(c, i) in slashMatches" :key="c.name" type="button" role="option" :aria-selected="i === slashIndex" class="slash-row" :class="i === slashIndex ? 'is-active' : ''" @click="pickSlash(c)">
          <span class="slash-name">/{{ c.name }}<span v-if="c.args" class="dim"> {{ c.args }}</span></span><span class="dim">{{ c.desc }}</span>
        </button>
      </div>
      <div class="line">
        <span class="prompt-mark" aria-hidden="true">›</span>
        <textarea ref="box" v-model="input" name="agent-goal" :rows="rows" class="prompt" :placeholder="busy ? 'steer the agent…' : configured ? 'what should the studio build?' : 'set a key: /key <api key>'" spellcheck="false" @keydown="onKey" />
        <button v-if="busy" type="button" class="run stop" title="Stop (esc)" @click="stop">stop</button>
        <button v-else type="button" class="run" :disabled="!input.trim()" title="Run (enter)" @click="send">run</button>
      </div>
    </div>

    <div class="status">
      <span class="dim">{{ config.kind }}</span>
      <span class="sep" aria-hidden="true">·</span>
      <span>{{ fmtTokens(session.input) }} in · {{ fmtTokens(session.output) }} out</span>
      <span v-if="lastTurnMs" class="sep" aria-hidden="true">·</span>
      <span v-if="lastTurnMs" class="dim">last {{ fmtMs(lastTurnMs) }}</span>
      <span class="hint dim">↵ send · ⇧↵ newline · / commands · ↑ history · esc stop</span>
    </div>
  </div>
</template>

<style scoped>
.agent { display: flex; height: 100%; min-height: 0; flex-direction: column; font-family: var(--font-mono); font-size: 12px; }
.head { display: flex; height: 2.25rem; flex-shrink: 0; align-items: center; gap: 8px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding-inline: 0.75rem 0.5rem; font-size: 11px; color: var(--color-muted-foreground); }
.title { color: var(--color-foreground); }
.model { max-width: 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-radius: 0.375rem; padding: 2px 6px; font-size: 10.5px; color: var(--color-muted-foreground); background: color-mix(in oklab, var(--color-foreground) 6%, transparent); }
.model:hover { color: var(--color-foreground); }
.head-actions { margin-left: auto; display: flex; gap: 2px; }
.head-btn { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 0.375rem; color: var(--color-muted-foreground); }
.head-btn:hover, .head-btn[aria-pressed="true"] { background: var(--color-card); color: var(--color-foreground); }
.settings { display: grid; gap: 6px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 8px 12px; }
.field { display: grid; grid-template-columns: 4rem minmax(0, 1fr); align-items: center; gap: 8px; font-size: 11px; color: var(--color-muted-foreground); }
.input { height: 1.625rem; min-width: 0; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding-inline: 0.5rem; font: inherit; font-size: 11px; color: var(--color-foreground); outline: none; }
.input:focus { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.remember { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-muted-foreground); }
.note { margin: 0; font-size: 10.5px; line-height: 1.5; color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent); }
.note a { color: var(--color-foreground); text-decoration: underline; text-underline-offset: 2px; }
.log { min-height: 0; flex: 1; overflow-y: auto; padding: 10px 12px; display: grid; align-content: start; gap: 5px; }
.empty { display: grid; gap: 8px; padding-top: 6px; line-height: 1.5; color: var(--color-muted-foreground); }
.empty p { margin: 0; }
.dim { color: color-mix(in oklab, var(--color-muted-foreground) 72%, transparent); }
.entry { display: grid; grid-template-columns: 1.1rem minmax(0, 1fr); gap: 4px; line-height: 1.45; }
.entry[data-kind="user"] { color: var(--color-foreground); }
.entry[data-kind="assistant"] { color: var(--color-foreground); }
.entry[data-kind="assistant"] .mark { color: var(--swatch-blue); }
.entry[data-kind="system"] { color: var(--color-muted-foreground); font-size: 11px; }
.entry[data-kind="steer"] { color: var(--color-muted-foreground); }
.entry[data-kind="error"] { color: var(--swatch-red); }
.mark { color: var(--color-muted-foreground); text-align: center; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
.working .mark { color: var(--swatch-orange); }
@media (prefers-reduced-motion: no-preference) {
  .spin { animation: pulse 1.2s ease-in-out infinite; }
  @keyframes pulse { 50% { opacity: 0.3; } }
}
.tool { font-size: 11px; color: var(--color-muted-foreground); }
.tool summary { display: grid; grid-template-columns: 1.1rem auto minmax(0, 1fr); gap: 4px; cursor: pointer; list-style: none; line-height: 1.45; border-radius: 0.25rem; }
.tool summary::-webkit-details-marker { display: none; }
.tool summary:hover { color: var(--color-foreground); }
.tool .name { color: var(--color-foreground); }
.tool .sum { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tool[open] .sum { white-space: normal; }
.tool[data-ok="false"] .mark, .tool[data-ok="false"] .sum { color: var(--swatch-orange); }
.detail { margin: 4px 0 4px 1.1rem; max-height: 14rem; overflow: auto; border-left: 1px solid color-mix(in oklab, var(--color-border) 80%, transparent); padding-left: 8px; font-size: 10.5px; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--color-muted-foreground); }
.queued { display: flex; flex-wrap: wrap; gap: 4px; padding: 0 12px 6px; }
.chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border: 1px dashed var(--color-border); border-radius: 0.375rem; padding: 1px 6px; font-size: 10.5px; color: var(--color-muted-foreground); }
.composer { position: relative; flex-shrink: 0; border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 8px 10px 6px; }
.slash { position: absolute; left: 10px; right: 10px; bottom: calc(100% - 2px); display: grid; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-card); padding: 4px; box-shadow: 0 8px 24px rgb(0 0 0 / 0.32); }
.slash-row { display: flex; justify-content: space-between; gap: 10px; border-radius: 0.25rem; padding: 4px 6px; text-align: left; font-size: 11px; color: var(--color-foreground); }
.slash-row.is-active, .slash-row:hover { background: var(--color-background); }
.slash-name { white-space: nowrap; }
.line { display: grid; grid-template-columns: 1rem minmax(0, 1fr) auto; align-items: end; gap: 6px; }
.prompt-mark { padding-bottom: 6px; color: var(--swatch-orange); }
.prompt { resize: none; border: 0; background: transparent; padding: 5px 0; font: inherit; font-size: 12px; line-height: 1.45; color: var(--color-foreground); outline: none; }
.prompt::placeholder { color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent); }
.run { min-height: 1.5rem; border-radius: 0.375rem; padding-inline: 0.6rem; font-size: 11px; color: var(--color-accent-foreground); background: var(--color-accent); transition: opacity 140ms ease; }
.run:disabled { opacity: 0.35; }
.run.stop { background: color-mix(in oklab, var(--swatch-red) 80%, black); }
.status { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 5px 12px; font-size: 10px; color: var(--color-muted-foreground); }
.sep { opacity: 0.5; }
.hint { flex-basis: 100%; }
</style>
