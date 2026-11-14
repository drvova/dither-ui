// The keys the kit's keyboard paths listen for, read the same in every
// engine. WebKitGTK names Shift+Tab "Unidentified" (GTK's ISO_Left_Tab) and
// keeps its code "Tab": a trap that read the name alone let Shift+Tab leave
// a modal there. Framework-free.

/** Whether a key event is Tab, with Shift or without. */
export const isTab = (e: Pick<KeyboardEvent, "key" | "code">): boolean => e.key === "Tab" || e.code === "Tab"
