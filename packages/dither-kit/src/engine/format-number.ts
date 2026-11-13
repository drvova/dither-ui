// A number with its decimals fixed, in the reader's locale. `toLocaleString`
// with options builds a new formatter every call; a counter rolling every
// frame built one a frame (and a page of them, one each, at mount). One
// formatter per precision, made once. Framework-free.

const FORMATS = new Map<number, Intl.NumberFormat>()

/** `value` with exactly `decimals` fraction digits, grouped as the locale
 * groups it: what `value.toLocaleString(undefined, { minimumFractionDigits:
 * decimals, maximumFractionDigits: decimals })` gives. */
export function formatFixed(value: number, decimals: number): string {
  let format = FORMATS.get(decimals)
  if (!format)
    FORMATS.set(
      decimals,
      (format = new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
    )
  return format.format(value)
}
