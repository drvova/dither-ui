// The player: ONE Studio frame, rendered by the same renderers the Studio
// uses, at its own size, with none of the editor around it. It is the page a
// HyperFrames composition carries (the document embedded as JSON, the kit
// seeked through `hf-seek`) and the page the Studio opens for a live preview
// (`/play/#doc=<base64url document>`). Nothing here reads the editor's
// project store, so the document is whatever the page was given (source.ts).
// A window narrower than the frame (a preview link opened on a phone) shows
// it scaled down to fit, laid out and painted at its own size all the same;
// a composition's window is the frame, so there it stands at 1.
import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import { parseDocument } from "@/entities/editor"
import { FrameRenderer, REEL_POOL } from "@/widgets/frame-renderer"
import type { PlaySource } from "./source"
import "./PlayPage.css"

/** The scale a frame `w` wide is shown at in a window `room` wide: down to
 * fit, never up. */
export const fitScale = (w: number, room: number) => (room > 0 && w > room ? room / w : 1)

export default function PlayPage(props: { source: PlaySource }) {
  const parsed = createMemo(() => parseDocument(props.source.document))
  const [room, setRoom] = createSignal(0)
  onMount(() => {
    const measure = () => setRoom(document.documentElement.clientWidth)
    measure()
    window.addEventListener("resize", measure)
    onCleanup(() => window.removeEventListener("resize", measure))
  })
  const artboard = createMemo<Artboard | null>(() => {
    const doc = parsed()
    if (!doc) return null
    return (
      doc.artboards.find((a) => a.id === props.source.artboardId) ??
      doc.artboards.find((a) => !a.hidden) ??
      doc.artboards[0] ??
      null
    )
  })

  return (
    // A reel's clips travel in the same document; the renderer cuts between them.
    <REEL_POOL.Provider value={() => parsed()?.artboards ?? []}>
      <Show
        when={artboard()}
        fallback={
          <p class="play-page-scope play-empty">No frame to play. Open this page from the Studio's video export.</p>
        }
      >
        {(a) => {
          const scale = () => fitScale(a().w, room())
          return (
            <div
              class="play-page-scope play-fit"
              style={{ width: `${a().w * scale()}px`, height: `${a().h * scale()}px` }}
            >
              <div
                class="play-page-scope play-surface bg-card/60 p-3 text-[13px] text-foreground antialiased"
                data-artboard-id={a().id}
                style={{
                  width: `${a().w}px`,
                  height: `${a().h}px`,
                  transform: scale() < 1 ? `scale(${scale()})` : undefined,
                }}
              >
                <FrameRenderer artboard={a()} />
              </div>
            </div>
          )
        }}
      </Show>
    </REEL_POOL.Provider>
  )
}
