import { createSignal } from "solid-js"
import { type ConsoleLine, DitherConsole, DitherButton } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const [lines, setLines] = createSignal<ConsoleLine[]>([
    { text: "$ deploy --prod", at: "12:01" },
    { text: "building 34 routes…", at: "12:01" },
    { text: "build ok (4.2s)", at: "12:01", level: "success" },
  ])
  const [deploying, setDeploying] = createSignal(false)

  function deploy() {
    setDeploying(true)
    const steps: ConsoleLine[] = [
      { text: "uploading assets…" },
      { text: "warn: chunk over 300kB", level: "warn" },
      { text: "deployed to dither-ui.com", level: "success" },
    ]
    steps.forEach((line, i) =>
      setTimeout(
        () => {
          setLines([...lines(), { ...line, at: new Date().toTimeString().slice(0, 5) }])
          if (i === steps.length - 1) setDeploying(false)
        },
        450 * (i + 1),
      ),
    )
  }

  return (
    <>
      {/* lines: strings or { text, level, at }; level tints through the palette
           (success, warn, error); follow keeps the newest line in view, and the
           caret blinks (held still under reduced motion) */}
      <DitherConsole
        lines={lines()}
        title="deploy"
        class="h-48"
        actions={
          <DitherButton color="green" onClick={deploy} disabled={deploying()}>
            Run
          </DitherButton>
        }
      />
    </>
  )
}

export const meta = defineExample({
  component: DitherConsole,
  title: "Console",
  studio: {
    group: "structure",
    frame: { w: 340, h: 220 },
    controls: {
      title: { demo: "console" },
      lines: { kind: "list", demo: ["$ rs build", "building…", "built in 4.2s"] },
      follow: {},
      caret: {},
    },
  },
})
