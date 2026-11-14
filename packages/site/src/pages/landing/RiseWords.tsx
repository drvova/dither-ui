// A headline's words for the rise (`rise`): each its own box, so each can
// travel, with the spaces between them left as text, so the line still
// breaks and reads as one. `word` is a class every word wears (the hero's
// chrome ramp sits on each word, one horizon per line).
import { createMemo, For, Show } from "solid-js"
import "./RiseWords.css"

type RiseWordsProps = { text: string; word?: string }

export default function RiseWords(props: RiseWordsProps) {
  const words = createMemo(() => props.text.split(" "))
  return (
    <For each={words()}>
      {(w, i) => (
        <>
          <span data-rise="word" class={`rise-words-scope rise-word${props.word ? ` ${props.word}` : ""}`}>
            {w}
          </span>
          <Show when={i() < words().length - 1}> </Show>
        </>
      )}
    </For>
  )
}
