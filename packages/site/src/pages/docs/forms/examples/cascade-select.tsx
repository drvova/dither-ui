import { createSignal } from "solid-js"
import { DitherCascadeSelect } from "@dither-kit"
import { defineExample } from "@/shared/lib/example"

export default function Example() {
  const TREE = [
    {
      value: "Japan",
      children: [
        { value: "Kansai", children: [{ value: "Kyoto" }, { value: "Osaka" }] },
        { value: "Kanto", children: [{ value: "Tokyo" }, { value: "Yokohama" }] },
      ],
    },
    { value: "Korea", children: [{ value: "Seoul Region", children: [{ value: "Seoul" }, { value: "Incheon" }] }] },
  ]
  const [region, setRegion] = createSignal(["Japan", "Kansai"])

  return (
    <DitherCascadeSelect
      value={region()}
      onUpdateModelValue={(next) => setRegion(next)}
      tree={TREE}
      placeholders={["Country", "Region", "City"]}
    />
  )
}

export const meta = defineExample({
  component: DitherCascadeSelect,
  title: "Cascade select",
  studio: { group: "inputs", frame: { w: 360, h: 90 }, controls: { disabled: {} }, model: { prop: "value" } },
})
