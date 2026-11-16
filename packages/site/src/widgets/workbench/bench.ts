// The workbench controller: one per preview while its Inspect is on. It
// owns the tool in hand, the undoable workspace, what the overlay measures
// every frame, every pointer gesture on the stage, the keyboard (only for
// the preview under the pointer or holding focus), captures and the agent
// hand-off. The components render from it and call into it; it touches the
// DOM only to read the preview and to measure its own overlay.
//
// It is composed here from its parts in `model/`: the state every part
// shares (`state.ts`), the measuring loop (`measuring.ts`), the selection
// and its transforms (`selection.ts`), notes and comment threads
// (`notes.ts`), the stage's pixels (`pixels.ts`), captures (`recorder.ts`),
// the pointer (`gestures.ts`) and the keys (`keys.ts`). What stays here is
// the tool in hand, the agent hand-off and the controller's lifecycle.
import { createEffect } from "solid-js"
import { copyText, isDirected, release } from "@dither-ui/kit"
import { copySvg, elementSvg, saveSvg, SVG_COPY_SAID } from "@/entities/artboard"
import { play } from "@/shared/lib/sound"
import { TOGGLES, toolById, type ToggleId, type ToolId } from "@/widgets/workbench/model/tools"
import { feedbackMarkdown } from "@/widgets/workbench/model/workspace"
import { createState, dropKeys, ownKeys, type BenchOptions } from "@/widgets/workbench/model/state"
import { createMeasuring } from "@/widgets/workbench/model/measuring"
import { createSelection } from "@/widgets/workbench/model/selection"
import { createNotes } from "@/widgets/workbench/model/notes"
import { createPixels } from "@/widgets/workbench/model/pixels"
import { createRecorder } from "@/widgets/workbench/model/recorder"
import { createGestures } from "@/widgets/workbench/model/gestures"
import { createKeys } from "@/widgets/workbench/model/keys"

