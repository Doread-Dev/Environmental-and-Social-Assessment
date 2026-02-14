/**
 * Ranking help text per category and question number.
 * Used by RankingSelect (UI) and Excel export to show e.g. "High (frequently visible)".
 */

export const RANKING_HELP = {
  A: {
    1: {
      negligible: 'none',
      low: 'rarely visible',
      medium: 'occasionally visible',
      high: 'frequently visible',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no impact',
      low: 'minor signs',
      medium: 'moderate signs',
      high: 'severe damage',
      not_applicable: 'Not Applicable',
    },
  },
  B: {
    1: {
      negligible: 'clear water',
      low: 'minor discoloration',
      medium: 'some visible pollution',
      high: 'heavy pollution',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no change',
      low: 'minor signs',
      medium: 'moderate damage',
      high: 'severe damage',
      not_applicable: 'Not Applicable',
    },
  },
  C: {
    1: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no noticeable noise',
      low: 'barely noticeable',
      medium: 'occasionally disruptive',
      high: 'frequently disruptive',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no change in noise levels',
      low: 'slight increase',
      medium: 'noticeable increase',
      high: 'significant increase',
      not_applicable: 'Not Applicable',
    },
  },
  D: {
    1: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no visible waste',
      low: 'small amounts of waste, well managed',
      medium: 'moderate waste, some mismanagement',
      high: 'large amounts of waste, poor management',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'all waste is recycled or reused',
      low: 'most waste is recycled or reused',
      medium: 'some waste is recycled or reused',
      high: 'little or no waste is recycled or reused',
      not_applicable: 'Not Applicable',
    },
  },
  E: {
    1: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no visible effects',
      low: 'minor changes in a few areas',
      medium: 'moderate changes affecting local ecosystems',
      high: 'severe damage with clear environmental degradation',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no reports of health issues',
      low: 'few reports with unclear links to radiation',
      medium: 'occasional reports with possible links to radiation',
      high: 'frequent reports strongly linked to radiation concerns',
      not_applicable: 'Not Applicable',
    },
  },
  F: {
    1: {
      negligible: 'no complaints',
      low: 'few complaints',
      medium: 'occasional complaints',
      high: 'frequent complaints',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no visible contamination or unsafe handling',
      low: 'minor signs of improper handling but no major risks',
      medium: 'moderate contamination or handling issues',
      high: 'severe contamination or widespread mishandling',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no reports of health issues',
      low: 'few reports with unclear links to toxic materials',
      medium: 'occasional reports with possible links to toxic exposure',
      high: 'frequent reports strongly linked to toxic exposure concerns',
      not_applicable: 'Not Applicable',
    },
  },
  J: {
    1: {
      negligible: 'no visible changes in vegetation or tree cover',
      low: 'minor reduction in vegetation, but ecosystem remains stable',
      medium: 'moderate reduction in tree cover or plant health',
      high: 'severe loss of vegetation or widespread deforestation',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no reports of wildlife disturbance or habitat loss',
      low: 'few reports of minor disturbances',
      medium: 'occasional reports of habitat loss or altered wildlife behavior',
      high: 'frequent reports of major wildlife displacement or habitat destruction',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no invasive species observed',
      low: 'few isolated cases of invasive species with no major impact',
      medium: 'moderate spread of invasive species affecting local plants or wildlife',
      high: 'widespread invasion significantly harming native ecosystems',
      not_applicable: 'Not Applicable',
    },
  },
  H: {
    1: {
      negligible: 'no visible land use or aesthetic changes',
      low: 'minor changes with no significant impact',
      medium: 'moderate changes affecting some land uses or views',
      high: 'major land use changes or significant aesthetic disruption',
      not_applicable: 'Not Applicable',
    },
    2: {
      negligible: 'no concerns reported',
      low: 'few concerns with minimal impact',
      medium: 'occasional concerns about social or economic effects',
      high: 'frequent concerns indicating significant social or economic disruption',
      not_applicable: 'Not Applicable',
    },
    3: {
      negligible: 'no noticeable impact on infrastructure or public services',
      low: 'minor additional strain but no major issues',
      medium: 'moderate pressure on public services or infrastructure',
      high: 'significant strain on infrastructure, causing service disruptions',
      not_applicable: 'Not Applicable',
    },
  },
}

/**
 * Returns the display label for a ranking level as shown on the site, e.g. "High (frequently visible)".
 * @param {string} rankingKey - negligible | low | medium | high | not_applicable
 * @param {string} categoryCode - Category code (A, B, C, D, E, F, J, H)
 * @param {number} questionNumber - 1-based question index within the category
 * @param {Object} impactLevels - impactLevels from @/data/impactCategories (for label)
 * @returns {string} e.g. "High (frequently visible)" or "High" if no help text
 */
export function getRankingDisplayLabel(rankingKey, categoryCode, questionNumber, impactLevels) {
  if (!rankingKey) return ''
  const level = impactLevels[rankingKey]
  const label = level?.label || rankingKey
  const helpText = RANKING_HELP[categoryCode]?.[questionNumber]?.[rankingKey]
  return helpText ? `${label} (${helpText})` : label
}
