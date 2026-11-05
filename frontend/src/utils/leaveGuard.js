/**
 * Leaving the app on purpose (D73)
 *
 * The unsaved-changes guard (contexts/UnsavedChangesContext) asks before the browser leaves a page
 * with changes (`beforeunload`). A few exits are chosen explicitly by the user after being told
 * that what they typed is lost, e.g. "Sign in as someone else" in the session-expired dialog: they
 * call `allowLeaving()` first so the browser does not ask a second time.
 */
let leavingAllowed = false

export function allowLeaving() {
  leavingAllowed = true
}

export function isLeavingAllowed() {
  return leavingAllowed
}

// Tests only: back to the default.
export function resetLeaveGuard() {
  leavingAllowed = false
}
