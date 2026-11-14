import { For, Show } from "solid-js"
import { DitherIcon } from "@dither-ui/kit"
import type { Changed } from "../model/steps"

// What the turn changed on the canvas, the last part of the trays over the
// input (resting on the card, in the trays' own scope): Undo all, Keep,
// each frame to show, undo or keep; a frame just undone can be put back.
// What it shows is `model/changes.ts`'s.
export type ChangesKeys = {
  /** The frame just undone, by name, which can go back as the turn left it. */
  putBack?: string | null
  /** Frames still on the canvas (a removed one has nothing to show). */
  shown: (id: string) => boolean
  onUndo?: () => void
  onKeep?: () => void
  onShow?: (id: string) => void
  onUndoFrame?: (id: string) => void
  onKeepFrame?: (id: string) => void
  onPutBack?: () => void
}
export const CHANGES_KEYS = [
  "putBack",
  "shown",
  "onUndo",
  "onKeep",
  "onShow",
  "onUndoFrame",
  "onKeepFrame",
  "onPutBack",
] as const satisfies readonly (keyof ChangesKeys)[]

export type ChangesBarProps = ChangesKeys & {
  changes: { frames: Changed[] }
  /** The frames listed (the trays keep it across turns). */
  open: boolean
  onOpen: (open: boolean) => void
}

export default function ChangesBar(props: ChangesBarProps) {
  return (
    <div class="turn-trays-scope part">
      <Show when={props.changes.frames.length}>
        <div class="head is-split">
          <button type="button" class="toggle" aria-expanded={props.open} onClick={() => props.onOpen(!props.open)}>
            <DitherIcon name={props.open ? "ChevronDown" : "ChevronRight"} size={12} strokeWidth={1.5} />
            <span class="row-label">
              {props.changes.frames.length} {props.changes.frames.length === 1 ? "frame" : "frames"} changed
            </span>
          </button>
          <button type="button" class="key" onClick={() => props.onUndo?.()}>
            <span class="row-label">Undo all</span>
          </button>
          <button type="button" class="key is-primary" onClick={() => props.onKeep?.()}>
            <span class="row-label">Keep</span>
          </button>
        </div>
      </Show>
      <Show when={props.putBack}>
        <p class="row first-line dim" role="status">
          <DitherIcon name="Undo" size={12} strokeWidth={1.5} />
          <span class="row-text row-label is-wrap">Undid {props.putBack}</span>
          <button type="button" class="row-key is-word" onClick={() => props.onPutBack?.()}>
            <span class="row-label">Put it back</span>
          </button>
        </p>
      </Show>
      <Show when={props.open && props.changes.frames.length}>
        <ul class="rows">
          <For each={props.changes.frames}>
            {(f) => (
              <li class="row first-line">
                <DitherIcon name="Layout" size={12} strokeWidth={1.5} />
                <span class="row-text row-label is-wrap">{f.name}</span>
                <Show when={props.shown(f.id)}>
                  <button
                    type="button"
                    class="row-key is-word"
                    aria-label={`Show ${f.name}`}
                    onClick={() => props.onShow?.(f.id)}
                  >
                    <span class="row-label">Show</span>
                  </button>
                </Show>
                <button
                  type="button"
                  class="row-key is-word"
                  aria-label={`Undo ${f.name}`}
                  title={`Undo what the turn did to ${f.name}`}
                  onClick={() => props.onUndoFrame?.(f.id)}
                >
                  <span class="row-label">Undo</span>
                </button>
                <button
                  type="button"
                  class="row-key is-word"
                  aria-label={`Keep ${f.name}`}
                  onClick={() => props.onKeepFrame?.(f.id)}
                >
                  <span class="row-label">Keep</span>
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  )
}
