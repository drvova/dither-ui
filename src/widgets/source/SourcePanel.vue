<script setup lang="ts">
// A docs preview's source as files (after Kobra's source panel): the example
// as a complete file, the kit's own source for what it imports, the kit's
// tokens and a prompt for a coding agent — each one a tab, editable, with
// Revert, Copy, Download (all of them, zipped) and Run, which compiles the
// edits in the page and hands the result to the preview. The kit files are
// the repo's, served by the build at `kit/src/<vue|svelte>/`.
import { computed, reactive, ref, shallowRef, watch } from "vue"
import { copyText } from "@dither-kit"
import { assetPath } from "@/shared/lib"
import { download, zip } from "@/shared/lib/files"
import { play } from "@/shared/lib/sound"
import Editor from "./Editor.vue"
import {
  asSfc,
  exampleName,
  type Flavor,
  installFor,
  KIT_FOLDER,
  kitEntry,
  kitFilesOf,
  kitIndex,
  type Layer,
  layerOf,
  promptFor,
  snippetKind,
  type SourceContext,
  type SourceFile,
} from "./model/files"
import type { Problem } from "./model/compile"
import type { RunResult } from "./model/run"

const props = defineProps<{
  /** The snippet as authored (Vue, Tailwind). */
  code: string
  /** Vue → the reader's framework and styling system. */
  translate: (vue: string) => string
  flavor: Flavor
  styling: string
  context: SourceContext
}>()
const emit = defineEmits<{ run: [result: RunResult] }>()

// ---- the kit's served sources ------------------------------------------------

const texts = new Map<string, Promise<string>>()
function fetchText(src: string): Promise<string> {
  let hit = texts.get(src)
  if (!hit) {
    hit = fetch(assetPath(src)).then((r) => (r.ok ? r.text() : Promise.reject(new Error(`${r.status} ${src}`))))
    hit.catch(() => texts.delete(src))
    texts.set(src, hit)
  }
  return hit
}

interface KitMeta {
  files: string[]
  index: Map<string, { file: string; name: string }>
}
// The kit the reader takes: a framework's, and on Vue the styling system's
// layer (StyleX has its own; every other system runs the Tailwind one).
const kits = reactive(new Map<string, KitMeta>())
const failed = ref("")
const layer = computed<Layer>(() => layerOf(props.styling))
const kitKey = (flavor: Flavor, l: Layer) => `${flavor}/${kitEntry(flavor, l)}`
async function loadKit(flavor: Flavor, l: Layer): Promise<KitMeta> {
  const have = kits.get(kitKey(flavor, l))
  if (have) return have
  const at = kitEntry(flavor, l)
  const [list, index] = await Promise.all([
    fetchText(`kit/src/${flavor}/files.json`),
    fetchText(`kit/src/${flavor}/${at}`),
  ])
  const files = JSON.parse(list) as string[]
  const meta = { files, index: kitIndex(index, files, at) }
  kits.set(kitKey(flavor, l), meta)
  return meta
}
// The Vue kit's index names what a fragment imports, in either framework.
watch(
  () => [props.flavor, layer.value] as const,
  ([f, l]) =>
    Promise.all([loadKit("vue", l), loadKit(f, l)]).catch(
      (e: Error) => (failed.value = `Couldn't load the kit's file list (${e.message}).`),
    ),
  { immediate: true },
)

// ---- the files ---------------------------------------------------------------

const kind = computed(() => snippetKind(props.code))
const files = computed<SourceFile[]>(() => {
  const flavor = props.flavor
  const markup = kind.value === "sfc" || kind.value === "fragment"
  const vue = kits.get(kitKey("vue", layer.value))
  const names = vue && new Set(vue.index.keys())
  const text = !markup ? props.translate(props.code) : names ? props.translate(asSfc(props.code, names)) : undefined
  const name = exampleName(props.context.section, props.context.n, kind.value, flavor)
  const example: SourceFile = {
    path: name,
    name,
    lang: markup ? flavor : (kind.value as SourceFile["lang"]),
    role: "example",
    text,
  }
  const kit = kits.get(kitKey(flavor, layer.value))
  const used: SourceFile[] =
    kit && text
      ? kitFilesOf(text, flavor, kit.index, kit.files).map((f) => ({
          path: `${KIT_FOLDER[flavor]}/${f}`,
          name: f.split("/").pop()!,
          lang: f.endsWith(".vue") ? "vue" : f.endsWith(".svelte") ? "svelte" : "ts",
          role: "kit",
          src: `kit/src/${flavor}/${f}`,
        }))
      : []
  const tokens: SourceFile = {
    path: flavor === "vue" ? "dither-kit/engine/theme.css" : "theme.css",
    name: "theme.css",
    lang: "css",
    role: "tokens",
    src: "kit/src/vue/engine/theme.css",
  }
  const prompt: SourceFile = { path: "prompt.md", name: "prompt.md", lang: "md", role: "prompt" }
  const all = [example, ...used, tokens, prompt]
  prompt.text = promptFor(
    {
      ...props.context,
      install: installFor(props.context.install, flavor, props.styling),
      flavor,
      styling: props.styling,
    },
    all,
  )
  return all
})

