// A docs preview's source as files (after Kobra's source panel): the example
// as a complete file, the stylesheet it imports, the kit's own source for
// what it imports, the kit's tokens and a prompt for a coding agent — each
// one a tab, editable, with Revert, Copy, Download (all of them, zipped) and
// Run, which compiles the edits in the page and hands the result to the
// preview. The kit files are the kit package's own, served by the build under
// `KIT_SRC`.
import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js"
import { copyText } from "@dither-ui/kit"
import { download, zip } from "@/shared/lib/files"
import { KIT_SRC } from "@/shared/lib/kit-sources"
import type { Sheet } from "@dither-ui/restyle"
import { assetPath, modKey } from "@/shared/lib"
import { play } from "@/shared/lib/sound"
import Editor, { type EditorApi } from "./Editor"
import type { Problem } from "./model/compile"
import {
  exampleName,
  KIT_ENTRY,
  KIT_FOLDER,
  kitFilesOf,
  loadKitIndex,
  promptFor,
  type SourceContext,
  type SourceFile,
} from "./model/files"
import type { RunResult } from "./model/run"
import { asSfc, snippetKind } from "./model/snippet"
import "./SourcePanel.css"

export type SourcePanelProps = {
  /** The snippet as authored (Vue's notation, Tailwind). */
  code: string
  /** The authored snippet → Solid in the reader's styling system: the
   * file, and the stylesheet it imports (named after `name`) when it has one. */
  translate: (vue: string, name?: string) => { code: string; sheet: Sheet | null }
  styling: string
  context: SourceContext
  onRun?: (result: RunResult) => void
}

interface KitMeta {
  files: string[]
  index: Map<string, { file: string; name: string }>
}

/** A map whose reads are tracked and whose writes are seen. */
function tracked<V>() {
  const map = new Map<string, V>()
  const [version, bump] = createSignal(0)
  const seen = () => (version(), map)
  return {
    get: (key: string) => seen().get(key),
    has: (key: string) => seen().has(key),
    set: (key: string, value: V) => (map.set(key, value), bump((n) => n + 1)),
    delete: (key: string) => (map.delete(key), bump((n) => n + 1)),
  }
}

const ICONS = {
  revert: "M6 3 3 6l3 3M3.5 6h6.25a3.25 3.25 0 0 1 0 6.5H7",
  copy: "M5.5 5.5h7v7h-7zM10.5 5.5v-2h-7v7h2",
  download: "M8 2.5v7.5M4.75 7 8 10.25 11.25 7M3 13h10",
}

