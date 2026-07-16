const rawBase = import.meta.env.BASE_URL || "/"
const base = rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase

export function appPathname(pathname = location.pathname): string {
  if (!base) return pathname || "/"
  if (pathname === base) return "/"
  if (pathname.startsWith(`${base}/`)) return pathname.slice(base.length) || "/"
  return pathname || "/"
}

export function routePath(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`
  if (!base) return normalized
  return normalized === "/" ? `${base}/` : `${base}${normalized}`
}

export function assetPath(path: string): string {
  return `${rawBase}${path.replace(/^\//, "")}`
}
