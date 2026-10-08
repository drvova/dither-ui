// The world's GPU engine: the same stage-one contract as `rasterizeWorld`
// (world.ts) — flat Lambert under the camera's lights, back faces culled on
// solid meshes, the grain in the shade — rasterized by WebGL at the cell
// resolution and read back into a WorldTarget: R the shade, G+B a 16-bit
// depth from the eye, A the palette index + 1. Stage two (`paintTarget`)
// never knows which engine filled the target, so the dither, outlines, line
// sets and point sets are identical. Big meshes rasterize here in the time
// the CPU engine needs for a small one; the CPU engine stays the byte-exact
// default. Node animation poses on the GPU through a per-mesh matrix.

import { buildProgram, createGl, type Gl, type GlHandle } from "./gl"
import { cameraOf, meshGrain, nodeMatrices, type World, type WorldMesh, type WorldStyle, type WorldTarget, type WorldView } from "./world"

const VERTEX = (es3: boolean) => `${es3 ? "#version 300 es\n#define IN in\n#define OUT out\n" : "#define IN attribute\n#define OUT varying\n"}
IN vec3 p;
IN float g;
IN float c;
uniform mat4 uModel;
uniform vec3 uCenter;
uniform vec4 uRot;   // cos yaw, sin yaw, cos pitch, sin pitch
uniform vec4 uCam;   // dist, scale, cols/2, rows/2
uniform vec2 uDepth; // near, span
OUT vec3 vPos;
OUT float vGrain;
OUT float vIndex;
void main() {
  vec3 w = (uModel * vec4(p, 1.0)).xyz - uCenter;
  float x1 = w.x * uRot.x + w.z * uRot.y;
  float z1 = -w.x * uRot.y + w.z * uRot.x;
  float y2 = w.y * uRot.z - z1 * uRot.w;
  float z2 = w.y * uRot.w + z1 * uRot.z - uCam.x;
  vPos = vec3(x1, y2, z2);
  vGrain = g;
  vIndex = c;
  float depth = max(-z2, 1e-6);
  float zn = (depth - uDepth.x) / uDepth.y * 2.0 - 1.0;
  gl_Position = vec4(x1 * uCam.y / uCam.z, y2 * uCam.y / uCam.w, zn * depth, depth);
}
`

const FRAGMENT = (es3: boolean) => `${es3 ? "#version 300 es\nprecision highp float;\n#define IN in\nout vec4 fragColor;\n" : "#extension GL_OES_standard_derivatives : enable\nprecision highp float;\n#define IN varying\n#define fragColor gl_FragColor\n"}
IN vec3 vPos;
IN float vGrain;
IN float vIndex;
uniform vec4 uLights[8];
uniform int uLightCount;
uniform vec2 uDepth;
uniform float uGrain;
void main() {
  vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
  float lit = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= uLightCount) break;
    float d = dot(n, uLights[i].xyz);
    if (d > 0.0) lit += d * uLights[i].w;
  }
  float shade = min(1.0, 0.15 + 0.85 * lit);
  shade *= 1.0 - uGrain * (1.0 - vGrain);
  float depth = (-vPos.z - uDepth.x) / uDepth.y;
  float code = clamp(depth, 0.0, 1.0) * 65535.0;
  float hi = floor(code / 256.0);
  float lo = code - hi * 256.0;
  fragColor = vec4(shade, hi / 255.0, lo / 255.0, vIndex);
}
`

type Buffers = { pos: WebGLBuffer; idx: WebGLBuffer | null; color: WebGLBuffer | null; grain: WebGLBuffer | null; grainKey: string; count: number; expanded: boolean }

export type WorldGpu = {
  /** Fill `target` for one frame; false when WebGL (or an extension) is missing. */
  rasterize: (world: World, view: WorldView, target: WorldTarget, style: WorldStyle) => boolean
  /** The reason the engine declined, for an honest note. */
  problem: () => string
  dispose: () => void
}

