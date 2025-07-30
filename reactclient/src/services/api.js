// API service for communicating with the backend
const API_BASE_URL = '/api'

class ApiService {
  // Helper method for making HTTP requests
  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Get all URLs
  async getAllUrls() {
    return this.makeRequest('/URLs')

  }

  // Create a shortened URL
  async createShortenedUrl(originalUrl, customCode = '') {
    return this.makeRequest('/URLs', {
      method: 'POST',
      body: JSON.stringify({
        originalUrl: originalUrl,
        shortenedUrl: customCode, // Custom code or empty for auto-generation
        metadata: ''
      }),
    })
  }

  // Validate a short code
  async validateShortCode(shortCode) {
    try {
      return await this.makeRequest(`/URLs/validate/${shortCode}`)
    } catch (error) {
      if (error.message.includes('404')) {
        return null // Short code not found
      }
      throw error
    }
  }

  // Delete a URL by ID
  async deleteUrl(id) {
    return this.makeRequest(`/URLs/${id}`, {
      method: 'DELETE',
    })
  }

  // Redirect to original URL (this would typically be handled by the backend directly)
  getRedirectUrl(shortCode) {
    return `${API_BASE_URL}/URLs/redirect/${shortCode}`
  }
}

export default new ApiService()