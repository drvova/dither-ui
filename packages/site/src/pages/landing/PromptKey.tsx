// "Copy agent prompt": the skill to read and the install to run, pointed at
// wherever this page is served from (read in the browser: a server knows no
// origin). An island of the landing.
import { createSignal, onMount } from "solid-js"
import { DitherClipboard, DitherIcon } from "@dither-ui/kit"
import { assetPath } from "@/shared/lib/routes"

export default function PromptKey() {
  const [prompt, setPrompt] = createSignal("")
  onMount(() =>
    setPrompt(
      [
        `Read ${location.origin}${assetPath("/agent/SKILL.md")} and add dither-ui to this project:`,
        "copy the kit with `npx degit drvova/dither-ui/packages/dither-kit/src src/dither-kit`,",
        "install d3-scale, d3-shape, clsx and tailwind-merge, alias @dither-kit to src/dither-kit/tailwind,",
        "then build what I ask from its components.",
      ].join(" "),
    ),
  )
  return (
    <DitherClipboard value={prompt()}>
      {(scope) => (
        <button type="button" class="key prompt-key" aria-label={scope.copied ? "Agent prompt copied" : undefined}>
          <DitherIcon name={scope.copied ? "Check" : "Copy"} size={12} strokeWidth={1.5} />
          {scope.copied ? "Copied" : "Copy agent prompt"}
        </button>
      )}
    </DitherClipboard>
  )
}