export default function SourcePanel(props: SourcePanelProps) {
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

  // The kit's file list and index: what a fragment imports, and the files
  // behind it.
  const [kit, setKit] = createSignal<KitMeta>()
  const [failed, setFailed] = createSignal("")
  let loading: Promise<KitMeta> | undefined
  function loadKit(): Promise<KitMeta> {
    loading ??= (async () => {
      const [list, entry] = await Promise.all([fetchText(`${KIT_SRC}files.json`), fetchText(`${KIT_SRC}${KIT_ENTRY}`)])
      const files = JSON.parse(list) as string[]
      // the entry, and the files it re-exports whole (the engine's API)
      const index = await loadKitIndex(
        (file) => (file === KIT_ENTRY ? Promise.resolve(entry) : fetchText(`${KIT_SRC}${file}`)),
        files,
        KIT_ENTRY,
      )
      const meta = { files, index }
      setKit(meta)
      return meta
    })()
    loading.catch(() => (loading = undefined))
    return loading
  }
  onMount(() => loadKit().catch((e: Error) => setFailed(`Couldn't load the kit's file list (${e.message}).`)))

  // ---- the files ---------------------------------------------------------------

  const kind = createMemo(() => snippetKind(props.code))
  const files = createMemo<SourceFile[]>(() => {
    const markup = kind() === "sfc" || kind() === "fragment"
    const have = kit()
    const names = have && new Set(have.index.keys())
    const name = exampleName(props.context.section, props.context.n, kind())
    const made = !markup
      ? props.translate(props.code)
      : names
        ? props.translate(asSfc(props.code, names), name.replace(/\.\w+$/, ""))
        : undefined
    const text = made?.code
    const example: SourceFile = {
      path: name,
      name,
      lang: markup ? "tsx" : (kind() as SourceFile["lang"]),
      role: "example",
      text,
    }
    // the stylesheet the example imports (CSS, CSS Modules) is a file beside it
    const styles: SourceFile[] = made?.sheet
      ? [{ path: made.sheet.file, name: made.sheet.file, lang: "css", role: "styles", text: made.sheet.text }]
      : []
    const used: SourceFile[] =
      have && text
        ? kitFilesOf(text, have.index, have.files).map((f) => ({
            path: `${KIT_FOLDER}/${f}`,
            name: f.split("/").pop()!,
            lang: f.endsWith(".tsx") ? "tsx" : "ts",
            role: "kit",
            src: `${KIT_SRC}${f}`,
          }))
        : []
    const tokens: SourceFile = {
      path: `${KIT_FOLDER}/engine/theme.css`,
      name: "theme.css",
      lang: "css",
      role: "tokens",
      src: `${KIT_SRC}engine/theme.css`,
    }
    const prompt: SourceFile = { path: "prompt.md", name: "prompt.md", lang: "md", role: "prompt" }
    const all = [example, ...styles, ...used, tokens, prompt]
    prompt.text = promptFor({ ...props.context, styling: props.styling }, all)
    return all
  })

  // Originals (generated, or fetched once) and the reader's edits, kept per
  // file — the example's (and its stylesheet's) per styling
  // system, since each is a different file.
  const originals = tracked<string>()
  const edits = tracked<string>()
  const keyOf = (f: SourceFile) =>
    f.role === "example" || f.role === "styles" ? `${f.role}:${props.styling}` : (f.src ?? f.path)
  const originalOf = (f: SourceFile) => f.text ?? (f.src ? originals.get(f.src) : undefined)
  const textOf = (f: SourceFile) => edits.get(keyOf(f)) ?? originalOf(f) ?? ""
  const dirty = (f: SourceFile) => edits.has(keyOf(f)) && edits.get(keyOf(f)) !== originalOf(f)

  const loadErrors = tracked<string>()
  function fetchOriginal(f: SourceFile): Promise<unknown> {
    if (!f.src || originals.has(f.src)) return Promise.resolve()
    loadErrors.delete(f.src)
    return fetchText(f.src).then(
      (t) => originals.set(f.src!, t),
      (e: Error) => loadErrors.set(f.src!, e.message),
    )
  }
  createEffect(on(files, (all) => all.forEach(fetchOriginal)))

  const [activeKey, setActiveKey] = createSignal("")
  const active = createMemo(() => files().find((f) => f.path === activeKey()) ?? files()[0])
  const content = () => textOf(active())
  const setContent = (t: string) => edits.set(keyOf(active()), t)
  const ready = createMemo(() => originalOf(active()) !== undefined)
  const loadError = () => {
    const src = active().src
    return src ? loadErrors.get(src) : undefined
  }

  // ---- the toolbar ---------------------------------------------------------------

  const [status, setStatus] = createSignal("")
  let statusTimer = 0
  function say(text: string) {
    setStatus(text)
    clearTimeout(statusTimer)
    statusTimer = window.setTimeout(() => setStatus(""), 2600)
  }
  onCleanup(() => clearTimeout(statusTimer))

  let tabs: HTMLDivElement | undefined
  // More files scrolled out past the strip's right edge: the strip fades there,
  // so a narrow screen shows that the row goes on.
  const [more, setMore] = createSignal(false)
  const measure = () => {
    const el = tabs
    setMore(!!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }
  onMount(() => {
    measure()
    if (typeof ResizeObserver !== "undefined" && tabs) {
      const resized = new ResizeObserver(measure)
      resized.observe(tabs)
      onCleanup(() => resized.disconnect())
    }
  })
  createEffect(
    on(
      () => files().length,
      () => requestAnimationFrame(measure),
      { defer: true },
    ),
  )
  function pick(f: SourceFile, focus = false) {
    if (f.path !== active().path) play("tap")
    setActiveKey(f.path)
    if (focus)
      [...(tabs?.querySelectorAll<HTMLElement>("[role=tab]") ?? [])].find((el) => el.dataset.path === f.path)?.focus()
  }
  function roam(e: KeyboardEvent) {
    const i = files().indexOf(active())
    const n = files().length
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
    pick(files()[to], true)
  }

  function revert() {
    if (!dirty(active())) return
    play("tap")
    edits.delete(keyOf(active()))
    say(`Reverted ${active().name}`)
  }

  async function copy() {
    const ok = await copyText(textOf(active()))
    if (ok) play("copy")
    say(ok ? `Copied ${active().name}` : "Copy was blocked by the browser")
  }

  const archive = createMemo(() => {
    const { section, n } = props.context
    return `dither-${section || "docs"}${n > 1 ? `-${n}` : ""}.zip`
  })
  async function downloadAll() {
    play("tap")
    await Promise.all(files().map(fetchOriginal))
    const missing = files().filter((f) => originalOf(f) === undefined)
    if (missing.length) return say(`Couldn't load ${missing.map((f) => f.name).join(", ")}`)
    const bytes = zip(files().map((f) => ({ path: f.path, text: textOf(f) })))
    download(new Blob([bytes as BlobPart], { type: "application/zip" }), archive())
    say(`Downloaded ${archive()}`)
  }

  // Run: the example, in any styling system (its stylesheet scoped to
  // the preview or read as a module, StyleX through its run-time stand-in,
  // `@/widgets/source/model/stylex`).
  const runnable = createMemo(() => {
    if (kind() !== "sfc" && kind() !== "fragment") return "Nothing to render: this example isn't a component."
    return ""
  })
  const [problems, setProblems] = createSignal<Problem[]>([])
  const [running, setRunning] = createSignal(false)
  let editor: EditorApi | undefined

  async function runNow() {
    if (running()) return
    if (runnable()) return say(runnable())
    play("tap")
    setRunning(true)
    setProblems([])
    const example = files()[0]
    try {
      const [{ run }, meta] = await Promise.all([import("./model/run"), loadKit()])
      const edited = (role: SourceFile["role"]) => files().filter((f) => f.role === role && dirty(f))
      const tokens = edited("tokens")[0]
      const sheet = files().find((f) => f.role === "styles")
      const result = await run({
        scope: `${props.context.section}:${props.context.n}`,
        example: { path: example.path, text: textOf(example) },
        sheet: sheet && { file: sheet.path, text: textOf(sheet) },
        kit: edited("kit").map((f) => ({ file: f.src!.slice(KIT_SRC.length), text: textOf(f) })),
        tokens: tokens ? textOf(tokens) : undefined,
        index: meta.index,
        files: meta.files,
        source: (f) => fetchText(`${KIT_SRC}${f}`),
      })
      props.onRun?.(result)
      say(`Ran ${example.name} in the preview`)
    } catch (e) {
      const err = e as Error & { problems?: Problem[] }
      setProblems(err.problems?.length ? err.problems : [{ file: example.path, message: err.message }])
      say(`Run stopped: ${problems().length} problem${problems().length > 1 ? "s" : ""}`)
    } finally {
      setRunning(false)
    }
  }

  /** Open the file a problem names, at its line. */
  function reveal(p: Problem) {
    const name = p.file.split("/").pop()
    const f = files().find((x) => x.path === p.file || x.name === name)
    if (!f) return
    pick(f)
    if (p.line) requestAnimationFrame(() => editor?.reveal(p.line!, p.column))
  }

  const uid = `src-${createUniqueId()}`

  return (
    <div class="source-panel-scope src flat-shell">
      <div class="src-bar">
        <div
          ref={(el) => (tabs = el)}
          class="src-tabs"
          classList={{ more: more() }}
          role="tablist"
          aria-label="Source files"
          onKeyDown={roam}
          onScroll={measure}
        >
          <For each={files()}>
            {(f) => (
              <button
                id={`${uid}-${f.path}`}
                type="button"
                role="tab"
                class="src-tab"
                data-path={f.path}
                aria-selected={f === active()}
                aria-controls={`${uid}-panel`}
                tabindex={f === active() ? 0 : -1}
                title={f.path}
                onClick={() => pick(f)}
              >
                {f.name}
                <Show when={dirty(f)}>
                  <span class="src-dot" aria-hidden="true" />
                  <span class="sr-only">, edited</span>
                </Show>
              </button>
            )}
          </For>
        </div>
        <div class="src-tools">
          <button
            type="button"
            class="src-key"
            aria-disabled={!dirty(active())}
            aria-label={`Revert ${active().name}`}
            title={`Revert ${active().name}`}
            onClick={revert}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d={ICONS.revert} />
            </svg>
          </button>
          <button
            type="button"
            class="src-key"
            aria-label={`Copy ${active().name}`}
            title={`Copy ${active().name}`}
            onClick={copy}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d={ICONS.copy} />
            </svg>
          </button>
          <button
            type="button"
            class="src-key"
            aria-label={`Download all ${files().length} files as ${archive()}`}
            title={`Download all ${files().length} files (.zip)`}
            onClick={downloadAll}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d={ICONS.download} />
            </svg>
          </button>
          <button
            type="button"
            class="src-run"
            aria-disabled={!!runnable() || running()}
            aria-describedby={runnable() ? `${uid}-why` : undefined}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            title={runnable() || `Run the files in the preview (${modKey("↵")})`}
            onClick={runNow}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" stroke="none" />
            </svg>
            {running() ? "Running" : "Run"}
          </button>
          <Show when={runnable()}>
            <span id={`${uid}-why`} class="sr-only">
              {runnable()}
            </span>
          </Show>
        </div>
      </div>
      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${active().path}`}>
        <Show when={failed()}>
          <p class="src-note">{failed()}</p>
        </Show>
        <Switch
          fallback={
            <Editor
              ref={(api) => (editor = api)}
              modelValue={content()}
              onUpdateModelValue={setContent}
              label={`${active().name} source`}
              describedby={`${uid}-hint`}
              onRun={runNow}
            />
          }
        >
          <Match when={loadError()}>
            <p class="src-note">
              Couldn't load {active().name} ({loadError()}).{" "}
              <button type="button" class="src-link" onClick={() => fetchOriginal(active())}>
                Try again
              </button>
            </p>
          </Match>
          <Match when={!ready()}>
            <p class="src-note">Loading {active().name}…</p>
          </Match>
        </Switch>
      </div>
      <Show when={problems().length}>
        <ol class="src-problems" role="alert" aria-label="Run problems">
          <For each={problems()}>
            {(p) => (
              <li>
                <button type="button" class="src-problem" onClick={() => reveal(p)}>
                  <span class="src-where">
                    {p.file.split("/").pop()}
                    {p.line ? ` ${p.line}:${p.column ?? 1}` : ""}
                  </span>{" "}
                  {p.message}
                </button>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <div class="src-foot">
        <span id={`${uid}-hint`}>{modKey("↵")} runs, Tab indents, Esc then Tab leaves the editor</span>
        <span class="src-status" aria-live="polite">
          {status()}
        </span>
      </div>
    </div>
  )
}
