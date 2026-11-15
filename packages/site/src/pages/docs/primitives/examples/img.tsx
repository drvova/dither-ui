import { DitherImg } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example(props: { src?: string }) {
  // loading contract built in; alt is required
  return (
    <DitherImg
      class="h-40 w-full rounded-md object-cover"
      src={props.src ?? "/sprites.webp"}
      alt="The dither-ui sprite sheet"
    />
  )
}

export const meta = defineExample({
  component: DitherImg,
  title: "Image",
  studio: { group: "display", frame: { w: 240, h: 140 }, controls: { src: { kind: "url" }, alt: {}, loading: {} } },
})