export function createBench(o: BenchOptions) {
  const s = createState(o)
  const {
    me,
    settings,
    tool,
    holdTool,
    group,
    showGroup,
    toggles,
    say,
    ws,
    size,
    setHot,
    setHovered,
    setGuideHover,
    setDraft,
    setSelection,
    capture,
  } = s
  const measuring = createMeasuring(s)
  const {
    guideNear,
    boundsOfItem,
    itemAt,
    isSelected,
    selectionBox,
    handleAt,
    scaleTo,
    rotateTo,
    translate,
    removeSelection,
    selectAll,
  } = createSelection(s)
  const {
    addNote,
    commitNote,
    startThread,
    moveThread,
    submitThread,
    reply,
    setResolved,
    removeThread,
    removeMessage,
  } = createNotes(s, { setTool })
  const { snapshot, refreshSnapshot, paintPixels, pixelAt, addSample, eyeDropper } = createPixels(s)
  const { drop, shoot, record, finishRecording, exportVideo, discardCapture } = createRecorder(s)
  const { down, move, up, editAt, wheel, leave, pullGuide } = createGestures(s, {
    guideNear,
    boundsOfItem,
    itemAt,
    isSelected,
    selectionBox,
    handleAt,
    scaleTo,
    rotateTo,
    translate,
    addNote,
    startThread,
    pixelAt,
    addSample,
    shoot,
    record,
  })
  const keys = createKeys(s, {
    removeSelection,
    selectAll,
    translate,
    finishRecording,
    setTool,
    setGroup,
    toggle,
    copyForAgent,
    leave,
  })

  // --- tools -----------------------------------------------------------------

  function setTool(id: ToolId | null) {
    const next = tool() === id ? null : id
    if (next !== tool()) play("tap")
    holdTool(next)
    if (next) showGroup(toolById(next).group)
    setDraft(null)
    setHovered(null)
    setGuideHover(null)
    if (next !== "select") setSelection([])
    if (next === "color" && "EyeDropper" in window) void eyeDropper()
    if (next === "color" || next === "loupe") void refreshSnapshot()
  }

  function setGroup(g: 1 | 2) {
    if (g !== group()) play("tap")
    showGroup(g)
    const t = tool()
    if (t && toolById(t).group !== g) setTool(null)
  }

  function toggle(id: ToggleId) {
    toggles[id] = !toggles[id]
    play(toggles[id] ? "on" : "off")
    say(`${TOGGLES.find((t) => t.id === id)!.label} ${toggles[id] ? "on" : "off"}`)
  }

  // --- the preview as SVG ---------------------------------------------------------

  /** The stage as it stands, its live state, as a layered SVG read the way
   * the Studio reads a frame (`elementSvg`), the overlay left out. */
  const svgOf = () => elementSvg(o.host, o.title, (el) => el.classList.contains("wb"))

  async function copyAsSvg() {
    const svg = svgOf()
    if (!svg) return say("Nothing to copy: the preview is not laid out")
    const how = await copySvg(svg)
    if (how !== "failed") play("copy")
    say(how === "failed" ? "Copy failed" : SVG_COPY_SAID[how])
  }

  function downloadSvg() {
    const svg = svgOf()
    if (!svg) return say("Nothing to save: the preview is not laid out")
    saveSvg(svg, `${o.key.replace(/[^\w-]+/g, "-")}.svg`)
    say("SVG saved")
  }

  // --- the agent hand-off ---------------------------------------------------------

  async function copyForAgent() {
    const md = feedbackMarkdown(ws(), {
      title: o.title,
      url: o.url,
      stage: size(),
      theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
    })
    if (o.send) {
      o.send(md)
      play("copy")
      say("Sent the feedback to the agent")
      return
    }
    const ok = await copyText(md)
    if (ok) play("copy")
    say(ok ? "Copied the feedback for an agent" : "Copy failed")
  }
  /** What K does with the feedback, in words. */
  const feedbackVerb = o.send ? "Send feedback to the agent" : "Copy feedback for an agent"

  // --- lifecycle ----------------------------------------------------------------

  // The frame keeps a lane free on the edge the tray docks to.
  createEffect(() => (o.host.dataset.tray = settings.tray))

  function start() {
    ownKeys(me)
    measuring.start()
    keys.listen()
    if (o.host.matches(":hover")) setHot(true)
  }

  function stop() {
    measuring.stop()
    s.flush()
    keys.unlisten()
    const c = capture()
    if (c?.kind === "recording") void c.rec.stop()
    drop(c)
    if (isDirected()) release()
    delete o.host.dataset.tray
    dropKeys(me)
  }

  return {
    o,
    settings,
    overlay: s.overlay,
    setOverlay: s.setOverlay,
    tool,
    group,
    toggles,
    panel: s.panel,
    setPanel: s.setPanel,
    minimized: s.minimized,
    setMinimized: s.setMinimized,
    status: s.status,
    say,
    ws,
    revision: s.revision,
    history: s.history,
    change: s.change,
    undo: s.undo,
    redo: s.redo,
    clearAll: s.clearAll,
    size,
    pointer: s.pointer,
    hot: s.hot,
    hovered: s.hovered,
    pinned: s.pinned,
    reading: s.reading,
    ghost: s.ghost,
    typeReading: s.typeReading,
    a11y: s.a11y,
    aim: s.aim,
    order: s.order,
    marks: s.marks,
    xray: s.xray,
    alt: s.alt,
    altMeasure: s.altMeasure,
    pins: s.pins,
    guideAxis: s.guideAxis,
    setGuideAxis: s.setGuideAxis,
    guideHover: s.guideHover,
    handleHover: s.handleHover,
    draft: s.draft,
    selection: s.selection,
    isSelected,
    boundsOfItem,
    selectionBox,
    handleAt,
    editing: s.editing,
    commitNote,
    openThread: s.openThread,
    setOpenThread: s.setOpenThread,
    draftThread: s.draftThread,
    setDraftThread: s.setDraftThread,
    submitThread,
    moving: s.moving,
    moveThread,
    reply,
    setResolved,
    removeThread,
    removeMessage,
    samples: s.samples,
    addSample,
    eyeDropper,
    snapshot,
    paintPixels,
    capture,
    setCapture: s.setCapture,
    capturing: s.capturing,
    busy: s.busy,
    videoMime: s.videoMime,
    setVideoMime: s.setVideoMime,
    loupeZoom: s.loupeZoom,
    finishRecording,
    exportVideo,
    discardCapture,
    copyForAgent,
    feedbackVerb,
    copyAsSvg,
    downloadSvg,
    setTool,
    setGroup,
    toggle,
    down,
    move,
    up,
    leave,
    editAt,
    wheel,
    pullGuide,
    removeSelection,
    pinMeasure: keys.pinMeasure,
    escape: keys.escape,
    start,
    stop,
  }
}

export type Bench = ReturnType<typeof createBench>
