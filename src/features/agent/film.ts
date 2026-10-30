// The launch film: a short film of the kit's own frames, built through the
// protocol (every command validated like an agent's) and cut into a reel
// with camera moves, callouts, chapters and a score. The Studio's
// `#new/film` link builds it: the film feature's own demo, and a starting
// point to recut. Frames are 960x540, so the video renders at 1080p with
// `--resolution landscape`.
import { runCommand, type StudioCommand } from "./protocol"

const FRAME = { w: 960, h: 540 }
const GAP = 80

/** Builds the frames and the film, lays the frames out in a row under it and
 * selects it. Returns the film's id, or null if a command failed. */
export function addLaunchFilm(): string | null {
  const add = (cmd: StudioCommand) => {
    const r = runCommand(cmd)
    return r.ok ? (r.data as { id: string; x: number; y: number }) : null
  }
  const frames = [
    add({ type: "chart.add", chart: "area", name: "Film: area", frame: FRAME }),
    add({ type: "component.add", is: "DitherGalaxy", name: "Film: galaxy", props: { arms: 4 }, frame: FRAME }),
    add({
      type: "screen.add",
      name: "Film: screen",
      rows: [
        {
          cells: [
            { is: "DitherHeading", slotText: "Overview" },
            { is: "DitherBadge", slotText: "live" },
          ],
          justify: "between",
        },
        {
          cells: [
            { is: "DitherCountUp", props: { to: 266, duration: 2400 } },
            { is: "DitherCountUp", props: { to: 307, duration: 2400 } },
            { is: "DitherCountUp", props: { to: 47, duration: 2400 } },
          ],
          justify: "between",
        },
        { cells: [{ is: "DitherSwitch" }, { is: "DitherSlider", grow: true }] },
      ],
      gap: 24,
      padding: 28,
      frame: { w: 640, h: 360 },
    }),
    add({ type: "chart.add", chart: "bar", name: "Film: bars", frame: FRAME }),
    add({
      type: "component.add",
      is: "DitherAsciiText",
      name: "Film: end",
      props: { text: "dither-ui", cols: 160 },
      frame: FRAME,
    }),
  ]
  if (frames.some((f) => !f)) return null
  const [area, galaxy, screen, bars, end] = frames.map((f) => f!.id)
  const film = add({
    type: "reel.add",
    name: "Launch film",
    clips: [
      {
        id: area,
        seconds: 4,
        camera: [
          { t: 0, x: 0.5, y: 0.5, zoom: 1, tilt: -3 },
          { t: 1, x: 0.56, y: 0.46, zoom: 1.3, tilt: 2 },
        ],
        callouts: [
          { x: 0.62, y: 0.42, label: "One seeded palette", note: "every hue from one seed", side: "left", from: 1 },
        ],
        chapter: {
          line: "A UI kit drawn pixel by pixel.",
          spec: [
            ["266", "components"],
            ["307", "docs sections"],
            ["1", "dither rule"],
          ],
        },
      },
      {
        id: galaxy,
        seconds: 4,
        transition: { kind: "wipe-right", seconds: 0.6, cell: 6 },
        camera: [
          { t: 0, x: 0.46, y: 0.46, zoom: 1.15, tilt: -3 },
          { t: 1, x: 0.54, y: 0.54, zoom: 1.35, tilt: 3 },
        ],
        chapter: {
          line: "Backgrounds that seek to the frame.",
          spec: [
            ["46", "backgrounds"],
            ["1", "clock for all of them"],
          ],
        },
      },
      {
        id: screen,
        seconds: 4,
        camera: [
          { t: 0, x: 0.42, y: 0.36, zoom: 1.3, tilt: -4 },
          { t: 1, x: 0.58, y: 0.36, zoom: 1.3, tilt: 4 },
        ],
        callouts: [{ x: 0.09, y: 0.3, label: "Real components", note: "not mock-ups", side: "right", from: 0.8 }],
        chapter: {
          line: "Compose whole screens.",
          spec: [
            ["1", "infinite canvas"],
            ["3", "exports: Vue, PNG, MP4"],
          ],
        },
      },
      {
        id: bars,
        seconds: 4,
        transition: { kind: "dissolve", seconds: 0.6, cell: 8 },
        camera: [
          { t: 0, x: 0.5, y: 0.55, zoom: 1.3, tilt: 0 },
          { t: 1, x: 0.5, y: 0.5, zoom: 1, tilt: 0 },
        ],
        callouts: [{ x: 0.5, y: 0.35, label: "Five chart types", note: "on the same raster", side: "right", from: 1 }],
        chapter: {
          line: "Every frame exports as video.",
          spec: [
            ["1", "command to render"],
            ["0", "frames recorded"],
          ],
        },
      },
      {
        id: end,
        seconds: 5,
        transition: { kind: "wipe-up", seconds: 0.8, cell: 8 },
        camera: [
          { t: 0, x: 0.5, y: 0.5, zoom: 1.1, tilt: 0 },
          { t: 1, x: 0.5, y: 0.5, zoom: 1.22, tilt: 0 },
        ],
        chapter: {
          line: "Every pixel is yours.",
          spec: [
            ["", "dither-ui.com"],
            ["MIT", "license"],
          ],
        },
      },
    ],
    score: { seed: 7 },
    frame: FRAME,
  })
  if (!film) return null
  // The film where the frames landed; its frames in a row under it.
  const row = frames.length * FRAME.w + (frames.length - 1) * GAP
  frames.forEach((f, i) =>
    runCommand({
      type: "artboard.update",
      id: f!.id,
      patch: { x: film.x + FRAME.w / 2 - row / 2 + i * (FRAME.w + GAP), y: film.y + FRAME.h + GAP * 2 },
    }),
  )
  runCommand({ type: "artboard.select", id: film.id })
  return film.id
}
