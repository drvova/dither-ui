// The 3D surface's primitives (`world.ts`), in VRML's conventions: y up,
// centred on the origin, rings counter-clockwise seen from outside, each with
// its own texture coordinates. Raw `Geometry`, baked into a world by
// `addMesh` (`world-scene.ts`).

import type { Vec3 } from "./world-math"

/** Raw geometry before baking: flat xyz triples + index rings (polygons,
 * polylines or point runs by `kind`), optional rgb (0-1) per ring, optional
 * texture coordinates — st pairs per point (`uvs`), or per corner when
 * `faceUvs` indexes `uvs` ring by ring (a point on a seam then bakes into
 * one vertex per uv it is used with). (0, 0) is the texture's top-left. */
export type Geometry = { points: number[]; faces: number[][]; colors?: number[]; uvs?: number[]; faceUvs?: number[][] }

/** Texture coordinates: a pair's index for the per-corner rings. */
const pairs = (uvs: number[]) => (s: number, t: number) => uvs.push(s, t) / 2 - 1

export function boxGeometry([sx, sy, sz]: Vec3): Geometry {
  const x = sx / 2
  const y = sy / 2
  const z = sz / 2
  const faces = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [1, 5, 6, 2],
    [4, 0, 3, 7],
    [3, 2, 6, 7],
    [4, 5, 1, 0],
  ]
  // Every face takes the whole texture, upright as seen from outside.
  return {
    points: [-x, -y, z, x, -y, z, x, y, z, -x, y, z, -x, -y, -z, x, -y, -z, x, y, -z, -x, y, -z],
    faces,
    uvs: [0, 1, 1, 1, 1, 0, 0, 0],
    faceUvs: faces.map(() => [0, 1, 2, 3]),
  }
}

export function sphereGeometry(radius: number, segments = 24, rings = 12): Geometry {
  const points: number[] = [0, radius, 0]
  const faces: number[][] = []
  const uvs: number[] = []
  const faceUvs: number[][] = []
  const st = pairs(uvs)
  // Equirectangular: s around the axis (the seam at +z), t from the top pole down.
  const su = (j: number) => j / segments
  const tv = (i: number) => i / rings
  const at = (ring: number, j: number) => 1 + (ring - 1) * segments + (j % segments)
  for (let i = 1; i < rings; i++) {
    const phi = (Math.PI * i) / rings
    const y = radius * Math.cos(phi)
    const rho = radius * Math.sin(phi)
    for (let j = 0; j < segments; j++) {
      const th = (2 * Math.PI * j) / segments
      points.push(rho * Math.sin(th), y, rho * Math.cos(th))
    }
  }
  const bottom = points.length / 3
  points.push(0, -radius, 0)
  for (let j = 0; j < segments; j++) {
    faces.push([at(1, j), at(1, j + 1), 0])
    faceUvs.push([st(su(j), tv(1)), st(su(j + 1), tv(1)), st(su(j) + 0.5 / segments, 0)])
    for (let i = 1; i < rings - 1; i++) {
      faces.push([at(i + 1, j), at(i + 1, j + 1), at(i, j + 1), at(i, j)])
      faceUvs.push([st(su(j), tv(i + 1)), st(su(j + 1), tv(i + 1)), st(su(j + 1), tv(i)), st(su(j), tv(i))])
    }
    faces.push([bottom, at(rings - 1, j + 1), at(rings - 1, j)])
    faceUvs.push([st(su(j) + 0.5 / segments, 1), st(su(j + 1), tv(rings - 1)), st(su(j), tv(rings - 1))])
  }
  return { points, faces, uvs, faceUvs }
}

/** Planar cap coordinates for a ring vertex (s with x, t with z, seen from above). */
const capUv = (st: (s: number, t: number) => number, segments: number) => (j: number) => {
  const th = (2 * Math.PI * j) / segments
  return st(0.5 + 0.5 * Math.sin(th), 0.5 + 0.5 * Math.cos(th))
}

