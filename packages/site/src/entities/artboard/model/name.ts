/** A frame's name as a file's: `Sign in` is `sign-in`. Every file the
 * Studio writes of a frame (its code, its PNG, its SVG) is named so. */
export const fileBase = (name: string): string => name.replace(/[^\w-]+/g, "-").toLowerCase() || "artboard"
