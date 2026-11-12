// The workbench of one preview (after Kobra's component workbench and its
// Mesurer tray): the overlay teleported into the preview frame — layout
// grid and guides, measurements, annotations, the pointer surface, rulers,
// notes, comments, the loupe and the tray — and, under the frame, the
// readout and the motion, responsive and settings panels.
import { createMemo, createRenderEffect, type JSX, onCleanup, onMount, Show } from "solid-js"
import { Portal } from "solid-js/web"
import { swatch } from "@/widgets/workbench/model/settings"
import { type Bench, createBench } from "./bench"
import { BENCH } from "./context"
import Comments from "./ui/Comments"
import Guides from "./ui/Guides"
import Ink from "./ui/Ink"
import Loupe from "./ui/Loupe"
import Marks from "./ui/Marks"
import Motion from "./ui/Motion"
import Notes from "./ui/Notes"
import Readout from "./ui/Readout"
import Responsive from "./ui/Responsive"
import Rulers from "./ui/Rulers"
import Settings from "./ui/Settings"
import Tray from "./ui/Tray"
import "./Workbench.css"

export type WorkbenchApi = { bench: Bench }

export type WorkbenchProps = {
  host: HTMLElement
  content: HTMLElement
  card: HTMLElement
  benchKey: string
  section: string
  title: string
  url: string
  render?: () => JSX.Element
  /** Where K sends the feedback when there is an agent to take it. */
  send?: (markdown: string) => void
  onExit?: () => void
  ref?: (api: WorkbenchApi) => void
}

const CURSORS: Record<string, string> = {
  inspect: "crosshair",
  xray: "crosshair",
  type: "text",
  color: "crosshair",
  loupe: "none",
  a11y: "help",
  select: "default",
  arrow: "crosshair",
  pen: "crosshair",
  eraser: "none",
  text: "text",
  comment: "cell",
  shot: "crosshair",
  video: "crosshair",
}
const HANDLE_CURSORS: Record<string, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  rotate: "grab",
}

export default function Workbench(props: WorkbenchProps) {
  // One controller for the life of the mount: the frame it is given is the
  // frame it keeps.
  const b = createBench({
    host: props.host,
    content: props.content,
    card: props.card,
    key: props.benchKey,
    section: props.section,
    title: props.title,
    url: props.url,
    exit: () => props.onExit?.(),
    send: props.send,
  })
  onMount(() => {
    b.start()
    onCleanup(b.stop)
  })
  props.ref?.({ bench: b })

  const cursor = createMemo(() =>
    b.tool() === "select" && b.handleHover()
      ? HANDLE_CURSORS[b.handleHover()!]
      : b.tool() === "guides"
        ? b.guideAxis() === "x"
          ? "col-resize"
          : "row-resize"
        : (CURSORS[b.tool() ?? ""] ?? "auto"),
  )

  /** The portal's own element is the overlay, so the frame holds `.wb`
   * directly and the frame's radius reaches the layers. */
  function overlay(el: HTMLDivElement) {
    b.setOverlay(el)
    createRenderEffect(() => (el.className = b.capturing() ? "wb capturing" : "wb"))
    createRenderEffect(() => el.style.setProperty("--wb-hl", swatch(b.settings.highlight)))
    createRenderEffect(() => el.style.setProperty("--wb-guide", swatch(b.settings.guide)))
  }

  return (
    <BENCH.Provider value={b}>
      <Portal mount={props.host} ref={overlay}>
        <Guides />
        <Marks />
        <Ink />
        <Show when={b.tool()}>
          <div
            class="wb-surface"
            style={{ cursor: cursor() }}
            on:pointerdown={b.down}
            on:pointermove={b.move}
            on:pointerup={b.up}
            on:pointercancel={b.up}
            on:pointerleave={b.leave}
            on:dblclick={b.editAt}
            on:wheel={b.wheel}
            on:contextmenu={(e) => e.preventDefault()}
          />
        </Show>
        <Show when={b.toggles.rulers}>
          <Rulers />
        </Show>
        <Notes />
        <Comments />
        <Show when={(b.tool() === "loupe" || b.tool() === "color") && b.pointer()}>
          <Loupe />
        </Show>
        <Tray />
      </Portal>
      <Readout />
      <Show when={b.toggles.motion}>
        <Motion />
      </Show>
      <Show when={b.toggles.responsive}>
        <Responsive render={props.render} />
      </Show>
      <Show when={b.panel() === "settings"}>
        <Settings />
      </Show>
    </BENCH.Provider>
  )
}
