import { createSignal } from "solid-js"
import { DitherListBox } from "@dither-kit"

export default function Example() {
  const [city, setCity] = createSignal("Seoul")

  return (
    <DitherListBox
      value={city()}
      onUpdateModelValue={(next) => setCity(next)}
      options={["Kyoto", "Seoul", "Taipei", "Osaka", "Busan"]}
      aria-label="City"
    />
  )
}
