/**
 * The header's "Export Excel" (ProjectLayout, SempFullWidthLayout) sends a window event that the
 * open tool page answers. A page registers for its event with `useExportHandler` once its data is
 * loaded; the header asks `useExportReady` and keeps the button disabled until then, so a click is
 * never lost (phase 12a).
 *
 * Events: `screening-export`, `assessment-export`, `semp-export` (detail `{ toolType }`),
 * `monitoring-export`.
 */
import { useEffect, useRef, useSyncExternalStore } from 'react'

// Event name → number of mounted handlers (normally one: the open page)
const handlers = new Map()
const subscribers = new Set()

const notify = () => subscribers.forEach((callback) => callback())
const subscribe = (callback) => {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

/**
 * Answers the header's export event while `ready` is true (the page's data is loaded).
 * @param {string} event - the event name
 * @param {(event: CustomEvent) => void} handler - may change on every render
 * @param {boolean} [ready]
 */
export function useExportHandler(event, handler, ready = true) {
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!ready) return undefined
    const listener = (e) => handlerRef.current(e)
    window.addEventListener(event, listener)
    handlers.set(event, (handlers.get(event) ?? 0) + 1)
    notify()
    return () => {
      window.removeEventListener(event, listener)
      const left = (handlers.get(event) ?? 1) - 1
      if (left > 0) handlers.set(event, left)
      else handlers.delete(event)
      notify()
    }
  }, [event, ready])
}

/**
 * True while a page answers `event` (the header enables its Export button).
 * @param {string|null} event
 */
export function useExportReady(event) {
  return useSyncExternalStore(subscribe, () => Boolean(event) && handlers.has(event))
}

/**
 * Sends the export event to the open page.
 * @param {string} event
 * @param {Object} [detail]
 */
export function requestExport(event, detail) {
  window.dispatchEvent(new CustomEvent(event, detail === undefined ? undefined : { detail }))
}