// Originals (generated, or fetched once) and the reader's edits, kept per
// file — the example's per framework and styling system, since each is a
// different file.
const originals = reactive(new Map<string, string>())
const edits = reactive(new Map<string, string>())
const keyOf = (f: SourceFile) => (f.role === "example" ? `example:${props.flavor}:${props.styling}` : (f.src ?? f.path))
const originalOf = (f: SourceFile) => f.text ?? (f.src ? originals.get(f.src) : undefined)
const textOf = (f: SourceFile) => edits.get(keyOf(f)) ?? originalOf(f) ?? ""
const dirty = (f: SourceFile) => edits.has(keyOf(f)) && edits.get(keyOf(f)) !== originalOf(f)

const loadErrors = reactive(new Map<string, string>())
function fetchOriginal(f: SourceFile): Promise<unknown> {
  if (!f.src || originals.has(f.src)) return Promise.resolve()
  loadErrors.delete(f.src)
  return fetchText(f.src).then(
    (t) => originals.set(f.src!, t),
    (e: Error) => loadErrors.set(f.src!, e.message),
  )
}
watch(files, (all) => all.forEach(fetchOriginal), { immediate: true })

const activeKey = ref("")
const active = computed(() => files.value.find((f) => f.path === activeKey.value) ?? files.value[0])
const content = computed({
  get: () => textOf(active.value),
  set: (t: string) => {
    edits.set(keyOf(active.value), t)
  },
})
const ready = computed(() => originalOf(active.value) !== undefined)

// ---- the toolbar ---------------------------------------------------------------

const status = ref("")
let statusTimer = 0
function say(text: string) {
  status.value = text
  clearTimeout(statusTimer)
  statusTimer = window.setTimeout(() => (status.value = ""), 2600)
}

const tabs = ref<HTMLElement | null>(null)
function pick(f: SourceFile, focus = false) {
  if (f.path !== active.value.path) play("tap")
  activeKey.value = f.path
  if (focus)
    [...(tabs.value?.querySelectorAll<HTMLElement>("[role=tab]") ?? [])]
      .find((el) => el.dataset.path === f.path)
      ?.focus()
}
function roam(e: KeyboardEvent) {
  const i = files.value.indexOf(active.value)
  const n = files.value.length
  const to =
    e.key === "ArrowRight"
      ? (i + 1) % n
      : e.key === "ArrowLeft"
        ? (i - 1 + n) % n
        : e.key === "Home"
          ? 0
          : e.key === "End"
            ? n - 1
            : -1
  if (to < 0) return
  e.preventDefault()
  pick(files.value[to], true)
}

function revert() {
  if (!dirty(active.value)) return
  play("tap")
  edits.delete(keyOf(active.value))
  say(`Reverted ${active.value.name}`)
}

async function copy() {
  const ok = await copyText(textOf(active.value))
  if (ok) play("copy")
  say(ok ? `Copied ${active.value.name}` : "Copy was blocked by the browser")
}

const archive = computed(() => {
  const { section, n } = props.context
  return `dither-${section || "docs"}${n > 1 ? `-${n}` : ""}.zip`
})
async function downloadAll() {
  play("tap")
  await Promise.all(files.value.map(fetchOriginal))
  const missing = files.value.filter((f) => originalOf(f) === undefined)
  if (missing.length) return say(`Couldn't load ${missing.map((f) => f.name).join(", ")}`)
  const bytes = zip(files.value.map((f) => ({ path: f.path, text: textOf(f) })))
  download(new Blob([bytes as BlobPart], { type: "application/zip" }), archive.value)
  say(`Downloaded ${archive.value}`)
}

