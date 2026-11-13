import { For, Show } from "solid-js"
import { DitherIcon } from "dither-kit"
import { type Attachment, chipOf } from "@/widgets/agent/model/compose"
import "./Attached.css"

// What the message carries besides its words, as chips beside its frames:
// a picture with its thumbnail and size, a pasted or dropped text with its
// lines (pressed, it goes back into the field as typed text).
export type AttachedProps = {
  attachments: Attachment[]
  onRemove?: (id: string) => void
  onUnfold?: (id: string) => void
}

export default function Attached(props: AttachedProps) {
  return (
    <For each={props.attachments}>
      {(a) => (
        <span class="attached-scope ctx first-line" data-kind={a.kind}>
          <Show
            when={a.kind === "image" && a}
            fallback={<DitherIcon name={a.kind === "quote" ? "Bookmark" : "File"} size={11} strokeWidth={1.5} />}
          >
            {(img) => (
              <img class="thumb" src={`data:${img().mimeType};base64,${img().data}`} alt="" width="14" height="14" />
            )}
          </Show>
          <Show
            when={a.kind === "text"}
            fallback={
              <span class="row-label is-wrap">
                {chipOf(a).name} <span class="dim">{chipOf(a).detail}</span>
              </span>
            }
          >
            <button
              type="button"
              class="unfold row-label is-wrap"
              title={`Put ${a.name} back in the field as text`}
              onClick={() => props.onUnfold?.(a.id)}
            >
              {chipOf(a).name} <span class="dim">{chipOf(a).detail}</span>
            </button>
          </Show>
          <button type="button" class="ctx-x" aria-label={`Remove ${a.name}`} onClick={() => props.onRemove?.(a.id)}>
            <DitherIcon name="Close" size={10} strokeWidth={1.5} />
          </button>
        </span>
      )}
    </For>
  )
}
