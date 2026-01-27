import { get, post } from '@rails/request.js'

/**
 * Fetch themes (system themes and site-specific themes)
 * @param {number} siteId - Optional site ID to fetch site-specific themes
 * @returns {Promise<Array>} List of themes
 */
export async function fetchThemes(siteId = null) {
  const url = siteId 
    ? `/api/v1/themes?site_id=${siteId}`
    : '/api/v1/themes'
  
  const response = await get(url, {
    responseKind: 'json'
  })
  
  if (response.ok) {
    return await response.json
  } else {
    throw new Error('Failed to fetch themes')
  }
}

/**
 * Fetch a single theme by ID
 * @param {number} themeId - Theme ID
 * @returns {Promise<Object>} Theme data
 */
export async function fetchTheme(themeId) {
  const response = await get(`/api/v1/themes/${themeId}`, {
    responseKind: 'json'
  })
  
  if (response.ok) {
    return await response.json
  } else {
    throw new Error('Failed to fetch theme')
  }
}

/**
 * Initiate theme tarball download
 * @param {number} themeId - Theme ID
 * @returns {Promise<Object>} Response with message and theme_id
 */
export async function downloadThemeTarball(themeId) {
  const response = await post(`/api/v1/themes/${themeId}/download_tarball`, {
    responseKind: 'json'
  })
  
  if (response.ok) {
    return await response.json
  } else {
    const error = await response.json
    throw new Error(error.error || 'Failed to initiate theme download')
  }
}
