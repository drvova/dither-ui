import { copyText, DitherFocusScope, DitherIcon } from "dither-kit"
import { Presence } from "dither-kit/solid/runtime/presence.tsx"
import { createEffect, createMemo, createSignal, on, onCleanup } from "solid-js"
import type { Artboard } from "@/entities/artboard"
import { download } from "@/shared/lib/files"
import { frameCode, shown } from "../../entities/artboard/code"
import { editor, selectedArtboard } from "../../entities/editor"
import { setStyling, styling, STYLING_LABELS, STYLINGS } from "../../shared/lib/restyle"
import { CodeBlock, Segmented } from "../../shared/ui"
import "./ExportDialog.css"

export type ExportDialogProps = { open: boolean; onClose?: () => void }

export default function ExportDialog(props: ExportDialogProps) {
  // The Solid component in the chosen styling system: Tailwind as generated,
  // or a stylesheet, CSS Modules or StyleX (the kit components keep their own
  // styles). A stylesheet is its own file, shown under the component.
  const code = createMemo(() => {
    const a = selectedArtboard.value
    return a ? shown(frameCode(a, styling())) : "// select an artboard"
  })

  let closeRef: HTMLButtonElement | undefined
  // From the first run: the dialog is mounted lazily with `open` already
  // true, so focus (and the Escape listener that rides on it) must reach the
  // dialog then too.
  createEffect(
    on(
      () => props.open,
      (v) => {
        if (v) queueMicrotask(() => closeRef?.focus())
      },
    ),
  )

  const [copied, setCopied] = createSignal(false)
  let copyTimer: ReturnType<typeof setTimeout> | undefined
  async function copy() {
    const done = await copyText(code())
    setCopied(done)
    clearTimeout(copyTimer)
    if (done) copyTimer = setTimeout(() => setCopied(false), 1500)
  }
  onCleanup(() => clearTimeout(copyTimer))

  /** Download every artboard as its own .tsx file, each with the stylesheet
   * it imports where the styling system keeps one (staggered so the browser
   * accepts the download burst as one user gesture). */
  async function downloadAll() {
    for (const a of editor.artboards as Artboard[]) {
      const f = frameCode(a, styling())
      for (const [name, text] of [[f.file, f.code], ...(f.sheet ? [[f.sheet.file, f.sheet.text]] : [])]) {
        download(new Blob([text], { type: "text/plain" }), name)
        await new Promise((r) => setTimeout(r, 120))
      }
    }
  }
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
        aria-label="Export code"
        class="export-dialog-scope fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
        onClick={(e) => e.target === e.currentTarget && props.onClose?.()}
        on:keydown={onKeydown}
      >
        <DitherFocusScope autofocus={false} class="hardshell flex max-h-[80dvh] w-full max-w-2xl flex-col bg-card">
          <div class="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <span class="text-sm font-medium">Export as a Solid component</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                title={`Download every artboard as its own .tsx file (${editor.artboards.length})`}
                class="rounded-lg border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={downloadAll}
              >
                Download all ({editor.artboards.length})
              </button>
              <button
                type="button"
                class="rounded-lg border border-border px-3 py-1 text-[11px] transition-colors"
                classList={{
                  "text-foreground": copied(),
                  "text-muted-foreground hover:text-foreground": !copied(),
                }}
                onClick={copy}
              >
                {copied() ? "Copied" : "Copy"}
              </button>
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
          </div>
          <div class="border-b border-border/60 px-4 py-2">
            <Segmented
              options={STYLINGS}
              labels={STYLING_LABELS}
              modelValue={styling()}
              label="styling"
              onUpdateModelValue={setStyling}
            />
          </div>
          <div class="overflow-auto p-4">
            <CodeBlock code={code()} />
          </div>
        </DitherFocusScope>
      </div>
    </Presence>
  )
}
