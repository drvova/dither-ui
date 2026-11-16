import { createSignal } from "solid-js"
import { DitherWorld } from "@dither-kit"

export default function Example(props: { src?: string }) {
  const [own, setOwn] = createSignal(true)

  return (
    <div class="mx-auto max-w-md">
      {/* a Gaussian capture: a .splat file, or the .ply a trained capture writes.
           Each Gaussian lands as its footprint on the cells, near to far until a
           cell is opaque; its colour and its light go through the same dither.
           A capture's y runs down, so up defaults to -y; this one was made y up. */}
      <DitherWorld
        src={props.src ?? "/models/mascot.splat"}
        up="y"
        material={own()}
        autoRotate={20}
        fov={30}
        zoom={1.35}
        cell={2}
        color="grey"
        label="The mascot as a Gaussian capture"
        class="h-[280px]"
      />
      <div class="mt-3 flex justify-center text-[11px] text-muted-foreground">
        <label class="flex min-h-6 items-center gap-2">
          <input
            checked={own()}
            onChange={(e) => setOwn(e.currentTarget.checked)}
            type="checkbox"
            class="accent-current"
          />{" "}
          its own colours
        </label>
      </div>
    </div>
  )
}
