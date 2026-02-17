/**
 * API Connectivity Test Utility
 *
 * Usage: Import and call in browser console for debugging
 * import { testApiConnection } from '@/utils/apiTest'
 * testApiConnection()
 */
import api, { extractErrorMessage } from '@/services/api'

/**
 * Test API connectivity and authentication
 * @returns {Promise<object>} Test results
 */
export async function testApiConnection() {
  const results = {
    timestamp: new Date().toISOString(),
    baseURL: api.defaults.baseURL,
    tests: [],
  }

  // Test 1: Health check
  try {
    const healthResponse = await api.get('/../../health')
    results.tests.push({
      name: 'Health Check',
      status: 'PASS',
      response: healthResponse.data,
    })
  } catch (error) {
    results.tests.push({
      name: 'Health Check',
      status: 'FAIL',
      error: extractErrorMessage(error),
    })
  }

  // Test 2: Check if token exists
  const token = localStorage.getItem('token')
  results.tests.push({
    name: 'Token Present',
    status: token ? 'PASS' : 'INFO',
    message: token ? 'Token found in localStorage' : 'No token (not logged in)',
  })

  // Test 3: Auth endpoint availability (without credentials)
  try {
    await api.post('/auth/login', {})
  } catch (error) {
    // We expect a 400 or 401, not a network error
    if (error.response) {
      results.tests.push({
        name: 'Auth Endpoint',
        status: 'PASS',
        message: `Auth endpoint reachable (status: ${error.response.status})`,
      })
    } else {
      results.tests.push({
        name: 'Auth Endpoint',
        status: 'FAIL',
        error: extractErrorMessage(error),
      })
    }
  }

  return results
}

export default testApiConnection
