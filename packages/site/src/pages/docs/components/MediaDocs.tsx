import { assetPath, routePath } from "@/shared/lib/routes"
import { CAPTURE_PATH } from "@/shared/ui/mascot-capture"
import DemoCard from "../DemoCard"
import { exampleCode } from "../example-code"
import PropsTable, { kitTable, type PropRow } from "../PropsTable"
import thumbnailProps from "virtual:dither-props/DitherThumbnail"
import videoPlayerProps from "virtual:dither-props/DitherVideoPlayer"
import bracketProps from "virtual:dither-props/DitherBracket"
import scheduleProps from "virtual:dither-props/DitherSchedule"
import worldProps from "virtual:dither-props/DitherWorld"
import shaderProps from "virtual:dither-props/DitherShader"
import DocSection from "../DocSection"
import VideoPlayerExample from "./examples/video-player"
import videoPlayerCode from "./examples/video-player.tsx?raw"
import ThumbnailExample from "./examples/thumbnail"
import thumbnailCode from "./examples/thumbnail.tsx?raw"
import BracketExample from "./examples/bracket"
import bracketCode from "./examples/bracket.tsx?raw"
import ScheduleExample from "./examples/schedule"
import scheduleCode from "./examples/schedule.tsx?raw"
import WorldExample from "./examples/world"
import worldCode from "./examples/world.tsx?raw"
import World2Example from "./examples/world-2"
import world2Code from "./examples/world-2.tsx?raw"
import World3Example from "./examples/world-3"
import world3Code from "./examples/world-3.tsx?raw"
import ShaderExample from "./examples/shader"
import shaderCode from "./examples/shader.tsx?raw"

export const API: Record<string, PropRow[]> = {
  thumbnail: kitTable(thumbnailProps),
  video: kitTable(videoPlayerProps, {
    // the player's keys
    add: {
      rows: [{ prop: "keyboard", type: "Space/K play, ←→ seek 5s, ↑↓ volume, M mute, F fullscreen", default: "" }],
    },
  }),
  bracket: kitTable(bracketProps),
  schedule: kitTable(scheduleProps, { join: [["from", "to"]] }),
  world: kitTable(worldProps, {
    join: [
      ["grain", "grainScale"],
      ["animate", "time"],
      ["yaw", "pitch", "zoom"],
      ["paused", "renderMode"],
    ],
  }),
  shader: kitTable(shaderProps, {
    join: [["paused", "renderMode"]],
    // what a shader's source may read
    add: {
      after: "channels",
      rows: [
        {
          prop: "uniforms",
          type: "iResolution, iTime, iTimeDelta, iFrame, iMouse, iDate, iColor, iSeed, iChannel0..3 and iChannelResolution, plus time/resolution/mouse and u_time/u_resolution/u_mouse; dk_bayer4(fragCoord) is the kit's Bayer threshold",
          default: "",
        },
      ],
    },
  }),
}

export default function MediaDocs() {
  return (
    <>
      {/* Thumbnail */}
      <DocSection id="thumbnail">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A picture that is a link. It rests sunk under a Bayer veil and wakes under a pointer: the picture scales up a
          touch inside its frame as the veil dissolves, and the frame keeps its ratio (phi unless you pick one). The
          picture's words name the link.
        </p>
        <DemoCard code={exampleCode(thumbnailCode)}>
          {/* the demo's addresses under the site's base path; the code's, at the root */}
          <ThumbnailExample
            sprites={assetPath("/sprites.webp")}
            poster={assetPath("/trailer/poster.webp")}
            image={routePath("/docs/image")}
            video={routePath("/docs/video-player")}
          />
        </DemoCard>
        <PropsTable rows={API.thumbnail} />
      </DocSection>

      {/* Video player */}
      <DocSection id="video-player">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A native video under dither chrome: play, a dithered scrubber that really seeks, a volume slider, playback
          speed, mute, fullscreen, and player keyboard (Space, arrows, M, F). Without a source it shows an honest empty
          face instead of a broken box.
        </p>
        <DemoCard code={videoPlayerCode}>
          <div class="mx-auto max-w-md">
            <VideoPlayerExample />
          </div>
        </DemoCard>
        <PropsTable rows={API.video} />
      </DocSection>

      {/* Bracket */}
      <DocSection id="bracket">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A knockout bracket: winners carry the accent, losers strike through, connector rails bridge the rounds. This
          one is interactive: pick every winner and the final fills itself.
        </p>
        <DemoCard code={bracketCode}>
          <BracketExample />
        </DemoCard>
        <PropsTable rows={API.bracket} />
      </DocSection>

      {/* Schedule */}
      <DocSection id="schedule">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A day timeline: events sit proportionally on the hour rail, each with its swatch rail, and the red now line
          slides as the day moves. Drag the hour to move time.
        </p>
        <DemoCard code={scheduleCode}>
          <ScheduleExample />
        </DemoCard>
        <PropsTable rows={API.schedule} />
      </DocSection>

      {/* World (3D) */}
      <DocSection id="world">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A 3D model viewer in the house raster: VRML, X3D, glTF / GLB, OBJ with its MTL, STL, PLY, OFF, SVG (each
          filled shape extruded into a slab) and Gaussian splats, by URL or inline, drawn on the CPU or through WebGL
          for big meshes. Files bring their own materials, lights and animations, played on the kit clock; any kit
          surface can skin the model (the aurora below), and any model comes apart along its seams and builds itself
          back. Drag to orbit.
        </p>
        <DemoCard code={worldCode}>
          <WorldExample />
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          A model's own animation and a build share one clock. This rocket is a VRML file: its flame flickers by its own
          TimeSensor, it climbs off the pad, and at the top the file swells a fireball while the page blows its pieces
          apart with scatter.
        </p>
        <DemoCard code={world2Code}>
          <World2Example />
        </DemoCard>
        <p class="mt-6 text-[13px] leading-relaxed text-muted-foreground">
          Gaussian splats print too: a capture is a cloud of soft ellipsoids, each laid on the cells as its footprint,
          near to far until a cell is opaque, and its colour and light go through the same dither. This one is our
          mascot, grown from its cell table into a body of splats with three electrons ringing it. Give it a .splat file
          or the .ply a trained capture writes.
        </p>
        <DemoCard code={exampleCode(world3Code)}>
          {/* the capture the build serves, under the site's base path */}
          <World3Example src={assetPath(`/${CAPTURE_PATH}`)} />
        </DemoCard>
        <PropsTable rows={API.world} />
      </DocSection>

      {/* Shader (GLSL) */}
      <DocSection id="shader">
        <p class="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          A fragment shader in the house raster: Shadertoy-style mainImage or a raw main, by URL or inline, run on the
          GPU at the cell resolution and dithered on the way back, one bit per channel or one tint. iTime is the kit
          clock, so it seeks and renders to video, and any kit surface can feed it as iChannel0..3. Below, an aurora
          through a CRT.
        </p>
        <DemoCard code={shaderCode}>
          <ShaderExample />
        </DemoCard>
        <PropsTable rows={API.shader} />
      </DocSection>
    </>
  )
}
