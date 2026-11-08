// A command as the install box sets it: its words, each a run of pieces
// that never break inside (a hyphen is no place to wrap), with a break
// allowed only after a path's slash, so a long path wraps on a phone
// instead of running under the Copy key. Shared byte for byte with the
// Svelte landing (tests/svelte-site-copies.spec.ts).

/** The command's words, each split after every slash it holds. */
export const commandPieces = (cmd: string): string[][] => cmd.split(" ").map((w) => w.split(/(?<=\/)/))