// Run: the Vue flavor, in any styling system (StyleX through its run-time
// stand-in, `model/stylex.ts`, on the kit's StyleX layer evaluated from
// its source, since the page itself runs the Tailwind one).
const runnable = computed(() => {
  if (kind.value !== "sfc" && kind.value !== "fragment") return "Nothing to render: this example isn't a component."
  if (props.flavor !== "vue") return "The preview runs the Vue kit; switch the framework to Vue to run."
  return ""
})
const problems = shallowRef<Problem[]>([])
const running = ref(false)
const editor = ref<InstanceType<typeof Editor> | null>(null)

async function runNow() {
  if (running.value) return
  if (runnable.value) return say(runnable.value)
  play("tap")
  running.value = true
  problems.value = []
  const example = files.value[0]
  try {
    const [{ run }, kit] = await Promise.all([import("./model/run"), loadKit("vue", layer.value)])
    const edited = (role: SourceFile["role"]) => files.value.filter((f) => f.role === role && dirty(f))
    const tokens = edited("tokens")[0]
    const result = await run({
      scope: `${props.context.section}:${props.context.n}`,
      example: { path: example.path, text: textOf(example) },
      kit: edited("kit").map((f) => ({ file: f.src!.replace("kit/src/vue/", ""), text: textOf(f) })),
      tokens: tokens ? textOf(tokens) : undefined,
      index: kit.index,
      files: kit.files,
      fromSource: layer.value === "stylex",
      source: (f) => fetchText(`kit/src/vue/${f}`),
    })
    emit("run", result)
    say(`Ran ${example.name} in the preview`)
  } catch (e) {
    const err = e as Error & { problems?: Problem[] }
    problems.value = err.problems?.length ? err.problems : [{ file: example.path, message: err.message }]
    say(`Run stopped: ${problems.value.length} problem${problems.value.length > 1 ? "s" : ""}`)
  } finally {
    running.value = false
  }
}

/** Open the file a problem names, at its line. */
function reveal(p: Problem) {
  const name = p.file.split("/").pop()
  const f = files.value.find((x) => x.path === p.file || x.name === name)
  if (!f) return
  pick(f)
  if (p.line) requestAnimationFrame(() => editor.value?.reveal(p.line!, p.column))
}

const uid = `src-${Math.random().toString(36).slice(2, 8)}`
const ICONS = {
  revert: "M6 3 3 6l3 3M3.5 6h6.25a3.25 3.25 0 0 1 0 6.5H7",
  copy: "M5.5 5.5h7v7h-7zM10.5 5.5v-2h-7v7h2",
  download: "M8 2.5v7.5M4.75 7 8 10.25 11.25 7M3 13h10",
}
</script>

<template>
  <div class="src hardshell">
    <div class="src-bar">
      <div ref="tabs" class="src-tabs" role="tablist" aria-label="Source files" @keydown="roam">
        <button
          v-for="f in files"
          :id="`${uid}-${f.path}`"
          :key="f.path"
          type="button"
          role="tab"
          class="src-tab"
          :data-path="f.path"
          :aria-selected="f === active"
          :aria-controls="`${uid}-panel`"
          :tabindex="f === active ? 0 : -1"
          :title="f.path"
          @click="pick(f)"
        >
          {{ f.name }}<span v-if="dirty(f)" class="src-dot" aria-hidden="true" /><span v-if="dirty(f)" class="sr-only"
            >, edited</span
          >
        </button>
      </div>
      <div class="src-tools">
        <button
          type="button"
          class="src-key"
          :aria-disabled="!dirty(active)"
          :aria-label="`Revert ${active.name}`"
          :title="`Revert ${active.name}`"
          @click="revert"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path :d="ICONS.revert" /></svg>
        </button>
        <button
          type="button"
          class="src-key"
          :aria-label="`Copy ${active.name}`"
          :title="`Copy ${active.name}`"
          @click="copy"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path :d="ICONS.copy" /></svg>
        </button>
        <button
          type="button"
          class="src-key"
          :aria-label="`Download all ${files.length} files as ${archive}`"
          :title="`Download all ${files.length} files (.zip)`"
          @click="downloadAll"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true"><path :d="ICONS.download" /></svg>
        </button>
        <button
          type="button"
          class="src-run"
          :aria-disabled="!!runnable || running"
          :aria-describedby="runnable ? `${uid}-why` : undefined"
          aria-keyshortcuts="Control+Enter Meta+Enter"
          :title="runnable || 'Run the files in the preview (⌘↵)'"
          @click="runNow"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" stroke="none" />
          </svg>
          {{ running ? "Running" : "Run" }}
        </button>
        <span v-if="runnable" :id="`${uid}-why`" class="sr-only">{{ runnable }}</span>
      </div>
    </div>
    <div :id="`${uid}-panel`" role="tabpanel" :aria-labelledby="`${uid}-${active.path}`">
      <p v-if="failed" class="src-note">{{ failed }}</p>
      <p v-if="active.src && loadErrors.get(active.src)" class="src-note">
        Couldn't load {{ active.name }} ({{ loadErrors.get(active.src) }}).
        <button type="button" class="src-link" @click="fetchOriginal(active)">Try again</button>
      </p>
      <p v-else-if="!ready" class="src-note">Loading {{ active.name }}…</p>
      <Editor
        v-else
        ref="editor"
        v-model="content"
        :label="`${active.name} source`"
        :describedby="`${uid}-hint`"
        @run="runNow"
      />
    </div>
    <ol v-if="problems.length" class="src-problems" role="alert" aria-label="Run problems">
      <li v-for="(p, i) in problems" :key="i">
        <button type="button" class="src-problem" @click="reveal(p)">
          <span class="src-where">{{ p.file.split("/").pop() }}{{ p.line ? ` ${p.line}:${p.column ?? 1}` : "" }}</span>
          {{ p.message }}
        </button>
      </li>
    </ol>
    <div class="src-foot">
      <span :id="`${uid}-hint`">⌘↵ runs, Tab indents, Esc then Tab leaves the editor</span>
      <span class="src-status" aria-live="polite">{{ status }}</span>
    </div>
  </div>
