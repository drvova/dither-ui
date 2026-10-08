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
import type { Rgb } from "./palette"
import { wrapMaterial } from "./shader"
import { cameraOf, meshGrain, nodeMatrices, packTarget, type World, type WorldMesh, type WorldStyle, type WorldTarget, type WorldView } from "./world"

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

/** A GPU engine instance (one context, buffers cached per mesh). A shared
 * `GlHandle` (one context per component, used by the material pass too)
 * stays the caller's to dispose. */
export function createWorldGpu(shared?: GlHandle): WorldGpu {
  let handle: GlHandle | null | undefined = shared
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
    }
    // Per-pass state: the material pass on the same context sets its own.
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LESS)
    gl.disable(gl.BLEND)
    gl.frontFace(gl.CCW)
    gl.cullFace(gl.BACK)
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
      if (handle && handle !== shared) handle.dispose()
      handle = null
    },
  }
}

export type MaterialInputs = { time: number; color: Rgb; seed: number }

export type WorldMaterial = {
  /** Run `source` over the target; the RGBA readback (rows bottom-up) for
   * `paintMaterial`, or null when WebGL is missing or the shader failed. */
  shade: (source: string, target: WorldTarget, world: World, view: WorldView, inputs: MaterialInputs) => Uint8Array | null
  problem: () => string
  dispose: () => void
}

/** A GLSL material pass over a finished WorldTarget (see `wrapMaterial`):
 * the target packed into one texture, the palette into another, a
 * fullscreen triangle, a readback. Shares the component's context. */
export function createWorldMaterial(shared?: GlHandle): WorldMaterial {
  let handle: GlHandle | null | undefined = shared
  let program: WebGLProgram | null = null
  let compiled: string | null = null
  let problem = ""
  let quad: WebGLBuffer | null = null
  let targetTex: WebGLTexture | null = null
  let paletteTex: WebGLTexture | null = null
  let packed = new Uint8Array(0)
  let pixels = new Uint8Array(0)
  const palette = new Uint8Array(256 * 4)
  const uniforms: Record<string, WebGLUniformLocation | null> = {}

  const texture = (gl: Gl): WebGLTexture | null => {
    const t = gl.createTexture()
    if (!t) return null
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  const setup = (source: string): Gl | null => {
    if (handle === undefined) {
      handle = createGl()
      if (!handle) problem = "WebGL is not available"
    }
    if (!handle || handle.lost()) return null
    const gl = handle.gl
    if (compiled !== source) {
      if (program) gl.deleteProgram(program)
      program = null
      compiled = source
      const built = wrapMaterial(source, handle.webgl2)
      const p = buildProgram(gl, built.vertex, built.fragment, ["p"])
      if (typeof p === "string") {
        problem = p
        return null
      }
      program = p
      problem = ""
      for (const name of ["dk_target", "dk_palette", "iResolution", "iTime", "iColor", "iSeed"]) uniforms[name] = gl.getUniformLocation(p, name)
      quad = quad ?? gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      targetTex = targetTex ?? texture(gl)
      paletteTex = paletteTex ?? texture(gl)
    }
    return program ? gl : null
  }

  return {
    problem: () => problem,
    shade(source, target, world, view, inputs) {
      const gl = setup(source)
      if (!gl || !handle || !program) return null
      const cols = target.width
      const rows = target.height
      handle.size(cols, rows)
      packed = packTarget(target, world, view, packed)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, targetTex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, packed)
      palette.fill(0)
      world.palette.forEach((c, i) => {
        if (i < 256) palette.set([c[0], c[1], c[2], 255], i * 4)
      })
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, paletteTex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, palette)
      gl.disable(gl.DEPTH_TEST)
      gl.disable(gl.CULL_FACE)
      gl.disable(gl.BLEND)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
      gl.disableVertexAttribArray(1)
      gl.disableVertexAttribArray(2)
      gl.uniform1i(uniforms.dk_target, 0)
      gl.uniform1i(uniforms.dk_palette, 1)
      gl.uniform3f(uniforms.iResolution, cols, rows, 1)
      gl.uniform1f(uniforms.iTime, inputs.time)
      gl.uniform3f(uniforms.iColor, inputs.color[0] / 255, inputs.color[1] / 255, inputs.color[2] / 255)
      gl.uniform1f(uniforms.iSeed, inputs.seed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      pixels = handle.read(pixels)
      return pixels
    },
    dispose() {
      if (handle) {
        if (program) handle.gl.deleteProgram(program)
        if (targetTex) handle.gl.deleteTexture(targetTex)
        if (paletteTex) handle.gl.deleteTexture(paletteTex)
        if (quad) handle.gl.deleteBuffer(quad)
        if (handle !== shared) handle.dispose()
      }
      program = null
      handle = null
    },
  }
}
