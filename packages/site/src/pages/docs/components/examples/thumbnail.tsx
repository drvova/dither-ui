import { DitherThumbnail } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <>
      {/* a picture that is a link: it rests under a Bayer veil and wakes under a
           pointer, the picture scaling up a touch inside its frame as the veil goes */}
      <div class="grid gap-4 sm:grid-cols-2">
        <DitherThumbnail src="/sprites.webp" alt="The sprite sheet, in the Image docs" href="/docs/image" />
        <DitherThumbnail
          src="/trailer/poster.webp"
          alt="The film's poster, in the Video player docs"
          href="/docs/video-player"
          ratio="16 / 9"
          veilCell={3}
        />
      </div>
    </>
  )
}

export const meta = defineExample({
  component: DitherThumbnail,
  title: "Thumbnail",
  studio: {
    group: "display",
    frame: { w: 260, h: 160 },
    controls: {
      src: { kind: "url" },
      alt: { demo: "Sprite sheet preview" },
      href: { kind: "url", demo: "https://dither-ui.com/docs" },
      ratio: {},
      veilCell: { min: 2, max: 12, step: 1 },
    },
  },
  states: [{ ratio: "1.25" }],
})
