/** The walk's audits (`walk-checks.mjs`): the page scripts it sends, and
 * the rules they are written from, which the specs call on a DOM. */

/** A decoded screenshot: RGBA bytes. */
export type Png = { width: number; height: number; data: Uint8Array }

/** Each finding list of the page read as assistive technology reads it. */
export type A11yAudit = {
  names: string[]
  ids: string[]
  refs: string[]
  headings: string[]
  landmarks: string[]
  images: string[]
  counts: Record<string, number>
}

/** An operable element counted by the keyboard pass. */
export type Stop = { key: number; roving?: string; out?: boolean; where?: string }

/** A dialog's keyboard record. */
export type DialogRecord = {
  opener: string
  opened: boolean
  focusIn?: boolean
  focusAt?: string
  named?: boolean
  modal?: boolean
  escaped?: string[]
  closed?: boolean
  returned?: boolean
  returnedTo?: string
}

export const PHONE: string
export const CONTRAST: string
export const A11Y: string
export const KEYS_START: string
export const KEYS_READ: string
export const KEYS_END: string
export const KEYS_DONE: string
export const FOCUS_BEFORE: string
export const FOCUS_ARRIVED: string
export const FOCUS_OFF: string
export const DIALOG_KEYS: string
export const DIALOG_FOCUS: string
export const DIALOG_OPENED: string
export const DIALOG_TABBED: string
export const DIALOG_CLOSED: string
export const INTERACTIVE: string

export function ratio(a: number[], b: number[]): number
export function measureContrast(png: Png, samples: unknown[], scale: number): { measured: number; found: string[] }
export function concealed(el: Element): boolean
export function roleOf(el: Element): string
export function accessibleName(el: Element): string
export function describe(el: Element): string
export function auditA11y(doc: Document): A11yAudit
export function focusMarks(el: Element): string[]
export function indicated(before: string[], after: string[]): boolean
export function hiddenFocus(el: Element): string
export function unreached<T extends Stop>(stops: T[], reached: number[], widgetsReached?: string[]): T[]
export function dialogFindings(r: DialogRecord): string[]
export function changedPixels(a: Png, b: Png, box: number[], scale: number): number
