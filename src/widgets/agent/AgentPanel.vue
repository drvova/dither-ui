<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import { DitherFocusScope } from "@dither-kit"
import { editor, selectedArtboard } from "@/entities/editor"
import { evolveSelected } from "@/features/agent"
import {
  type AgentConfig,
  type AgentEvent,
  type AgentMessage,
  DEFAULT_MODELS,
  loadAgentConfig,
  runAgent,
  saveAgentConfig,
} from "@/features/agent/llm"

// The agent panel: a bring-your-own-key assistant that drives the Studio
// through the same protocol every harness uses. The transcript is the
// agent's own messages plus a line per tool call, so the user sees what
// was placed and can undo it like any edit (every command runs through the
// editor store, which the history watcher records).
const emit = defineEmits<{ close: [] }>()

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

type Line = { kind: "user" | "assistant" | "tool" | "error"; text: string; ok?: boolean }
const lines = ref<Line[]>([])
const transcript = ref<AgentMessage[]>([])
const goal = ref("")
const busy = ref(false)
let controller: AbortController | null = null
const log = ref<HTMLElement | null>(null)

const scrollLog = () => nextTick(() => log.value?.scrollTo({ top: log.value.scrollHeight }))

function onEvent(e: AgentEvent) {
  if (e.type === "assistant") lines.value.push({ kind: "assistant", text: e.text })
  else if (e.type === "tool") lines.value.push({ kind: "tool", text: `${e.name} ${summarizeArgs(e.args)}`, ok: e.result.ok })
  else if (e.type === "error") lines.value.push({ kind: "error", text: e.message })
  scrollLog()
}

function summarizeArgs(args: Record<string, unknown>): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(args)) {
    if (v == null) continue
    const s = typeof v === "string" ? v : Array.isArray(v) ? `[${v.length}]` : typeof v === "object" ? "{…}" : String(v)
    parts.push(`${k}=${s.length > 28 ? `${s.slice(0, 26)}…` : s}`)
  }
  return parts.join(" ")
}

async function send() {
  const text = goal.value.trim()
  if (!text || busy.value || !configured.value) return
  goal.value = ""
  lines.value.push({ kind: "user", text })
  scrollLog()
  busy.value = true
  controller = new AbortController()
  const { remember: _remember, ...provider } = config.value
  void _remember
  transcript.value = await runAgent({ provider, goal: text, history: transcript.value, onEvent, signal: controller.signal })
  busy.value = false
  controller = null
}

function stop() {
  controller?.abort()
}

function clear() {
  lines.value = []
  transcript.value = []
}

function evolve() {
  const gen = evolveSelected()
  if (gen.length) lines.value.push({ kind: "tool", text: `evolve → ${gen.length} variants of "${gen[0].name.replace(/ · v1$/, "")}"`, ok: true })
  else lines.value.push({ kind: "error", text: "select a frame to evolve" })
  scrollLog()
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault()
    void send()
  }
}

onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="panel-head">
      <span>Agent</span>
      <div class="flex items-center gap-1">
        <button type="button" class="head-btn" :aria-pressed="settingsOpen" aria-label="Provider settings" title="Provider settings" @click="settingsOpen = !settingsOpen">⚙</button>
        <button type="button" class="head-btn" aria-label="Close agent" @click="emit('close')">×</button>
      </div>
    </div>

    <DitherFocusScope v-if="settingsOpen" :trapped="false" :restore-focus="false" class="settings">
      <label class="field">
        <span>Provider</span>
        <select v-model="config.kind" name="agent-provider" class="input">
          <option value="anthropic">Anthropic (API key)</option>
          <option value="openai">OpenAI-compatible (API key)</option>
        </select>
      </label>
      <label class="field">
        <span>Model</span>
        <input v-model.trim="config.model" name="agent-model" type="text" class="input" :placeholder="DEFAULT_MODELS[config.kind]" autocomplete="off" spellcheck="false" />
      </label>
      <label v-if="config.kind === 'openai'" class="field">
        <span>Base URL</span>
        <input v-model.trim="config.baseUrl" name="agent-base-url" type="url" class="input" placeholder="https://api.openai.com" autocomplete="off" spellcheck="false" />
      </label>
      <label class="field">
        <span>API key</span>
        <input v-model.trim="config.apiKey" name="agent-key" type="password" class="input" autocomplete="off" placeholder="sk-…" />
      </label>
      <label class="remember">
        <input v-model="config.remember" type="checkbox" name="agent-remember" class="accent-foreground" />
        Remember on this device
      </label>
      <p class="note">
        Calls go straight from this browser to the provider; nothing passes through dither-ui.com.
        Subscription logins are not offered here — drive the Studio from your own Claude Code, Codex,
        pi or omp instead with <a href="/agent/SKILL.md" target="_blank" rel="noreferrer">the Studio skill</a>.
      </p>
    </DitherFocusScope>

    <div ref="log" class="log" aria-live="polite">
      <div v-if="!lines.length" class="empty">
        <p>Describe a screen, a chart or a control. The agent composes it from the kit's registry; every placement is undoable.</p>
        <p class="hint">Try: “a sign-in screen with email, password and a primary button”, or select a frame and press evolve.</p>
      </div>
      <div v-for="(l, i) in lines" :key="i" class="line" :data-kind="l.kind" :data-ok="l.ok === undefined ? undefined : String(l.ok)">
        <span class="mark" aria-hidden="true">{{ l.kind === "user" ? "›" : l.kind === "tool" ? (l.ok === false ? "×" : "·") : l.kind === "error" ? "!" : "" }}</span>
        <span class="text">{{ l.text }}</span>
      </div>
      <div v-if="busy" class="line" data-kind="tool"><span class="mark" aria-hidden="true">…</span><span class="text">thinking</span></div>
    </div>

    <div class="composer">
      <div class="quick">
        <button type="button" class="chip" :disabled="!selectedArtboard || busy" title="Four seeded variants of the selection" @click="evolve">evolve selection</button>
        <button type="button" class="chip" :disabled="!lines.length || busy" @click="clear">clear</button>
        <span class="count">{{ editor.artboards.length }} {{ editor.artboards.length === 1 ? "frame" : "frames" }}</span>
      </div>
      <textarea
        v-model="goal"
        name="agent-goal"
        rows="3"
        class="prompt"
        :placeholder="configured ? 'What should the studio build?' : 'Add an API key in settings (⚙) to run the agent'"
        :disabled="!configured || busy"
        @keydown="onKey"
      />
      <div class="actions">
        <button v-if="busy" type="button" class="run" @click="stop">stop</button>
        <button v-else type="button" class="run" :disabled="!configured || !goal.trim()" @click="send">run ↵</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-head { display: flex; height: 2.25rem; flex-shrink: 0; align-items: center; justify-content: space-between; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding-inline: 0.75rem; font-size: 11px; color: var(--color-muted-foreground); }
