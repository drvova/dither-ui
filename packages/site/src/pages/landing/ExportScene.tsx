// The bento's styling card: one snippet of kit components, rendered live on
// the left and written on the right in the picked styling system by the
// translator the docs and the Studio's export use (`restyle`), StyleX
// first. Its own chunk, fetched as the card nears the viewport: the
// translator carries the compiled utility map.
import { createMemo, createSignal, For } from "solid-js"
import { DitherButton, DitherHeading } from "@dither-ui/kit"
import { STYLINGS, STYLING_LABELS, restyle, type Styling } from "@/shared/lib/restyle"
import "./ExportScene.css"

// The snippet is the live card's own markup, so what is shown is what runs.
const SNIPPET = `<div class="flex flex-col gap-3 rounded-lg bg-background p-4">
  <DitherHeading level="4">Invoices</DitherHeading>
  <p class="text-xs text-muted-foreground">12 paid this week, none overdue.</p>
  <DitherButton color="blue" class="w-full">Send reminders</DitherButton>
</div>`

export default function ExportScene() {
  const [system, setSystem] = createSignal<Styling>("stylex")
  const code = createMemo(() => restyle(SNIPPET, system()))
  // Each line with its own indent, so a line that wraps hangs under itself.
  const lines = createMemo(() =>
    code()
      .split("\n")
      .map((text) => ({ text, indent: text.search(/\S|$/) })),
  )
  return (
    <div class="export-scene-scope export">
      <div class="export-live">
        <div class="flex flex-col gap-3 rounded-lg bg-background p-4">
          <DitherHeading level="4">Invoices</DitherHeading>
          <p class="text-xs text-muted-foreground">12 paid this week, none overdue.</p>
          <DitherButton color="blue" class="w-full">
            Send reminders
          </DitherButton>
        </div>
      </div>
      <div class="export-side">
        <div class="seg" role="group" aria-label="Styling system">
          <For each={STYLINGS}>
            {(s) => (
              <button type="button" aria-pressed={system() === s} onClick={() => setSystem(s)}>
                {STYLING_LABELS[s]}
              </button>
            )}
          </For>
        </div>
        <pre class="export-code" tabindex="0" aria-label="The card's code">
          <code>
            <For each={lines()}>
              {(l) => (
                <span class="ln" style={{ "--indent": l.indent }}>
                  {l.text}
                </span>
              )}
            </For>
          </code>
        </pre>
      </div>
    </div>
  )
}