</template>

<style scoped>
/* A hardshell (the site's material: two corners cut, the chrome glint
   along them) over the page's ground. */
.src {
  --cut: 12px;
  overflow: hidden;
  background: var(--pearl), color-mix(in oklab, var(--color-background) 60%, transparent);
}

@media (prefers-reduced-transparency: reduce) {
  .src {
    background: var(--color-background);
  }
}

.src-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px 0 4px;
  border-bottom: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}

.src-tabs {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.src-tab {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 10px;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--color-muted-foreground);
  border-bottom: 1px solid transparent;
  margin-bottom: -1px;
  transition: color 120ms ease;
}

.src-tab:hover {
  color: var(--color-foreground);
}

.src-tab[aria-selected="true"] {
  color: var(--color-foreground);
  border-bottom-color: var(--color-foreground);
}

.src-tab:focus-visible {
  outline-offset: -2px;
}

.src-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}

.src-tools {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}

.src-key,
.src-run {
  display: inline-grid;
  place-items: center;
  height: 28px;
  border-radius: 7px;
  color: var(--color-muted-foreground);
  transition:
    color 120ms ease,
    background-color 120ms ease;
}

.src-key {
  width: 28px;
}

.src-key svg,
.src-run svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.src-run {
  display: inline-flex;
  gap: 5px;
  margin-left: 4px;
  padding: 0 10px 0 8px;
  font-size: 11px;
  color: var(--color-foreground);
  box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 24%, transparent);
}

.src-key:hover:not([aria-disabled="true"]),
.src-run:hover:not([aria-disabled="true"]) {
  color: var(--color-foreground);
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
}

.src-key[aria-disabled="true"],
.src-run[aria-disabled="true"] {
  opacity: 0.4;
  cursor: default;
}

.src-note {
  margin: 0;
  padding: 16px 14px;
  font-size: 12px;
  color: var(--color-muted-foreground);
}

.src-link {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.src-problems {
  margin: 0;
  padding: 6px;
  list-style: none;
  border-top: 1px solid color-mix(in oklab, var(--color-border) 60%, transparent);
}

.src-problem {
  display: block;
  width: 100%;
  padding: 5px 8px;
  border-radius: 6px;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--color-foreground);
}

.src-problem:hover {
  background: color-mix(in oklab, var(--color-foreground) 6%, transparent);
}

.src-where {
  margin-right: 8px;
  color: var(--swatch-orange);
}

.src-foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px;
  font-size: 10.5px;
  color: color-mix(in oklab, var(--color-muted-foreground) 80%, transparent);
  border-top: 1px solid color-mix(in oklab, var(--color-border) 40%, transparent);
}

.src-status {
  color: var(--color-foreground);
  text-align: right;
}

@media (prefers-reduced-transparency: reduce) {
  .src {
    background: var(--color-background);
  }
}

@media (forced-colors: active) {
  .src-tab[aria-selected="true"] {
    border-bottom-color: Highlight;
  }
}
</style>
