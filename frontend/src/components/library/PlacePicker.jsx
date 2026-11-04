/**
 * PlacePicker
 * Where a library document shows up (D64 a): checkboxes grouped by place group, from GET /lookups.
 * v3 places are marked and can be chosen, so their guidance is ready when they open. No choice =
 * general (Library page only).
 */
import { Badge, Checkbox } from '@/components/ui'
import { useLookups } from '@/hooks'

export const GENERAL_LABEL = 'General — Library only'

/**
 * @param {Object} props
 * @param {string[]} props.value - Chosen place keys
 * @param {(keys: string[]) => void} props.onChange
 * @param {boolean} [props.disabled]
 */
export function PlacePicker({ value, onChange, disabled = false }) {
  const { placesByGroup } = useLookups()

  const toggle = (key) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])

  return (
    <fieldset className="flex flex-col gap-4" disabled={disabled}>
      <legend className="text-sm font-medium text-text-main dark:text-white mb-1">Show in</legend>
      <p className="text-xs text-text-secondary dark:text-gray-400">
        The pages whose Guidance button lists this document.{' '}
        {value.length === 0 ? (
          <Badge size="sm" variant="default">
            {GENERAL_LABEL}
          </Badge>
        ) : (
          `${value.length} chosen.`
        )}
      </p>
      {placesByGroup.map((group) => (
        <div key={group.key} role="group" aria-label={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-gray-400 mb-2">
            {group.label}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.places.map((place) => (
              <Checkbox
                key={place.key}
                size="sm"
                checked={value.includes(place.key)}
                onChange={() => toggle(place.key)}
                aria-label={place.locked ? `${place.label} (v3)` : place.label}
                label={
                  <span className="inline-flex items-center gap-2">
                    {place.label}
                    {place.locked && (
                      <Badge size="sm" variant="info" title="Opens in v3">
                        v3
                      </Badge>
                    )}
                  </span>
                }
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  )
}

/**
 * The places of a document as small badges; none = general.
 * @param {{keys: string[]}} props
 */
export function PlaceBadges({ keys }) {
  const { places } = useLookups()
  if (keys.length === 0) {
    return (
      <Badge size="sm" variant="default">
        {GENERAL_LABEL}
      </Badge>
    )
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {keys.map((key) => {
        const place = places.find((p) => p.key === key)
        return (
          <Badge key={key} size="sm" variant="primary">
            {place?.label ?? key}
            {place?.locked && ' · v3'}
          </Badge>
        )
      })}
    </span>
  )
}

export default PlacePicker
