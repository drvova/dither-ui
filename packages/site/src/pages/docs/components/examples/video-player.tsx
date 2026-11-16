import { DitherVideoPlayer } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      {/* a native <video> under dither chrome: play, a dithered scrubber,
           tabular time, mute and fullscreen; no src is an honest empty face */}
      <DitherVideoPlayer
        src="/trailer/dither-ui.mp4"
        poster="/trailer/poster.webp"
        label="The dither-ui film"
        color="blue"
      />
    </>
  )
}

export const meta = defineExample({
  component: DitherVideoPlayer,
  title: "Video player",
  studio: {
    group: "display",
    frame: { w: 360, h: 280 },
    controls: { src: { kind: "url", demo: "" }, label: { demo: "Video" }, color: {} },
  },
})
