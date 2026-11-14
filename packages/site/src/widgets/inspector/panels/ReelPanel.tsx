// The reel's cut: its clips in order, each with its length and the
// transition it comes in by; reorder or drop them here, add frames from the
// picker. The film over it: per clip a camera move, a chapter (a line and
// figure-first spec rows) and spec callouts; for the reel, a score made
// from the cut, previewed here with the reel replayed from its start. The
// timeline itself is features/reel; this panel only edits the model.
import { createMemo, createSignal, For, onCleanup, Show } from "solid-js"
import { createClip, REEL_TRANSITIONS, type ReelClip, type ReelTransitionKind } from "@/entities/widget"
import { CAMERA_MOVES, cameraMoveOf, openScoreAudio, playScore, reelDuration } from "@/features/reel"
import { editor, replay } from "@/entities/editor"
import { NumberField, Toggle } from "@/shared/ui"
import { ROW } from "../ui/fields"
import type { WidgetPanelProps } from "./types"
import "./ReelPanel.css"

/** Three rows to fill; the model keeps the rows with words. */
const SPEC_ROWS = [0, 1, 2]

export default function ReelPanel(props: WidgetPanelProps<"reel">) {
  // The model is the editor's; this panel edits it in place like the Inspector does.
  const total = createMemo(() => reelDuration(props.widget.clips))
  const nameOf = (id: string) => editor.artboards.find((a) => a.id === id)?.name ?? "missing frame"
  /** Any frame but a reel can be a clip. */
  const candidates = createMemo(() =>
    editor.artboards.filter((a) => a.id !== props.artboard.id && a.widget?.kind !== "reel"),
  )
  const fmt = (s: number) => `${Math.round(s * 100) / 100}s`

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    const clips = props.widget.clips
    if (j < 0 || j >= clips.length) return
    ;[clips[i], clips[j]] = [clips[j], clips[i]]
  }
  const remove = (i: number) => props.widget.clips.splice(i, 1)
  function add(e: Event) {
    const select = e.target as HTMLSelectElement
    if (select.value) props.widget.clips.push(createClip(select.value))
    select.value = ""
  }
  const setKind = (i: number, e: Event) => {
    props.widget.clips[i].transition.kind = (e.target as HTMLSelectElement).value as ReelTransitionKind
  }
  const valueOf = (e: Event) => (e.target as HTMLInputElement | HTMLSelectElement).value

  // The film.
  function setMove(clip: ReelClip, e: Event) {
    const keys = CAMERA_MOVES[valueOf(e)]
    if (keys) clip.camera = keys.map((k) => ({ ...k }))
  }
  function setLine(clip: ReelClip, e: Event) {
    const line = valueOf(e)
    if (!line.trim()) clip.chapter = null
    else if (clip.chapter) clip.chapter.line = line
    else clip.chapter = { line, spec: [] }
  }
  function setSpec(clip: ReelClip, row: number, col: 0 | 1, e: Event) {
    if (!clip.chapter) return
    // Read before the rows are made: a new row writes its (empty) words
    // back to the field as it lands.
    const words = valueOf(e)
    const spec = clip.chapter.spec
    while (spec.length <= row) spec.push(["", ""])
    spec[row][col] = words
  }
  const addCallout = (clip: ReelClip) =>
    clip.callouts.push({
      x: 0.5,
      y: 0.5,
      label: "Label",
      note: "",
      side: "right",
      from: Math.min(0.6, clip.seconds),
      to: clip.seconds,
    })

  const scored = createMemo(() => props.widget.score !== null)
  function setScore(on: boolean) {
    props.widget.score = on ? { seed: props.widget.score?.seed ?? 1 } : null
  }
  // Previewing the score: synthesized from the cut, played with the reel
  // replayed from its start.
  const [previewing, setPreviewing] = createSignal<"idle" | "making" | "playing">("idle")
  let stopPreview: (() => void) | null = null
  async function preview() {
    if (previewing() !== "idle") {
      stopPreview?.()
      stopPreview = null
      setPreviewing("idle")
      return
    }
    // The audio opens here, in the click (see `openScoreAudio`).
    const audio = openScoreAudio()
    if (!audio) return
    setPreviewing("making")
    // Let the panel paint its state before the synthesis holds the thread.
    await new Promise((r) => setTimeout(r, 30))
    stopPreview = playScore(props.widget, audio, () => {
      setPreviewing("idle")
      stopPreview = null
    })
    replay()
    setPreviewing("playing")
  }
  onCleanup(() => stopPreview?.())

  return (
    <section class="reel-panel-scope flex flex-col gap-3">
      <p class="flex gap-2 text-[11.5px] font-medium text-muted-foreground">
        Reel<span class="tabular-nums">{fmt(total())}</span>
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <Toggle modelValue={scored()} label="score" onUpdateModelValue={setScore} />
        <Show when={props.widget.score}>
          <NumberField
            class="w-24"
            modelValue={props.widget.score?.seed ?? 1}
            label="seed"
            min={0}
            max={99999}
            step={1}
            onUpdateModelValue={(v) => (props.widget.score!.seed = Math.round(v))}
          />
        </Show>
        <Show when={props.widget.score && props.widget.clips.length}>
          <button
            type="button"
            class="clip-tool ml-auto px-2 text-[11px]"
            aria-pressed={previewing() === "playing" ? "true" : "false"}
            onClick={preview}
          >
            {previewing() === "making" ? "Making the score" : previewing() === "playing" ? "Stop" : "Play with score"}
          </button>
        </Show>
      </div>
      <Show when={!props.widget.clips.length}>
        <p class="text-[11px] leading-relaxed text-muted-foreground">
          No clips yet: add frames below, or select frames on the canvas and press Reel.
        </p>
      </Show>
      <For each={props.widget.clips}>
        {(clip, i) => (
          <article class="flex flex-col gap-2 rounded-md border border-border/60 p-2" data-reel-clip={clip.id}>
            <div class="flex items-center gap-1 text-[11px]">
              <span class="w-4 shrink-0 tabular-nums text-muted-foreground">{i() + 1}</span>
              <span class="truncate text-foreground">{nameOf(clip.id)}</span>
              <button
                type="button"
                class="clip-tool ml-auto"
                disabled={i() === 0}
                aria-label="Move clip earlier"
                title="Earlier"
                onClick={() => move(i(), -1)}
              >
                ↑
              </button>
              <button
                type="button"
                class="clip-tool"
                disabled={i() === props.widget.clips.length - 1}
                aria-label="Move clip later"
                title="Later"
                onClick={() => move(i(), 1)}
              >
                ↓
              </button>
              <button
                type="button"
                class="clip-tool text-destructive hover:bg-destructive/10"
                aria-label="Remove clip"
                title="Remove"
                onClick={() => remove(i())}
              >
                ×
              </button>
            </div>
            <NumberField
              modelValue={clip.seconds}
              label="length"
              min={0.1}
              max={600}
              step={0.5}
              unit="s"
              onUpdateModelValue={(v) => (clip.seconds = v)}
            />
            <label class={ROW}>
              <span class="prop-name">in by</span>
              <select
                name={`clip-${i()}-in`}
                class="field w-full"
                value={clip.transition.kind}
                onChange={(e) => setKind(i(), e)}
              >
                <For each={REEL_TRANSITIONS}>
                  {(k) => (
                    <option value={k} selected={clip.transition.kind === k}>
                      {k}
                    </option>
                  )}
                </For>
              </select>
            </label>
            <Show when={clip.transition.kind !== "cut"}>
              <NumberField
                modelValue={clip.transition.seconds}
                label="over"
                min={0}
                max={clip.seconds}
                step={0.1}
                unit="s"
                onUpdateModelValue={(v) => (clip.transition.seconds = v)}
              />
              <NumberField
                modelValue={clip.transition.cell}
                label="cell"
                min={1}
                max={16}
                step={1}
                unit="px"
                onUpdateModelValue={(v) => (clip.transition.cell = v)}
              />
            </Show>
            <label class={ROW}>
              <span class="prop-name">camera</span>
              <select
                name={`clip-${i()}-camera`}
                class="field w-full"
                value={cameraMoveOf(clip.camera)}
                onChange={(e) => setMove(clip, e)}
              >
                <For each={Object.keys(CAMERA_MOVES)}>
                  {(name) => (
                    <option value={name} selected={cameraMoveOf(clip.camera) === name}>
                      {name}
                    </option>
                  )}
                </For>
                <Show when={cameraMoveOf(clip.camera) === "custom"}>
                  <option value="custom" disabled selected>
                    custom
                  </option>
                </Show>
              </select>
            </label>
            <label class={ROW}>
              <span class="prop-name">chapter</span>
              <input
                name={`clip-${i()}-chapter`}
                class="field w-full"
                maxlength="80"
                placeholder="a line from this clip on"
                value={clip.chapter?.line ?? ""}
                onInput={(e) => setLine(clip, e)}
              />
            </label>
            <Show when={clip.chapter}>
              <div class="grid grid-cols-[4rem_minmax(0,1fr)] gap-1 pl-[calc(var(--prop-name)+0.5rem)]">
                <For each={SPEC_ROWS}>
                  {(row) => (
                    <>
                      <input
                        name={`clip-${i()}-spec-${row}-figure`}
                        class="field w-full min-w-0"
                        maxlength="12"
                        placeholder="264"
                        aria-label={`Spec row ${row + 1} figure`}
                        value={clip.chapter?.spec[row]?.[0] ?? ""}
                        onInput={(e) => setSpec(clip, row, 0, e)}
                      />
                      <input
                        name={`clip-${i()}-spec-${row}-words`}
                        class="field w-full min-w-0"
                        maxlength="32"
                        placeholder="components"
                        aria-label={`Spec row ${row + 1} words`}
                        value={clip.chapter?.spec[row]?.[1] ?? ""}
                        onInput={(e) => setSpec(clip, row, 1, e)}
                      />
                    </>
                  )}
                </For>
              </div>
            </Show>
            <details class="text-[11px] text-muted-foreground">
              <summary class="cursor-pointer select-none">callouts {clip.callouts.length}</summary>
              <div class="mt-2 flex flex-col gap-2">
                <For each={clip.callouts}>
                  {(c, k) => (
                    <div class="flex flex-col gap-1.5 border-l border-border/60 pl-2">
                      <div class="flex gap-1">
                        <input
                          name={`clip-${i()}-callout-${k()}-label`}
                          class="field w-full"
                          maxlength="48"
                          aria-label={`Callout ${k() + 1} label`}
                          value={c.label}
                          onInput={(e) => (c.label = valueOf(e))}
                        />
                        <button
                          type="button"
                          class="clip-tool text-destructive hover:bg-destructive/10"
                          aria-label={`Remove callout ${k() + 1}`}
                          title="Remove"
                          onClick={() => clip.callouts.splice(k(), 1)}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        name={`clip-${i()}-callout-${k()}-note`}
                        class="field"
                        maxlength="64"
                        placeholder="a note under it"
                        aria-label={`Callout ${k() + 1} note`}
                        value={c.note}
                        onInput={(e) => (c.note = valueOf(e))}
                      />
                      <NumberField
                        modelValue={c.x}
                        label="x"
                        min={0}
                        max={1}
                        step={0.01}
                        onUpdateModelValue={(v) => (c.x = v)}
                      />
                      <NumberField
                        modelValue={c.y}
                        label="y"
                        min={0}
                        max={1}
                        step={0.01}
                        onUpdateModelValue={(v) => (c.y = v)}
                      />
                      <NumberField
                        modelValue={c.from}
                        label="from"
                        min={0}
                        max={clip.seconds}
                        step={0.1}
                        unit="s"
                        onUpdateModelValue={(v) => (c.from = v)}
                      />
                      <NumberField
                        modelValue={c.to}
                        label="to"
                        min={c.from}
                        max={clip.seconds}
                        step={0.1}
                        unit="s"
                        onUpdateModelValue={(v) => (c.to = v)}
                      />
                      <label class="flex items-center gap-2">
                        <span class="prop-name">side</span>
                        <select
                          name={`clip-${i()}-callout-${k()}-side`}
                          class="field w-full"
                          value={c.side}
                          onChange={(e) => (c.side = valueOf(e) as "left" | "right")}
                        >
                          <option value="right" selected={c.side === "right"}>
                            right
                          </option>
                          <option value="left" selected={c.side === "left"}>
                            left
                          </option>
                        </select>
                      </label>
                    </div>
                  )}
                </For>
                <Show when={clip.callouts.length < 8}>
                  <button type="button" class="clip-tool self-start px-2" onClick={() => addCallout(clip)}>
                    Add a callout
                  </button>
                </Show>
              </div>
            </details>
          </article>
        )}
      </For>
      <label class={ROW}>
        <span class="prop-name">add</span>
        <select name="add-clip" class="field w-full" onChange={add}>
          <option value="">frame…</option>
          <For each={candidates()}>{(a) => <option value={a.id}>{a.name}</option>}</For>
        </select>
      </label>
      <p class="text-[11px] leading-relaxed text-muted-foreground">
        A reel is a video: the video action renders the whole cut as one MP4, as long as the reel, with its score when
        it has one.
      </p>
    </section>
  )
}
