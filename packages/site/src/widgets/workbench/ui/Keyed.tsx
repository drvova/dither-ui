// A list whose rows live as long as their id: the workspace is replaced
// whole on every change (a fresh clone, so undo is a snapshot), and a row
// keyed by the object would be rebuilt each time, dropping a field's focus
// mid-word. Each row reads its item fresh.
import { type Accessor, createMemo, For, type JSX } from "solid-js"

export default function Keyed<T extends { id: string }>(props: {
  each: readonly T[]
  children: (item: Accessor<T>) => JSX.Element
}) {
  const ids = createMemo(() => props.each.map((x) => x.id))
  return (
    <For each={ids()}>
      {(id) => {
        // A row on its way out keeps what it last read.
        const item = createMemo<T>((last) => props.each.find((x) => x.id === id) ?? last, undefined as never)
        return props.children(item)
      }}
    </For>
  )
}
