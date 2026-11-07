// The rise's waiting state (see `rise.ts`). The landing is prerendered, so
// its headlines are in the bytes before the app runs; `RISE_HEAD_SCRIPT`,
// inlined in each route's head by `rstack.config.ts`, holds what rises
// (`[data-rise]`, hidden by styles.css under `RISE_WAIT`) until the app
// rises it, and lets go by itself if the app never comes. Under reduced
// motion it holds nothing. No imports: the config loads this file under Node.

/** The class on `<html>` while what rises waits for the app. */
export const RISE_WAIT = "rise-wait"
/** Set on `<html>` (`data-rise`) once the app has taken the rise over. */
export const RISE_LIVE = "live"
/** How long the wait may hold if the app never comes. */
const WAIT_MS = 3000

export const RISE_HEAD_SCRIPT = `(function(){if(!window.matchMedia||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var h=document.documentElement;h.classList.add("${RISE_WAIT}");setTimeout(function(){if(h.dataset.rise!=="${RISE_LIVE}")h.classList.remove("${RISE_WAIT}")},${WAIT_MS})})()`
