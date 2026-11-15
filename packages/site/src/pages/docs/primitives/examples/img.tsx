import { DitherImg } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherImg src="/faces.webp" alt="Portrait" />
}

export const meta = defineExample({
  component: DitherImg,
  title: "Image",
  studio: { group: "display", frame: { w: 240, h: 140 }, controls: { src: { kind: "url" }, alt: {}, loading: {} } },
})