.head-btn { display: grid; width: 1.75rem; height: 1.75rem; place-items: center; border-radius: 0.375rem; color: var(--color-muted-foreground); }
.head-btn:hover, .head-btn[aria-pressed="true"] { background: var(--color-card); color: var(--color-foreground); }
.settings { display: grid; gap: 8px; border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 10px 12px; }
.field { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); align-items: center; gap: 8px; font-size: 11px; color: var(--color-muted-foreground); }
.input { height: 1.75rem; min-width: 0; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding-inline: 0.5rem; font-size: 11px; color: var(--color-foreground); outline: none; }
.input:focus { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.remember { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--color-muted-foreground); }
.note { margin: 0; font-size: 10.5px; line-height: 1.5; color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent); }
.note a { color: var(--color-foreground); text-decoration: underline; text-underline-offset: 2px; }
.log { min-height: 0; flex: 1; overflow-y: auto; padding: 10px 12px; display: grid; align-content: start; gap: 6px; font-size: 12px; }
.empty { display: grid; gap: 8px; padding-top: 8px; color: var(--color-muted-foreground); line-height: 1.5; }
.empty p { margin: 0; }
.hint { font-size: 11px; color: color-mix(in oklab, var(--color-muted-foreground) 75%, transparent); }
.line { display: grid; grid-template-columns: 1rem minmax(0, 1fr); gap: 4px; line-height: 1.45; }
.line[data-kind="user"] { color: var(--color-foreground); }
.line[data-kind="assistant"] { color: var(--color-foreground); }
.line[data-kind="tool"] { color: var(--color-muted-foreground); font-size: 11px; }
.line[data-kind="tool"][data-ok="false"] { color: var(--swatch-orange); }
.line[data-kind="error"] { color: var(--swatch-red); }
.mark { color: var(--color-muted-foreground); text-align: center; }
.text { white-space: pre-wrap; overflow-wrap: anywhere; }
.composer { flex-shrink: 0; display: grid; gap: 6px; border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent); padding: 10px 12px; }
.quick { display: flex; align-items: center; gap: 6px; }
.chip { min-height: 1.5rem; border: 1px solid var(--color-border); border-radius: 0.375rem; padding-inline: 0.5rem; font-size: 11px; color: var(--color-muted-foreground); transition: color 140ms ease, background-color 140ms ease; }
.chip:hover:not(:disabled) { background: var(--color-card); color: var(--color-foreground); }
.chip:disabled { opacity: 0.4; }
.count { margin-left: auto; font-size: 10px; color: color-mix(in oklab, var(--color-muted-foreground) 70%, transparent); }
.prompt { resize: none; border: 1px solid var(--color-border); border-radius: 0.375rem; background: var(--color-background); padding: 8px; font: inherit; font-size: 12px; line-height: 1.45; color: var(--color-foreground); outline: none; }
.prompt:focus { border-color: color-mix(in oklab, var(--color-accent) 60%, transparent); }
.prompt:disabled { opacity: 0.6; }
.actions { display: flex; justify-content: flex-end; }
.run { min-height: 1.75rem; border-radius: 0.375rem; background: var(--color-accent); padding-inline: 0.75rem; font-size: 11px; color: var(--color-accent-foreground); transition: opacity 140ms ease; }
.run:disabled { opacity: 0.4; }
</style>
