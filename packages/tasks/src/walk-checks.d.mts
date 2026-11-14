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

/** Text short of contrast: where it stands and what it says (`text`), and
 * the finding as the report words it. */
export type ContrastFound = { text: string; detail: string }

/** A run of text as the page script `CONTRAST` hands it over. */
export type ContrastSample = {
  rects: [number, number, number, number][]
  ink: number[]
  opacity: number
  large: boolean
  size: number
  text: string
  where: string
}

export function measureContrast(
  png: Png,
  samples: ContrastSample[],
  scale: number,
): { measured: number; found: ContrastFound[] }
export function foundTwice(first: ContrastFound[], again: ContrastFound[]): ContrastFound[]
export const HELD_FACES: string
export function heldPreload(text: string, held: Set<string>): boolean
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
