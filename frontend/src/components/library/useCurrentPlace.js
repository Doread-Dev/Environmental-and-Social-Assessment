import { useMatches } from 'react-router-dom'

/**
 * The place (D64 a) of the page on screen: the deepest matched route with `handle: { place }`
 * (routes/index.jsx), or null on a page that is not a place.
 * @returns {string|null}
 */
export function useCurrentPlace() {
  const matches = useMatches()
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const place = matches[i].handle?.place
    if (place) return place
  }
  return null
}

export default useCurrentPlace
