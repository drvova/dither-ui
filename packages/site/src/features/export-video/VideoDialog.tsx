import { copyText, DitherFocusScope, DitherIcon } from "@dither-ui/kit"
import { Presence } from "@dither-ui/kit/solid/runtime/presence.tsx"
import { createEffect, createSignal, For, on, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { selectedArtboard } from "@/entities/editor"
import {
  DEFAULT_VIDEO,
  defaultSeconds,
  downloadComposition,
  playerUrl,
  renderCommand,
  type VideoOptions,
  videoFileName,
} from "@/entities/video"
import "./VideoDialog.css"

export type VideoDialogProps = { open: boolean; onClose?: () => void }

export default function VideoDialog(props: VideoDialogProps) {
  const [options, setOptions] = createStore<VideoOptions>({ ...DEFAULT_VIDEO })
  const frame = () => selectedArtboard.value
  const [busy, setBusy] = createSignal(false)
  const [status, setStatus] = createSignal("")
  let closeRef: HTMLButtonElement | undefined
  createEffect(
    on(
      () => props.open,
      (v) => {
        if (!v) return
        // A reel is as long as its cut; anything else keeps the house default.
        const a = frame()
        if (a) setOptions("seconds", defaultSeconds(a))
        queueMicrotask(() => closeRef?.focus())
      },
    ),
  )

  async function download() {
    const a = frame()
    if (!a || busy()) return
    setBusy(true)
    setStatus("")
    try {
      setStatus(`saved ${await downloadComposition(a, { ...options })}`)
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  function preview() {
    const a = frame()
    if (a) window.open(playerUrl(a, options.theme), "_blank", "noopener")
  }
  async function copyCommand() {
    const a = frame()
    if (!a) return
    setStatus((await copyText(renderCommand(a))) ? "Command copied" : "Clipboard unavailable")
  }
  const setSeconds = (v: number) => setOptions("seconds", Math.min(600, Math.max(1, Number(v) || 1)))
  // Heard on the element itself, never through Solid's delegation, so the
  // key stops here, before the canvas's own keys on the window.
  function onKeydown(e: KeyboardEvent) {
    if (e.key !== "Escape") return
    e.stopPropagation()
    props.onClose?.()
  }

  return (
    <Presence when={props.open} name="dk-fade">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export video"
        class="video-dialog-scope fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        onClick={(e) => e.target === e.currentTarget && props.onClose?.()}
        on:keydown={onKeydown}
      >
        <DitherFocusScope autofocus={false} class="hardshell flex w-full max-w-md flex-col bg-card">
          <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span class="text-sm font-medium">Export as video</span>
            <button
              ref={(el) => (closeRef = el)}
              type="button"
              class="flex size-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
              onClick={() => props.onClose?.()}
            >
              <DitherIcon name="Close" size={14} strokeWidth={1.5} />
            </button>
          </div>

          <Show
            when={frame()}
            fallback={<p class="m-0 p-4 text-[12px] text-muted-foreground">Select a frame first.</p>}
          >
            {(a) => (
              <div class="grid gap-4 p-4 text-[12px]">
                <p class="m-0 text-muted-foreground">
                  <span class="text-foreground">{a().name}</span> ({a().w}×{a().h}) is the video frame. For 1080p, size
                  it 960×540 and render with <code class="text-foreground">--resolution landscape</code> (an integer
                  upscale, finer dither, same design).
                </p>

                <div class="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2">
                  <label for="video-seconds" class="text-muted-foreground">
                    length
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      id="video-seconds"
                      value={options.seconds}
                      onInput={(e) => setSeconds(parseFloat(e.currentTarget.value))}
                      type="number"
                      min="1"
                      max="600"
                      step="0.5"
                      name="video-seconds"
                      class="field w-20"
                    />
                    <span class="text-muted-foreground">seconds</span>
                  </div>

                  <span id="video-fps-label" class="text-muted-foreground">
                    frame rate
                  </span>
                  <div class="flex gap-1" role="group" aria-labelledby="video-fps-label">
                    <For each={[24, 30, 60] as const}>
                      {(f) => (
                        <button
                          type="button"
                          class="chip"
                          aria-pressed={options.fps === f}
                          onClick={() => setOptions("fps", f)}
                        >
                          {f} fps
                        </button>
                      )}
                    </For>
                  </div>

                  <span id="video-theme-label" class="text-muted-foreground">
                    theme
                  </span>
                  <div class="flex gap-1" role="group" aria-labelledby="video-theme-label">
                    <For each={["dark", "light"] as const}>
                      {(t) => (
                        <button
                          type="button"
                          class="chip"
                          aria-pressed={options.theme === t}
                          onClick={() => setOptions("theme", t)}
                        >
                          {t}
                        </button>
                      )}
                    </For>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" class="action key-chrome" disabled={busy()} onClick={download}>
                    {busy() ? "Building…" : `Download ${videoFileName(a())}`}
                  </button>
                  <button type="button" class="action" onClick={preview}>
                    Preview
                  </button>
                  <button type="button" class="action" onClick={copyCommand}>
                    Copy the render command
                  </button>
                </div>
                <p class="m-0 min-h-4 text-muted-foreground" aria-live="polite">
                  {status()}
                </p>

                <p class="m-0 leading-relaxed text-muted-foreground">
                  A{" "}
                  <a
                    href="https://github.com/heygen-com/hyperframes"
                    target="_blank"
                    rel="noreferrer"
                    class="underline underline-offset-2 text-foreground"
                  >
                    HyperFrames
                  </a>{" "}
                  composition: one self-contained HTML file. Render it with{" "}
                  <code class="text-foreground">{renderCommand(a())}</code> (Node 22 + FFmpeg). Same seeds, same time,
                  same pixels on every run; simulation backgrounds render with{" "}
                  <code class="text-foreground">--workers 1</code>. Any engine:{" "}
                  <code class="text-foreground">
                    npm run frames -- {videoFileName(a())} --browser webkit --mp4 out.mp4
                  </code>{" "}
                  seeks the file frame by frame in Playwright's WebKit, Firefox or Chromium. Your coding agent can do
                  this too: ask it to export the frame as a video.
                </p>
              </div>
            )}
          </Show>
        </DitherFocusScope>
      </div>
    </Presence>
  )
}
