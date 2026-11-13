import { createSignal, type JSX } from "solid-js"
import { cn } from "../tailwind/lib"
import { DRAWER_CHANNEL } from "./DitherDrawer"

export type DitherDrawerIndentProps = { class?: string; children?: JSX.Element }

/** Wrap your app's main UI: it scales back while any root drawer inside is
 * open — the same channel nested drawers use, provided at app level. */
export default function DitherDrawerIndent(props: DitherDrawerIndentProps) {
  const [openCount, setOpenCount] = createSignal(0)
  return (
    <div
      class={cn(
        "origin-top transition-[transform,filter,border-radius] duration-200 motion-reduce:transition-none",
        openCount() > 0 ? "scale-[0.98] rounded-xl brightness-75" : "",
        props.class,
      )}
    >
      <DRAWER_CHANNEL.Provider value={{ notify: (d) => setOpenCount((n) => n + d) }}>
        {props.children}
      </DRAWER_CHANNEL.Provider>
    </div>
  )
}
