// The readout under the stage: what the tool in hand reads, in words, with
// its controls — the inspected box (box model, copy CSS / selector), type
// with its contrast grade, colour samples in every format, the a11y reading
// and the stage's audit, guides and the layout grid (placeable by keyboard),
// the pens, the selection, the comment threads, and a capture's result.
import { createEffect, createMemo, createSignal, For, Index, on, onCleanup, Show } from "solid-js"
import { copyText } from "dither-kit"
import { download } from "@/shared/lib/files"
import { COLOR_FORMATS, formatColor, grade } from "@/shared/lib/inspect/color"
import { cssOf, selectorOf } from "@/shared/lib/inspect/measure"
import { copyImage, MAX_SECONDS, videoTypes } from "@/widgets/workbench/model/capture"
import { SWATCHES, swatch } from "@/widgets/workbench/model/settings"
import { ICONS, toolById } from "@/widgets/workbench/model/tools"
import { uid } from "@/widgets/workbench/model/workspace"
import { play } from "@/shared/lib/sound"
import { GIF } from "../bench"
import { useBench } from "../context"
import Icon from "./Icon"
import Keyed from "./Keyed"
import "./Readout.css"

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`

export default function Readout() {
  const b = useBench()
  const tool = createMemo(() => {
    const id = b.tool()
    return id ? toolById(id) : null
  })
  async function copy(text: string, what: string) {
    const ok = await copyText(text)
    if (ok) play("copy")
    b.say(ok ? `Copied ${what}` : "Copy failed")
  }

  // --- inspect ---------------------------------------------------------------
  const target = () => b.pinned() ?? b.hovered()
  const r = createMemo(() => ((b.tool() === "inspect" || b.tool() === "xray") && b.reading()) || null)
  const content = createMemo(() => {
    const x = b.reading()
    if (!x) return null
    return {
      w: x.box.w - x.edge[1] - x.edge[3] - x.pad[1] - x.pad[3],
      h: x.box.h - x.edge[0] - x.edge[2] - x.pad[0] - x.pad[2],
    }
  })
  const fields = createMemo(() => {
    const x = b.reading()
    if (!x) return []
    return [
      ["at", `${x.box.x}, ${x.box.y}`],
      ["size", `${x.box.w}×${x.box.h}`],
      ["display", x.display],
      ["font", x.font],
      ["color", x.color],
      ["bg", x.background],
      ["radius", x.radius],
      ["padding", x.padding],
      ["margin", x.margin],
    ]
  })

  // --- type ------------------------------------------------------------------
  const t = createMemo(() => (b.tool() === "type" && b.typeReading()) || null)
  const tGrade = createMemo(() => {
    const x = b.typeReading()
    return x?.ratio ? grade(x.ratio, x.large) : null
  })

  // --- colour ----------------------------------------------------------------
  const hasDropper = typeof window !== "undefined" && "EyeDropper" in window

  // --- guides ----------------------------------------------------------------
  const [guideAt, setGuideAt] = createSignal(0)
  function addGuide() {
    const axis = b.guideAxis()
    const at = Math.max(0, Math.round(guideAt()))
    b.change((w) => w.guides.push({ id: uid("g"), axis, at }))
    b.say(`${axis === "x" ? "Vertical" : "Horizontal"} guide at ${at}`)
  }
  function removeGuide(id: string) {
    b.change((w) => (w.guides = w.guides.filter((g) => g.id !== id)))
  }
  function setGrid(key: "columns" | "gutter" | "margin" | "rows" | "rowGutter" | "pixel", value: number) {
    if (!Number.isFinite(value)) return
    b.change(
      (w) => (w.grid[key] = Math.max(key === "gutter" || key === "rowGutter" || key === "margin" ? 0 : 1, value)),
    )
  }
  function showGrid(key: "columns" | "rows" | "pixel", on: boolean) {
    b.change((w) => (w.grid.show[key] = on))
  }
  const grid = () => b.ws().grid

  // --- comments --------------------------------------------------------------
  const [search, setSearch] = createSignal("")
  const threads = createMemo(() => {
    const q = search().trim().toLowerCase()
    return [...b.ws().threads]
      .sort((p, q2) => p.n - q2.n)
      .filter(
        (th) =>
          !q || th.anchor.label.toLowerCase().includes(q) || th.messages.some((m) => m.text.toLowerCase().includes(q)),
      )
  })

  // --- capture ---------------------------------------------------------------
  /** WebM / MP4 as the browser records them, and a GIF dithered by the kit. */
  const types = [...videoTypes(), { mime: GIF, ext: "gif", label: "GIF" }]
  const [elapsed, setElapsed] = createSignal(0)
  let tick = 0
  createEffect(
    on(
      () => b.capture()?.kind,
      (kind) => {
        clearInterval(tick)
        if (kind === "recording") {
          tick = window.setInterval(() => {
            const c = b.capture()
            setElapsed(c?.kind === "recording" ? c.rec.elapsed() : 0)
          }, 250)
        }
      },
      { defer: true },
    ),
  )
  onCleanup(() => clearInterval(tick))
  const shot = createMemo(() => {
    const c = b.capture()
    return c?.kind === "shot" ? c : null
  })
  const video = createMemo(() => {
    const c = b.capture()
    return c?.kind === "video" ? c : null
  })
  function trim(which: "start" | "end", value: number) {
    const c = b.capture()
    if (c?.kind !== "video") return
    b.setCapture(
      which === "start" ? { ...c, start: Math.min(value, c.end - 0.1) } : { ...c, end: Math.max(value, c.start + 0.1) },
    )
  }
  function saveShot() {
    const c = b.capture()
    if (c?.kind === "shot") download(c.blob, `${b.o.key.replace(/[^\w-]+/g, "-")}.png`)
  }
  async function copyShot() {
    const c = b.capture()
    if (c?.kind !== "shot") return
    const ok = await copyImage(c.blob)
    if (ok) play("copy")
    b.say(ok ? "Copied the image" : "This browser cannot copy images. Download it instead.")
  }

  return (
    <section class="wb-readout readout-scope" aria-label={`Workbench: ${tool()?.label ?? "no tool"}`}>
      <header class="top">
        <span class="micro name">{tool()?.label ?? "No tool"}</span>
        <span class="hint">
          {tool()?.hint ??
            "Pick a tool in the tray: I inspects, X shows structure, M comments, K copies it all for an agent."}
        </span>
      </header>

      {/* Inspect / X-ray */}
      <Show when={r()}>
        {(r) => (
          <div class="body">
            <div class="row">
              <span class="label">{b.pinned() ? "pinned" : "pointing"}</span>
              <strong>{r().label}</strong>
              <span class="spacer" />
              <button type="button" class="act" onClick={() => target() && copy(cssOf(target()!), "the CSS")}>
                Copy CSS
              </button>
              <button
                type="button"
                class="act"
                onClick={() => target() && copy(selectorOf(target()!, b.o.content), "the selector")}
              >
                Copy selector
              </button>
            </div>
            <div class="split">
              <dl class="fields">
                <For each={fields()}>
                  {([k, v]) => (
                    <div>
                      <dt class="micro">{k}</dt>
                      <dd>
                        <Show when={k === "color" || k === "bg"}>
                          <i class="sw" style={{ background: v }} />
                        </Show>
                        {v}
                      </dd>
                    </div>
                  )}
                </For>
                <Show when={r().gaps.length}>
                  <div>
                    <dt class="micro">gaps</dt>
                    <dd>
                      {r()
                        .gaps.map((g) => Math.min(g.w, g.h))
                        .join(", ")}
                    </dd>
                  </div>
                </Show>
              </dl>
              <div class="model" aria-label="Box model">
                <div class="m">
                  <span class="micro tag">margin</span> <span class="v t">{r().outer[0]}</span>
                  <span class="v r">{r().outer[1]}</span>
                  <span class="v b">{r().outer[2]}</span>
                  <span class="v l">{r().outer[3]}</span>
                  <div class="e">
                    <span class="micro tag">border</span> <span class="v t">{r().edge[0]}</span>
                    <span class="v r">{r().edge[1]}</span>
                    <span class="v b">{r().edge[2]}</span>
                    <span class="v l">{r().edge[3]}</span>
                    <div class="p">
                      <span class="micro tag">padding</span> <span class="v t">{r().pad[0]}</span>
                      <span class="v r">{r().pad[1]}</span>
                      <span class="v b">{r().pad[2]}</span>
                      <span class="v l">{r().pad[3]}</span>
                      <div class="c">
                        {content()?.w}×{content()?.h}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Show when={b.altMeasure()}>
              {(m) => (
                <p class="row">
                  <span class="label">alt</span> {m().fromLabel} to {m().toLabel}:{" "}
                  {m()
                    .segments.filter((s) => !s.dashed)
                    .map((s) => s.value)
                    .join(", ") || "touching"}{" "}
                  <span class="dim">Alt+S keeps it</span>
                </p>
              )}
            </Show>
          </div>
        )}
      </Show>

      {/* X-ray summary */}
      <Show when={b.tool() === "xray"}>
        <p class="row dim">
          {b.xray().length} elements, {b.xray().filter((x) => x.layout).length} flex or grid (dashed), depth{" "}
          {Math.max(0, ...b.xray().map((x) => x.depth)) + 1}
        </p>
      </Show>

      {/* Typography */}
      <Show when={t()}>
        {(t) => (
          <div class="body">
            <div class="row">
              <span class="label">{b.pinned() ? "pinned" : "pointing"}</span>
              <strong>{t().label}</strong>
            </div>
            <dl class="fields">
              <div>
                <dt class="micro">family</dt>
                <dd>
                  {t().rendered} <span class="dim">of {t().family}</span>
                </dd>
              </div>
              <div>
                <dt class="micro">size</dt>
                <dd>
                  {t().size} / {t().lineHeight}
                </dd>
              </div>
              <div>
                <dt class="micro">weight</dt>
                <dd>{t().weight}</dd>
              </div>
              <div>
                <dt class="micro">tracking</dt>
                <dd>{t().letterSpacing}</dd>
              </div>
              <Show when={t().transform !== "none"}>
                <div>
                  <dt class="micro">case</dt>
                  <dd>{t().transform}</dd>
                </div>
              </Show>
              <div>
                <dt class="micro">lines</dt>
                <dd>
                  {t().lines.length}, about {t().measure} ch each
                </dd>
              </div>
              <div>
                <dt class="micro">ink</dt>
                <dd>
                  <i class="sw" style={{ background: t().color ? formatColor(t().color!, "hex") : "transparent" }} />
                  {t().color ? formatColor(t().color!, "hex") : "none"}
                </dd>
              </div>
              <div>
                <dt class="micro">ground</dt>
                <dd>
                  <i
                    class="sw"
                    style={{ background: t().background ? formatColor(t().background!, "hex") : "transparent" }}
                  />
                  {t().background ? formatColor(t().background!, "hex") : "image or gradient"}
                </dd>
              </div>
              <div>
                <dt class="micro">contrast</dt>
                <Show when={tGrade()} fallback={<dd class="dim">not knowable over an image</dd>}>
                  {(g) => (
                    <dd>
                      {t().ratio}:1 <span class={g().aa ? "grade pass" : "grade"}>AA {g().aa ? "pass" : "fail"}</span>{" "}
                      <span class={g().aaa ? "grade pass" : "grade"}>AAA {g().aaa ? "pass" : "fail"}</span>{" "}
                      <span class="dim">{t().large ? "large text" : "body text"}</span>
                    </dd>
                  )}
                </Show>
              </div>
            </dl>
          </div>
        )}
      </Show>

      {/* Colour samples */}
      <Show when={b.tool() === "color" || b.tool() === "loupe"}>
        <div class="body">
          <div class="row">
            <span class="label">copy as</span>
            <div class="seg" role="group" aria-label="Colour format">
              <For each={COLOR_FORMATS}>
                {(f) => (
                  <button type="button" aria-pressed={b.settings.format === f} onClick={() => (b.settings.format = f)}>
                    {f}
                  </button>
                )}
              </For>
            </div>
            <span class="spacer" />
            <Show when={hasDropper}>
              <button type="button" class="act" onClick={() => b.eyeDropper()}>
                Screen picker
              </button>
            </Show>
          </div>
          <Show when={b.samples()[0]} fallback={<p class="dim">no samples yet</p>}>
            {(first) => (
              <>
                <dl class="fields">
                  <For each={COLOR_FORMATS}>
                    {(f) => (
                      <div>
                        <dt class="micro">{f}</dt>
                        <dd>
                          <button type="button" class="value" onClick={() => copy(formatColor(first(), f), f)}>
                            <Show when={f === "hex"}>
                              <i class="sw" style={{ background: formatColor(first(), "hex") }} />
                            </Show>
                            {formatColor(first(), f)}
                          </button>
                        </dd>
                      </div>
                    )}
                  </For>
                </dl>
                <div class="row" role="list" aria-label="Recent samples">
                  <Index each={b.samples()}>
                    {(c) => (
                      <button
                        type="button"
                        role="listitem"
                        class="chipsw"
                        style={{ background: formatColor(c(), "hex") }}
                        aria-label={`Copy ${formatColor(c(), b.settings.format)}`}
                        onClick={() => b.addSample(c())}
                      />
                    )}
                  </Index>
                </div>
              </>
            )}
          </Show>
        </div>
      </Show>

      {/* Accessibility */}
      <Show when={b.tool() === "a11y"}>
        <div class="body">
          <Show when={b.a11y()}>
            {(a) => (
              <dl class="fields">
                <div>
                  <dt class="micro">element</dt>
                  <dd>{a().label}</dd>
                </div>
                <div>
                  <dt class="micro">role</dt>
                  <dd>{a().role}</dd>
                </div>
                <div>
                  <dt class="micro">name</dt>
                  <dd class={a().control && !a().name ? "warn" : undefined}>{a().name || "none"}</dd>
                </div>
                <Show when={a().states.length}>
                  <div>
                    <dt class="micro">states</dt>
                    <dd>{a().states.join(", ")}</dd>
                  </div>
                </Show>
                <div>
                  <dt class="micro">tab</dt>
                  <dd>{a().tabindex === null ? "not focusable" : `tabindex ${a().tabindex}`}</dd>
                </div>
                <div>
                  <dt class="micro">target</dt>
                  <dd class={a().control && (a().box.w < 24 || a().box.h < 24) ? "warn" : undefined}>
                    {a().box.w}×{a().box.h}
                  </dd>
                </div>
              </dl>
            )}
          </Show>
          <p class="row">
            <span class="label">stage</span> {b.order().length} tab stops, {b.marks().length} issue
            {b.marks().length === 1 ? "" : "s"}
          </p>
          <Show when={b.marks().length}>
            <ul class="issues">
              <Index each={b.marks()}>
                {(m) => (
                  <li>
                    <span class="grade">{m().kind}</span> {m().note}
                  </li>
                )}
              </Index>
            </ul>
          </Show>
        </div>
      </Show>

      {/* Guides and the layout grid */}
      <Show when={b.tool() === "guides"}>
        <div class="body">
          <form
            class="row"
            onSubmit={(e) => {
              e.preventDefault()
              addGuide()
            }}
          >
            <div class="seg" role="group" aria-label="Guide direction">
              <button type="button" aria-pressed={b.guideAxis() === "x"} onClick={() => b.setGuideAxis("x")}>
                Vertical (V)
              </button>
              <button type="button" aria-pressed={b.guideAxis() === "y"} onClick={() => b.setGuideAxis("y")}>
                Horizontal (H)
              </button>
            </div>
            <label class="num">
              at{" "}
              <input
                value={guideAt()}
                type="number"
                min="0"
                max={9999}
                onInput={(e) => setGuideAt(+e.currentTarget.value)}
              />{" "}
              px
            </label>
            <button type="submit" class="act">
              Add guide
            </button>
          </form>
          <Show when={b.ws().guides.length}>
            <ul class="tags">
              <Keyed each={b.ws().guides}>
                {(g) => (
                  <li>
                    {g().axis === "x" ? "│" : "─"} {Math.round(g().at)}{" "}
                    <button
                      type="button"
                      class="x"
                      aria-label={`Remove the guide at ${Math.round(g().at)}`}
                      onClick={() => removeGuide(g().id)}
                    >
                      <Icon d={ICONS.close} size={10} />
                    </button>
                  </li>
                )}
              </Keyed>
            </ul>
          </Show>
          <div class="grid-ctl">
            <label class="check">
              <input
                type="checkbox"
                checked={grid().show.columns}
                onChange={(e) => showGrid("columns", e.currentTarget.checked)}
              />{" "}
              columns
            </label>
            <label class="num">
              <input
                type="number"
                min="1"
                max="48"
                value={grid().columns}
                aria-label="Column count"
                onChange={(e) => setGrid("columns", +e.currentTarget.value)}
              />
            </label>
            <label class="num">
              gutter{" "}
              <input
                type="number"
                min="0"
                value={grid().gutter}
                onChange={(e) => setGrid("gutter", +e.currentTarget.value)}
              />
            </label>
            <label class="num">
              margin{" "}
              <input
                type="number"
                min="0"
                value={grid().margin}
                onChange={(e) => setGrid("margin", +e.currentTarget.value)}
              />
            </label>
            <label class="check">
              <input
                type="checkbox"
                checked={grid().show.rows}
                onChange={(e) => showGrid("rows", e.currentTarget.checked)}
              />{" "}
              rows
            </label>
            <label class="num">
              <input
                type="number"
                min="1"
                max="48"
                value={grid().rows}
                aria-label="Row count"
                onChange={(e) => setGrid("rows", +e.currentTarget.value)}
              />
            </label>
            <label class="num">
              gutter{" "}
              <input
                type="number"
                min="0"
                value={grid().rowGutter}
                aria-label="Row gutter"
                onChange={(e) => setGrid("rowGutter", +e.currentTarget.value)}
              />
            </label>
            <label class="check">
              <input
                type="checkbox"
                checked={grid().show.pixel}
                onChange={(e) => showGrid("pixel", e.currentTarget.checked)}
              />{" "}
              pixel grid
            </label>
            <label class="num">
              <input
                type="number"
                min="2"
                max="128"
                value={grid().pixel}
                aria-label="Pixel grid size"
                onChange={(e) => setGrid("pixel", +e.currentTarget.value)}
              />{" "}
              px
            </label>
          </div>
        </div>
      </Show>

      {/* Pens */}
      <Show when={b.tool() === "pen" || b.tool() === "eraser"}>
        <div class="body">
          <div class="row">
            <div class="seg" role="group" aria-label="Pen">
              <button type="button" aria-pressed={b.settings.pen === "ink"} onClick={() => (b.settings.pen = "ink")}>
                ink
              </button>
              <button
                type="button"
                aria-pressed={b.settings.pen === "marker"}
                onClick={() => (b.settings.pen = "marker")}
              >
                marker
              </button>
            </div>
            <Show
              when={b.settings.pen === "ink"}
              fallback={
                <label class="num">
                  width{" "}
                  <input
                    value={b.settings.markerWidth}
                    type="range"
                    min="4"
                    max="48"
                    onInput={(e) => (b.settings.markerWidth = +e.currentTarget.value)}
                  />{" "}
                  {b.settings.markerWidth}
                </label>
              }
            >
              <label class="num">
                width{" "}
                <input
                  value={b.settings.inkWidth}
                  type="range"
                  min="1"
                  max="24"
                  onInput={(e) => (b.settings.inkWidth = +e.currentTarget.value)}
                />{" "}
                {b.settings.inkWidth}
              </label>
            </Show>
          </div>
          <div class="row" role="radiogroup" aria-label={`${b.settings.pen} colour`}>
            <For each={SWATCHES}>
              {(s) => (
                <button
                  type="button"
                  role="radio"
                  class="chipsw"
                  aria-checked={(b.settings.pen === "ink" ? b.settings.inkSwatch : b.settings.markerSwatch) === s}
                  aria-label={s}
                  style={{ background: swatch(s) }}
                  onClick={() =>
                    b.settings.pen === "ink" ? (b.settings.inkSwatch = s) : (b.settings.markerSwatch = s)
                  }
                />
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Arrows and notes take the annotate colour */}
      <Show when={b.tool() === "arrow" || b.tool() === "text"}>
        <div class="row" role="radiogroup" aria-label="Annotation colour">
          <For each={SWATCHES}>
            {(s) => (
              <button
                type="button"
                role="radio"
                class="chipsw"
                aria-checked={b.settings.annotate === s}
                aria-label={s}
                style={{ background: swatch(s) }}
                onClick={() => (b.settings.annotate = s)}
              />
            )}
          </For>
        </div>
      </Show>

      {/* Selection */}
      <Show when={b.tool() === "select"}>
        <div class="row">
          <span class="label">selected</span> {b.selection().length}
          <span class="spacer" />
          <button type="button" class="act" disabled={!b.selection().length} onClick={() => b.removeSelection()}>
            Delete
          </button>
          <button type="button" class="act" onClick={() => b.clearAll()}>
            Clear all
          </button>
        </div>
      </Show>

      {/* Comments */}
      <Show when={b.tool() === "comment"}>
        <div class="body">
          <div class="row">
            <input
              value={search()}
              type="search"
              class="search"
              placeholder="Search threads"
              aria-label="Search threads"
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
            <span class="spacer" />
            <button type="button" class="act" onClick={() => b.copyForAgent()}>
              {b.o.send ? "Send to the agent" : "Copy for agent"} (K)
            </button>
          </div>
          <Show
            when={threads().length}
            fallback={
              <p class="dim">{search() ? "No thread matches." : "No threads yet. Click an element on the stage."}</p>
            }
          >
            <ol class="threads">
              <Keyed each={threads()}>
                {(th) => (
                  <li>
                    <button
                      type="button"
                      class={th().resolved ? "thread resolved" : "thread"}
                      onClick={() => b.setOpenThread(th().id)}
                    >
                      <span class="n">{th().n}</span>
                      <span class="what">{th().messages[0]?.text}</span>
                      <span class="dim">
                        {th().anchor.label}
                        {th().resolved ? ", resolved" : ""}, {th().messages.length}{" "}
                        {th().messages.length === 1 ? "message" : "messages"}
                      </span>
                    </button>
                  </li>
                )}
              </Keyed>
            </ol>
          </Show>
        </div>
      </Show>

      {/* Capture */}
      <Show when={b.capture()}>
        <div class="body">
          <Show when={b.capture()?.kind === "recording"}>
            <div class="row">
              <span class="rec" aria-hidden="true" />
              <span>
                Recording {clock(elapsed())} / {clock(MAX_SECONDS)}
              </span>
              <span class="spacer" />
              <button type="button" class="act primary" onClick={() => b.finishRecording()}>
                <Icon d={ICONS.stop} size={12} /> Stop (Esc)
              </button>
            </div>
          </Show>
          <Show when={shot()}>
            {(c) => (
              <>
                <img src={c().url} alt="The captured region" class="shot" />
                <div class="row">
                  <button type="button" class="act" onClick={copyShot}>
                    <Icon d={ICONS.copy} size={12} /> Copy
                  </button>
                  <button type="button" class="act" onClick={saveShot}>
                    <Icon d={ICONS.download} size={12} /> Download
                  </button>
                  <span class="spacer" />
                  <button type="button" class="act" onClick={() => b.discardCapture()}>
                    Discard
                  </button>
                </div>
              </>
            )}
          </Show>
          <Show when={video()}>
            {(c) => (
              <>
                <video src={c().url} class="shot" controls muted playsinline aria-label="The recording" />
                <div class="row">
                  <label class="num">
                    in{" "}
                    <input
                      type="range"
                      min="0"
                      max={c().duration}
                      step="0.1"
                      value={c().start}
                      aria-label="Trim start"
                      onInput={(e) => trim("start", +e.currentTarget.value)}
                    />{" "}
                    {c().start.toFixed(1)}s
                  </label>
                  <label class="num">
                    out{" "}
                    <input
                      type="range"
                      min="0"
                      max={c().duration}
                      step="0.1"
                      value={c().end}
                      aria-label="Trim end"
                      onInput={(e) => trim("end", +e.currentTarget.value)}
                    />{" "}
                    {c().end.toFixed(1)}s
                  </label>
                </div>
                <div class="row">
                  <div class="seg" role="group" aria-label="Export format">
                    <For each={types}>
                      {(v) => (
                        <button
                          type="button"
                          aria-pressed={b.videoMime() === v.mime}
                          onClick={() => b.setVideoMime(v.mime)}
                        >
                          {v.label}
                        </button>
                      )}
                    </For>
                  </div>
                  <span class="spacer" />
                  <button type="button" class="act primary" disabled={b.busy()} onClick={() => b.exportVideo()}>
                    <Icon d={ICONS.download} size={12} />{" "}
                    {b.busy() ? "Encoding…" : b.videoMime() === GIF ? "Save GIF" : "Save video"}
                  </button>
                  <button type="button" class="act" onClick={() => b.discardCapture()}>
                    Discard
                  </button>
                </div>
              </>
            )}
          </Show>
        </div>
      </Show>

      <p class="status" role="status" aria-live="polite">
        {b.status()}
      </p>
    </section>
  )
}
