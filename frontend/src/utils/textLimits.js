/**
 * Free text is limited to 30,000 characters, like the backend (D74 4): an Excel cell holds at most
 * 32,767, so exports stay complete. A maximum against runaway input, not a minimum (D57 stays).
 * The shared Input and Textarea apply it by default; the Tools 3/4 grid cells cut at it.
 */
export const MAX_TEXT_LENGTH = 30000