/** A GPU engine instance (one context, buffers cached per mesh). */
export function createWorldGpu(): WorldGpu {
  let handle: GlHandle | null | undefined
  let program: WebGLProgram | null = null
  let problem = ""
  let pixels = new Uint8Array(0)
  const buffers = new WeakMap<WorldMesh, Buffers>()
  const uniforms: Record<string, WebGLUniformLocation | null> = {}

  const setup = (): Gl | null => {
    if (handle === undefined) {
      handle = createGl()
      if (!handle) problem = "WebGL is not available"
    }
    if (!handle || handle.lost()) return null
    const gl = handle.gl
    if (!program) {
      if (!handle.webgl2 && !(gl.getExtension("OES_standard_derivatives") && gl.getExtension("OES_element_index_uint"))) {
        problem = "the GPU engine needs WebGL2"
        return null
      }
      const built = buildProgram(gl, VERTEX(handle.webgl2), FRAGMENT(handle.webgl2), ["p", "g", "c"])
      if (typeof built === "string") {
        problem = built
        return null
      }
      program = built
      for (const name of ["uModel", "uCenter", "uRot", "uCam", "uDepth", "uLights", "uLightCount", "uGrain"]) uniforms[name] = gl.getUniformLocation(program, name)
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LESS)
      gl.disable(gl.BLEND)
      gl.frontFace(gl.CCW)
      gl.cullFace(gl.BACK)
    }
    return gl
  }

  /** Per-mesh GPU buffers: indexed, or expanded per triangle when the mesh
   * colours its faces (the colour index rides as a vertex attribute). */
  const buffersFor = (gl: Gl, mesh: WorldMesh, world: World, style: WorldStyle): Buffers | null => {
    let b = buffers.get(mesh)
    if (!b) {
      const pos = gl.createBuffer()
      if (!pos) return null
      gl.bindBuffer(gl.ARRAY_BUFFER, pos)
      const expanded = !!mesh.triColors
      let idx: WebGLBuffer | null = null
      let color: WebGLBuffer | null = null
      if (expanded) {
        const n = mesh.indices.length
        const xyz = new Float32Array(n * 3)
        const col = new Float32Array(n)
        for (let i = 0; i < n; i++) {
          const v = mesh.indices[i] * 3
          xyz[i * 3] = mesh.positions[v]
          xyz[i * 3 + 1] = mesh.positions[v + 1]
          xyz[i * 3 + 2] = mesh.positions[v + 2]
          col[i] = ((mesh.triColors as Uint8Array)[Math.floor(i / 3)] + 1) / 255
        }
        gl.bufferData(gl.ARRAY_BUFFER, xyz, gl.STATIC_DRAW)
        color = gl.createBuffer()
        if (color) {
          gl.bindBuffer(gl.ARRAY_BUFFER, color)
          gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW)
        }
      } else {
        gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW)
        idx = gl.createBuffer()
        if (!idx) return null
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
      }
      b = { pos, idx, color, grain: null, grainKey: "", count: mesh.indices.length, expanded }
      buffers.set(mesh, b)
    }
    const amount = style.grain ?? 0
    if (amount > 0) {
      const key = `${style.seed ?? 0}:${style.grainScale ?? 4}`
      if (!b.grain || b.grainKey !== key) {
        const g = meshGrain(mesh, world, style.seed ?? 0, style.grainScale ?? 4)
        let data: Float32Array = g
        if (b.expanded) {
          data = new Float32Array(mesh.indices.length)
          for (let i = 0; i < mesh.indices.length; i++) data[i] = g[mesh.indices[i]]
        }
        b.grain = b.grain ?? gl.createBuffer()
        if (b.grain) {
          gl.bindBuffer(gl.ARRAY_BUFFER, b.grain)
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
          b.grainKey = key
        }
      }
    }
    return b
  }

  return {
    problem: () => problem,
    rasterize(world, view, target, style) {
      const gl = setup()
      if (!gl || !handle || !program) return false
      const cols = target.width
      const rows = target.height
      handle.size(cols, rows)
      gl.clearColor(0, 0, 0, 0)
      gl.clearDepth(1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      const c = cameraOf(world, view, Math.max(1, cols), Math.max(1, rows))
      if (world.meshes.length && cols > 0 && rows > 0) {
        const mats = world.nodes.length ? nodeMatrices(world, view.time ?? 0) : null
        const amount = Math.max(0, Math.min(1, style.grain ?? 0))
        gl.useProgram(program)
        gl.uniform3f(uniforms.uCenter, world.center[0], world.center[1], world.center[2])
        gl.uniform4f(uniforms.uRot, c.cy, c.sy, c.cp, c.sp)
        gl.uniform4f(uniforms.uCam, c.dist, c.scale, cols / 2, rows / 2)
        gl.uniform2f(uniforms.uDepth, c.near, c.span)
        const lights = new Float32Array(32)
        const count = Math.min(8, c.lights.length / 4)
        lights.set(c.lights.slice(0, count * 4))
        gl.uniform4fv(uniforms.uLights, lights)
        gl.uniform1i(uniforms.uLightCount, count)
        gl.uniform1f(uniforms.uGrain, amount)
        const identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
        for (const mesh of world.meshes) {
          if (mesh.kind !== "faces") continue
          const b = buffersFor(gl, mesh, world, style)
          if (!b) continue
          gl.bindBuffer(gl.ARRAY_BUFFER, b.pos)
          gl.enableVertexAttribArray(0)
          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0)
          if (amount > 0 && b.grain) {
            gl.bindBuffer(gl.ARRAY_BUFFER, b.grain)
            gl.enableVertexAttribArray(1)
            gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 0, 0)
          } else {
            gl.disableVertexAttribArray(1)
            gl.vertexAttrib1f(1, 1)
          }
          if (b.expanded && b.color) {
            gl.bindBuffer(gl.ARRAY_BUFFER, b.color)
            gl.enableVertexAttribArray(2)
            gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 0, 0)
          } else {
            gl.disableVertexAttribArray(2)
            gl.vertexAttrib1f(2, (mesh.color + 1) / 255)
          }
          const m = mesh.node >= 0 && mats ? mats[mesh.node] : null
          gl.uniformMatrix4fv(uniforms.uModel, false, m ? new Float32Array(m) : identity)
          if (mesh.solid) gl.enable(gl.CULL_FACE)
          else gl.disable(gl.CULL_FACE)
          if (b.expanded) gl.drawArrays(gl.TRIANGLES, 0, b.count)
          else if (b.idx) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.idx)
            gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_INT, 0)
          }
        }
      }
      pixels = handle.read(pixels)
      // Unpack (rows bottom-up) into the target.
      const { shade, depth, index } = target
      for (let y = 0; y < rows; y++) {
        const src = (rows - 1 - y) * cols
        for (let x = 0; x < cols; x++) {
          const s = (src + x) * 4
          const i = y * cols + x
          const a = pixels[s + 3]
          if (!a) {
            index[i] = 0
            depth[i] = Infinity
            shade[i] = 0
            continue
          }
          index[i] = a
          shade[i] = pixels[s] / 255
          depth[i] = c.near + ((pixels[s + 1] * 256 + pixels[s + 2]) / 65535) * c.span
        }
      }
      return true
    },
    dispose() {
      if (handle && program) handle.gl.deleteProgram(program)
      program = null
      handle?.dispose()
      handle = null
    },
  }
}
