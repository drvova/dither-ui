import { DitherPluralText } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  return (
    <div class="grid justify-center gap-1 text-[13px]">
      <DitherPluralText count={1}>
        {({ count }) => (
          <span>
            <b>{count}</b> result found
          </span>
        )}
      </DitherPluralText>
      <DitherPluralText class="text-muted-foreground" count={7}>
        {({ count }) => (
          <span>
            <b>{count}</b> results found
          </span>
        )}
      </DitherPluralText>
    </div>
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
