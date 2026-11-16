import { createSignal, type JSX, splitProps } from "solid-js"
import { copyText } from "@dither-ui/kit"
import { cn } from "@dither-ui/kit/tailwind/lib.ts"
import { play } from "../lib/sound"

type Own = { code: string; class?: string }
type CodeBlockProps = Own & Omit<JSX.HTMLAttributes<HTMLDivElement>, keyof Own>

export default function CodeBlock(raw: CodeBlockProps) {
  const [props, rest] = splitProps(raw, ["code", "class"])
  const [copied, setCopied] = createSignal(false)
  async function copy() {
    setCopied(await copyText(props.code))
    if (copied()) play("copy")
    if (copied()) setTimeout(() => setCopied(false), 1400)
  }

  return (
    <div
      {...rest}
      class={cn(
        "relative rounded-lg border border-transparent bg-background/60 shadow-[0_0_0_1px_rgba(255,255,255,0.07)]",
        props.class,
      )}
    >
      {/* Right gutter reserved under the chip (pr on the pre) plus this fade:
          horizontal overflow on phones had zero affordance — lines just ran
          off the screen under a translucent chip. On phones the chip also
          takes its own band over the first line (pt on the pre). */}
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-lg bg-gradient-to-l from-background to-transparent"
        aria-hidden="true"
      />
      <button
        type="button"
        class="absolute right-2 top-2 z-10 rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        onClick={copy}
      >
        {copied() ? "copied" : "copy"}
      </button>
      <pre class="overflow-x-auto touch-pan-x p-4 pt-11 pr-16 font-mono text-[12px] leading-relaxed text-foreground sm:pt-4">
        <code>{props.code}</code>
      </pre>
    </div>
  )
}
