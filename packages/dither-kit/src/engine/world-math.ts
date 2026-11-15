// The 3D surface's maths (`world.ts`): vectors, quaternions, column-major
// 4x4 matrices and VRML's Transform composition. Pure numbers; the scene,
// the parsers (`models/`) and both engines share them.

export type Vec3 = [number, number, number]
/** x, y, z, w. */
export type Quat = [number, number, number, number]
/** Column-major 4x4 acting on column vectors (p' = M p). */
export type Mat4 = number[]

export const mat4Identity = (): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Array<number>(16)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]
      out[c * 4 + r] = s
    }
  return out
}

export const mat4Translate = ([x, y, z]: Vec3): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]

export const mat4Scale = ([x, y, z]: Vec3): Mat4 => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]

/** Rotation about an axis (any length) by `angle` radians. */
export const mat4Rotate = (axis: Vec3, angle: number): Mat4 => mat4FromQuat(quatFromAxisAngle(axis, angle))

export function mat4FromQuat([x, y, z, w]: Quat): Mat4 {
  const xx = x * x
  const yy = y * y
  const zz = z * z
  const xy = x * y
  const xz = x * z
  const yz = y * z
  const wx = w * x
  const wy = w * y
  const wz = w * z
  return [
    1 - 2 * (yy + zz),
    2 * (xy + wz),
    2 * (xz - wy),
    0,
    2 * (xy - wz),
    1 - 2 * (xx + zz),
    2 * (yz + wx),
    0,
    2 * (xz + wy),
    2 * (yz - wx),
    1 - 2 * (xx + yy),
    0,
    0,
    0,
    0,
    1,
  ]
}

export const QUAT_IDENTITY: Quat = [0, 0, 0, 1]

export function quatFromAxisAngle([ax, ay, az]: Vec3, angle: number): Quat {
  const len = Math.hypot(ax, ay, az)
  if (!len || !angle) return [0, 0, 0, 1]
  const s = Math.sin(angle / 2) / len
  return [ax * s, ay * s, az * s, Math.cos(angle / 2)]
}

export function quatNormalize(q: Quat): Quat {
  const len = Math.hypot(q[0], q[1], q[2], q[3])
  return len ? [q[0] / len, q[1] / len, q[2] / len, q[3] / len] : [0, 0, 0, 1]
}

const quatConjugate = ([x, y, z, w]: Quat): Quat => [-x, -y, -z, w]

/** Shortest-path spherical interpolation. */
export function quatSlerp(a: Quat, b: Quat, t: number): Quat {
  let bx = b[0]
  let by = b[1]
  let bz = b[2]
  let bw = b[3]
  let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw
  if (cos < 0) {
    cos = -cos
    bx = -bx
    by = -by
    bz = -bz
    bw = -bw
  }
  let ka = 1 - t
  let kb = t
  if (cos < 0.9995) {
    const th = Math.acos(Math.min(1, cos))
    const s = Math.sin(th)
    ka = Math.sin((1 - t) * th) / s
    kb = Math.sin(t * th) / s
  }
  return quatNormalize([a[0] * ka + bx * kb, a[1] * ka + by * kb, a[2] * ka + bz * kb, a[3] * ka + bw * kb])
}

export const transformPoint = (m: Mat4, [x, y, z]: Vec3): Vec3 => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
]

export const transformDirection = (m: Mat4, [x, y, z]: Vec3): Vec3 => [
  m[0] * x + m[4] * y + m[8] * z,
  m[1] * x + m[5] * y + m[9] * z,
  m[2] * x + m[6] * y + m[10] * z,
]

export function normalize([x, y, z]: Vec3): Vec3 {
  const len = Math.hypot(x, y, z)
  return len ? [x / len, y / len, z / len] : [0, 0, 1]
}

/** Determinant of the upper 3x3 — negative means the transform mirrors. */
export const det3 = (m: Mat4) =>
  m[0] * (m[5] * m[10] - m[9] * m[6]) - m[4] * (m[1] * m[10] - m[9] * m[2]) + m[8] * (m[1] * m[6] - m[5] * m[2])

/** VRML's Transform: T · C · R · SR · S · -SR · -C (glTF: center and SR identity). */
export function composeTransform(
  translation: Vec3,
  rotation: Quat,
  scale: Vec3,
  center: Vec3 = [0, 0, 0],
  scaleOrientation: Quat = QUAT_IDENTITY,
): Mat4 {
  let m = mat4Translate([translation[0] + center[0], translation[1] + center[1], translation[2] + center[2]])
  m = mat4Multiply(m, mat4FromQuat(rotation))
  const so = scaleOrientation[3] !== 1
  if (so) m = mat4Multiply(m, mat4FromQuat(scaleOrientation))
  m = mat4Multiply(m, mat4Scale(scale))
  if (so) m = mat4Multiply(m, mat4FromQuat(quatConjugate(scaleOrientation)))
  if (center[0] || center[1] || center[2]) m = mat4Multiply(m, mat4Translate([-center[0], -center[1], -center[2]]))
  return m
}
