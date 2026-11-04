import { useEffect, useRef } from 'react'

// Open overlays (side panel, PDF viewer), topmost last: Escape closes only the topmost one, and
// the page behind stays locked until the last one closes.
const stack = []

/**
 * Escape-to-close and scroll lock for a full-screen overlay that can sit on top of another one.
 * @param {Function} onClose
 * @param {{enabled?: boolean}} [options]
 */
export function useOverlay(onClose, { enabled = true } = {}) {
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  })

  useEffect(() => {
    if (!enabled) return undefined
    const token = {}
    stack.push(token)
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && stack[stack.length - 1] === token) close.current?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      stack.splice(stack.indexOf(token), 1)
      if (stack.length === 0) document.body.style.overflow = ''
    }
  }, [enabled])
}

export default useOverlay
