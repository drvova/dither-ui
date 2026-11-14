import { createSignal } from "solid-js"
import { DitherCascadeSelect } from "@dither-kit"

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