export function cylinderGeometry(
  radius: number,
  height: number,
  side = true,
  top = true,
  bottom = true,
  segments = 24,
): Geometry {
  const points: number[] = []
  const faces: number[][] = []
  const uvs: number[] = []
  const faceUvs: number[][] = []
  const st = pairs(uvs)
  const cap = capUv(st, segments)
  const h = height / 2
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    points.push(radius * Math.sin(th), h, radius * Math.cos(th), radius * Math.sin(th), -h, radius * Math.cos(th))
  }
  const topAt = (j: number) => (j % segments) * 2
  const botAt = (j: number) => (j % segments) * 2 + 1
  if (side)
    for (let j = 0; j < segments; j++) {
      faces.push([botAt(j), botAt(j + 1), topAt(j + 1), topAt(j)])
      faceUvs.push([st(j / segments, 1), st((j + 1) / segments, 1), st((j + 1) / segments, 0), st(j / segments, 0)])
    }
  if (top) {
    faces.push(Array.from({ length: segments }, (_, j) => topAt(j)))
    faceUvs.push(Array.from({ length: segments }, (_, j) => cap(j)))
  }
  if (bottom) {
    faces.push(Array.from({ length: segments }, (_, j) => botAt(segments - 1 - j)))
    faceUvs.push(Array.from({ length: segments }, (_, j) => cap(segments - 1 - j)))
  }
  return { points, faces, uvs, faceUvs }
}

export function coneGeometry(
  bottomRadius: number,
  height: number,
  side = true,
  bottom = true,
  segments = 24,
): Geometry {
  const points: number[] = [0, height / 2, 0]
  const faces: number[][] = []
  const uvs: number[] = []
  const faceUvs: number[][] = []
  const st = pairs(uvs)
  const cap = capUv(st, segments)
  for (let j = 0; j < segments; j++) {
    const th = (2 * Math.PI * j) / segments
    points.push(bottomRadius * Math.sin(th), -height / 2, bottomRadius * Math.cos(th))
  }
  const at = (j: number) => 1 + (j % segments)
  if (side)
    for (let j = 0; j < segments; j++) {
      faces.push([at(j), at(j + 1), 0])
      faceUvs.push([st(j / segments, 1), st((j + 1) / segments, 1), st((j + 0.5) / segments, 0)])
    }
  if (bottom) {
    faces.push(Array.from({ length: segments }, (_, j) => at(segments - 1 - j)))
    faceUvs.push(Array.from({ length: segments }, (_, j) => cap(segments - 1 - j)))
  }
  return { points, faces, uvs, faceUvs }
}

/** VRML ElevationGrid: heights row by row along z, `xDimension` per row. */
export function elevationGeometry(
  xDimension: number,
  zDimension: number,
  xSpacing: number,
  zSpacing: number,
  heights: number[],
): Geometry {
  // A grid is at most 1024 posts a side, whatever the file claims.
  xDimension = Math.max(0, Math.min(1024, Math.floor(xDimension) || 0))
  zDimension = Math.max(0, Math.min(1024, Math.floor(zDimension) || 0))
  const points: number[] = []
  const faces: number[][] = []
  const uvs: number[] = []
  for (let j = 0; j < zDimension; j++)
    for (let i = 0; i < xDimension; i++) {
      points.push(i * xSpacing, heights[j * xDimension + i] ?? 0, j * zSpacing)
      uvs.push(xDimension > 1 ? i / (xDimension - 1) : 0, zDimension > 1 ? j / (zDimension - 1) : 0)
    }
  const at = (i: number, j: number) => j * xDimension + i
  for (let j = 0; j + 1 < zDimension; j++)
    for (let i = 0; i + 1 < xDimension; i++) faces.push([at(i, j + 1), at(i + 1, j + 1), at(i + 1, j), at(i, j)])
  return { points, faces, uvs }
}
