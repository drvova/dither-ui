import { DitherCopyableText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return <DitherCopyableText value="npm i d3-scale d3-shape clsx tailwind-merge">copy install</DitherCopyableText>
}

export const meta = defineExample({
  component: DitherCopyableText,
  title: "Copyable text",
  studio: {
    group: "inputs",
    frame: { w: 240, h: 80 },
    controls: { value: { demo: "npm i d3-scale d3-shape clsx" }, label: {}, size: { min: 8, max: 24 } },
  },
})
