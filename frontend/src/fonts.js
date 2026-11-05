/**
 * Text font of the app (D72): IBM Plex Sans + IBM Plex Sans Arabic, self-hosted from the
 * @fontsource packages, so the app needs no internet for its text font. Only the weights the app
 * uses (400 normal, 500 medium, 600 semibold, 700 bold) and the subsets it needs (Latin, Latin
 * extended for transliterated names, Arabic). `--font-sans` in index.css names both families.
 */
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-700.css'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'
import '@fontsource/ibm-plex-sans/latin-ext-700.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-400.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-500.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-600.css'
import '@fontsource/ibm-plex-sans-arabic/arabic-700.css'

// Icons (D37, phase 11): Material Symbols Outlined, self-hosted from the `material-symbols` package
// (exact version; the variable font, so FILL and the weights keep working). Never from Google Fonts.
import 'material-symbols/outlined.css'
