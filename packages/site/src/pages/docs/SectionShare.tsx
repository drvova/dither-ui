// The section in view, to share: under "On this page", a disclosure that
// shows the section's share card playing (the GIF the build draws at
// og/<id>.gif, the one Discord and Slack play) and copies the section as a
// link, or the card as a Markdown or HTML image that links back, for a
// README, an issue or a post. The card loads only once the disclosure is
// open; where no build drew it (dev) the image hides itself.
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from "solid-js"
import { copyText, DitherIcon } from "dither-kit"
import { docsMeta, SITE_URL } from "@/pages/docs/seo"
import { assetPath } from "@/shared/lib"
import { play } from "@/shared/lib/sound"

export type SectionShareProps = { id: string }

export default function SectionShare(props: SectionShareProps) {
  const [open, setOpen] = createSignal(false)
  const [gone, setGone] = createSignal(false)
  const [copied, setCopied] = createSignal("")
  const [said, setSaid] = createSignal("")
  let timer: ReturnType<typeof setTimeout> | undefined
  onCleanup(() => clearTimeout(timer))

  const meta = createMemo(() => docsMeta(props.id))
  const card = createMemo(() => `${SITE_URL}/og/${props.id}.gif`)
  const alt = createMemo(() => `${meta().label} in the dither-ui docs`)
  const SNIPPETS = createMemo(() => [
    { id: "link", icon: "Link" as const, label: "Copy link", text: meta().url },
    {
      id: "markdown",
      icon: "Code" as const,
      label: "Copy Markdown",
      text: `[![${alt()}](${card()})](${meta().url})`,
    },
    {
      id: "html",
      icon: "Image" as const,
      label: "Copy HTML",
      text: `<a href="${meta().url}"><img src="${card()}" alt="${alt()}" width="600" height="315"></a>`,
    },
  ])

  createEffect(
    on(
      () => props.id,
      () => {
        setGone(false)
        setCopied("")
      },
      { defer: true },
    ),
  )

  async function copy(s: { id: string; label: string; text: string }) {
    if (!(await copyText(s.text))) return
    play("copy")
    setCopied(s.id)
    setSaid(`${s.label.replace("Copy ", "")} copied`)
    clearTimeout(timer)
    timer = setTimeout(() => setCopied(""), 1500)
  }

  return (
    <div class="mt-8">
      <button
        type="button"
        class="flex min-h-6 items-center gap-2 text-left text-[11px] font-medium text-foreground"
        aria-expanded={open() ? "true" : "false"}
        aria-controls="section-share"
        onClick={() => setOpen(!open())}
      >
        <DitherIcon name="Share" size={13} strokeWidth={1.5} />
        Share<span class="sr-only"> this section</span>
      </button>
      <Show when={open()}>
        <div id="section-share" class="mt-2.5 grid gap-1">
          <Show when={!gone()}>
            <img
              src={assetPath(`/og/${props.id}.gif`)}
              alt={`The ${meta().label} card, playing`}
              width="160"
              height="84"
              decoding="async"
              class="mb-1.5 block h-auto w-full rounded-[6px] ring-1 ring-border/60"
              onError={() => setGone(true)}
            />
          </Show>
          <For each={SNIPPETS()}>
            {(s) => (
              <button
                type="button"
                class="flex min-h-6 items-center gap-2 text-left text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => void copy(s)}
              >
                <DitherIcon name={copied() === s.id ? "Check" : s.icon} size={12} strokeWidth={1.5} />
                {copied() === s.id ? "Copied" : s.label}
              </button>
            )}
          </For>
          <span class="sr-only" aria-live="polite">
            {said()}
          </span>
        </div>
      </Show>
    </div>
  )
}
