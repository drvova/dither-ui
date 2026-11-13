// The film: the site in use in under a minute, captioned, over the kit's own
// score. Nothing of it loads until the dialog opens (the
// <video> exists only while it is open); opening it was the visitor's ask,
// so it plays at once, except under reduced motion, where it waits on its
// poster for play. H.264 first (Safari, Chrome, Edge, Firefox), VP9 for a
// browser built without it. The kit's dialog traps focus, closes on Escape
// and the backdrop, and hands focus back to the key that opened it.
import { Show } from "solid-js"
import { DitherDialog } from "dither-kit"
import { FILM } from "@/pages/landing/film"
import { assetPath } from "@/shared/lib"
import "./TrailerDialog.css"

export type TrailerDialogProps = {
  /** Whether the film's dialog is open. */
  modelValue: boolean
  onUpdateModelValue?: (open: boolean) => void
}

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
// Played in the open's own tick, inside the visitor's tap: iOS WebKit lets
// a film with sound start only from a gesture, and refuses `autoplay` on
// one. Refused anyway, it waits on its poster with its controls. (A ref
// runs before its element is in the page: the play waits out the render.)
const start = (el: HTMLVideoElement) =>
  queueMicrotask(() => {
    if (!still()) el.play().catch(() => {})
  })

export default function TrailerDialog(props: TrailerDialogProps) {
  return (
    <DitherDialog
      open={props.modelValue}
      title={FILM.title}
      description={FILM.description}
      class="max-w-5xl"
      onClose={() => props.onUpdateModelValue?.(false)}
    >
      <Show when={props.modelValue}>
        <video
          class="trailer-dialog-scope trailer"
          ref={start}
          poster={assetPath("/trailer/poster.webp")}
          controls
          playsinline
          preload="metadata"
          width="1920"
          height="1080"
        >
          <source src={assetPath("/trailer/dither-ui.mp4")} type="video/mp4" />
          <source src={assetPath("/trailer/dither-ui.webm")} type="video/webm" />
        </video>
      </Show>
    </DitherDialog>
  )
}
