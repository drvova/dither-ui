import { createMemo, createUniqueId, type JSX, mergeProps } from "solid-js"
import { cn } from "../tailwind/lib"
import "./ElectricBorder.css"

export type ElectricBorderProps = {
  /** @docs string (hex) */
  color?: string
  speed?: number
  /** @docs number (px) */
  thickness?: number
  class?: string
  /** @docs content */
  children?: JSX.Element
}

export default function ElectricBorder(raw: ElectricBorderProps) {
  const props = mergeProps({ color: "#5227FF", speed: 1, thickness: 2 }, raw)

  const uid = `dither-electric-${createUniqueId()}`
  const dur = createMemo(() => `${2 / Math.max(0.1, props.speed)}s`)

  return (
    <div class={cn("dk-electric-border relative inline-block rounded-[12px] px-4 py-2", props.class)}>
      {/* 0x0 filter host: turbulence displaces the overlay border into an arc */}
      <svg width="0" height="0" class="absolute" aria-hidden="true">
        <defs>
          <filter id={uid} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="3" result="n">
              <animate attributeName="seed" from="0" to="12" dur={dur()} repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="n" scale={props.thickness * 3} />
          </filter>
        </defs>
      </svg>
      <div
        class="pointer-events-none absolute inset-0 rounded-[12px]"
        style={{ border: `${props.thickness}px solid ${props.color}`, filter: `url(#${uid})` }}
        aria-hidden="true"
      />
      <div class="relative">{props.children}</div>
    </div>
  )
}
