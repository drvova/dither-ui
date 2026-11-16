// A headline's words for the rise (`RiseWords.css`): each its own box, so
// each can travel, with the spaces between them left as text, so the line
// still breaks and reads as one; each carries its place (`--rise-word`),
// which the stylesheet staggers it by. `word` is a class every word wears
// (the hero's chrome ramp sits on each word, one horizon per line).
import { createMemo, For, Show } from "solid-js"
import "./RiseWords.css"

type RiseWordsProps = { text: string; word?: string }

/** How many words `text` rises as: what a `.rise-open` holder says it
 * waits for (`--rise-words`). */
export const wordsOf = (text: string) => text.split(" ").length

export default function RiseWords(props: RiseWordsProps) {
  const words = createMemo(() => props.text.split(" "))
  return (
    <For each={words()}>
      {(w, i) => (
        <>
          <span
            data-rise="word"
            class={`rise-words-scope rise-word${props.word ? ` ${props.word}` : ""}`}
            style={{ "--rise-word": i() }}
          >
            {w}
          </span>
          <Show when={i() < words().length - 1}> </Show>
        </>
      )}
    </For>
  )
}
