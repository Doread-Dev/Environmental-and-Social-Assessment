import { useNavigate } from 'react-router-dom'
import { Button, Icon } from '@/components/ui'
import { getHelpRoute } from '@/routes/routes.config'

/**
 * HelpButton - opens the user guide at this page's section (phase 14, D78)
 * The guide has a part or section for every place key (backend tests/userGuide.test.js); when
 * the signed-in user's guide has none for it, the Help page opens at its start. Leaving goes
 * through the unsaved-changes guard like any other navigation.
 *
 * @param {Object} props
 * @param {string|null|undefined} props.place - The page's place key (route handle); none = no button
 */
export function HelpButton({ place }) {
  const navigate = useNavigate()
  if (!place) return null
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Help for this page"
      leftIcon={<Icon name="help" />}
      onClick={() => navigate(getHelpRoute(place))}
    >
      <span className="hidden sm:inline">Help</span>
    </Button>
  )
}

export default HelpButton
