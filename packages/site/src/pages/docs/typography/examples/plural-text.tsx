import { DitherPluralText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <DitherPluralText count={1} one={(scope) => <>{scope.count} result found</>}>
      {(scope) => <>{scope.count} results found</>}
    </DitherPluralText>
  )
}

export const meta = defineExample({
  component: DitherPluralText,
  title: "Plural",
  studio: {
    group: "display",
    frame: { w: 240, h: 80 },
    controls: { count: { min: 0, max: 99 }, locale: {} },
    slot: "results found",
  },
  states: [{ locale: "de-DE" }],
})
