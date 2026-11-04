/** A camelCase name with a break opportunity (a zero-width space) at each
 * hump, so `chromaticAberration` wraps as `chromatic | Aberration` in a
 * narrow column, never mid-word. For display only: the name itself (an
 * input's name, a prop key) keeps its letters. */
export const breakable = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, "$1​$2")
