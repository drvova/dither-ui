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

/** A URL a document may carry into an href or a src: http(s), mailto, a
 * raster `data:` image or a relative path. Read as the browser reads it
 * (tabs and newlines dropped, leading controls and spaces trimmed), so a
 * scheme that runs code (`javascript:`, `vbscript:`, a `data:` page) never
 * reaches the DOM however it is spelled. */
export function safeUrl(url: string): boolean {
  let s = url.replace(/[\t\n\r]/g, "")
  let lead = 0
  while (lead < s.length && s.charCodeAt(lead) <= 0x20) lead++
  s = s.slice(lead)
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(s)?.[1]?.toLowerCase()
  if (scheme === undefined) return true
  if (scheme === "http" || scheme === "https" || scheme === "mailto") return true
  return scheme === "data" && /^data:image\/(png|gif|jpe?g|webp|avif)[;,]/i.test(s)
}
