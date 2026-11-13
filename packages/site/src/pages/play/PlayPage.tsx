// The player: ONE Studio frame, rendered by the same renderers the Studio
// uses, at its own size, with none of the editor around it. It is the page a
// HyperFrames composition carries (the document embedded as JSON, the kit
// seeked through `hf-seek`) and the page the Studio opens for a live preview
// (`/play/#doc=<base64url document>`). Nothing here reads the editor's
// project store, so the document is whatever the page was given (source.ts).
import { createMemo, Show } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import { parseDocument } from "@/features/persistence"
import { ChartRenderer } from "@/widgets/chart-renderer"
import { REEL_POOL } from "@/widgets/reel-renderer"
import { WidgetRenderer } from "@/widgets/widget-renderer"
import type { PlaySource } from "./source"
import "./PlayPage.css"

export default function PlayPage(props: { source: PlaySource }) {
  const parsed = createMemo(() => parseDocument(props.source.document))
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
        {(a) => (
          <div
            class="play-page-scope play-surface bg-card/60 p-3 text-[13px] text-foreground antialiased"
            data-artboard-id={a().id}
            style={{ width: `${a().w}px`, height: `${a().h}px` }}
          >
            <Show
              when={a().widget}
              fallback={
                <div class="h-full">
                  <ChartRenderer chart={a().chart} />
                </div>
              }
            >
              {(widget) => <WidgetRenderer widget={widget()} artboardId={a().id} />}
            </Show>
          </div>
        )}
      </Show>
    </REEL_POOL.Provider>
  )
}
