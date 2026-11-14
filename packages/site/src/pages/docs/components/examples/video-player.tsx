import { DitherVideoPlayer } from "@dither-kit"

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
