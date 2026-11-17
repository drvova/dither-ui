import { DitherWorld } from "@dither-kit"

// a whale of our own, drawn as an SVG that carries its own swim: it rounds
// a loop (animateMotion), turns about at each end and shrinks on the far
// side (a scale), bobs, and beats its tail about the tail's root (a rotate).
// The kit triangulates each shape once into a slab and plays the file's
// animation on its clock
const WHALE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 180">
  <g>
    <animateMotion dur="14s" repeatCount="indefinite" path="M242 92 A92 36 0 0 0 58 92 A92 36 0 0 0 242 92 Z"/>
    <g>
      <animateTransform attributeName="transform" type="scale" dur="14s" repeatCount="indefinite"
        keyTimes="0;0.07;0.25;0.43;0.5;0.57;0.75;0.93;1"
        values="0.06 0.86;-0.84 0.8;-0.72 0.72;-0.84 0.8;-0.06 0.86;0.92 0.94;1 1;0.92 0.94;0.06 0.86"/>
      <g transform="scale(1.3)">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="1.6s" repeatCount="indefinite"/>
          <g transform="translate(-50 -2)">
            <animateTransform attributeName="transform" type="rotate" values="-16;16;-16" dur="1.6s" repeatCount="indefinite" additive="sum"/>
            <path fill="#2b6fc4" d="M2 -3 C-8 -6 -16 -15 -28 -19 C-23 -10 -19 -4 -17 0 C-19 4 -23 10 -28 18 C-16 14 -8 6 2 3 Z"/>
          </g>
          <path fill="#358ff3" d="M52 0 C52 -17 36 -24 10 -24 C-16 -24 -34 -15 -48 -5 L-52 0 C-40 6 -22 13 2 15 C28 17 52 13 52 0 Z"/>
          <path fill="#e4e1d8" d="M50 5 C43 12 26 15 4 15 C-18 13 -33 8 -44 3 C-27 7 -9 9 9 9 C30 9 45 8 50 5 Z"/>
          <path fill="#2b6fc4" d="M16 9 C12 20 5 27 -3 29 C1 22 5 15 7 9 Z"/>
          <circle cx="36" cy="-6" r="2.4" fill="#101214"/>
        </g>
      </g>
    </g>
  </g>
</svg>`

export default function Example() {
  return (
    <div class="mx-auto max-w-md">
      {/* any SVG reads as a model: by URL, inline, or a data URI */}
      <DitherWorld
        source={WHALE}
        format="svg"
        material
        animate
        yaw={0}
        pitch={10}
        zoom={2.1}
        cell={2}
        color="grey"
        label="A whale swimming round"
        class="h-[280px]"
      />
    </div>
  )
}
