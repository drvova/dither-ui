// The player's page as a composition writes it and the player reads it: the
// element it mounts in (which carries the frame's id and theme) and the
// script that carries the document.

/** The player's stage: `data-artboard` and `data-theme` on it. */
export const STAGE_ID = "dither-stage"
/** The `<script type="application/json">` the document rides in. */
export const DOCUMENT_SCRIPT_ID = "dither-document"
