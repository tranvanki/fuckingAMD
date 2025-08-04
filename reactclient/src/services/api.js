// API service for communicating with the Ocelot gateway
import config from '../config'

class ApiService {
  constructor() {
    this.baseURL = 'https://localhost:8888/gateway'
  }

  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('authToken')
  }

  // Create headers with auth token
  getHeaders() {
    const token = this.getAuthToken()
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  // Generic fetch wrapper
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    }

    console.log(`Making request to: ${url}`) // Debug log
        const response = await fetch(url, config)
    
    if (!response.ok) {
      // Try to parse as JSON first, fallback to text
      let errorMessage
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.title || JSON.stringify(errorData)
      } catch {
        // If JSON parsing fails, get text
        errorMessage = await response.text()
      }
      
      console.error(`API Error: ${response.status} - ${errorMessage}`) // Debug log
      throw new Error(errorMessage || `HTTP ${response.status}`)
    }

    // Try to parse as JSON, fallback to text
    try {
      return await response.json()
    } catch {
      return await response.text()
    }
  }

  // URL endpoints
  async getAllUrls() {
    return this.fetch('/urls')
  }

  async createShortenedUrl(originalUrl, customCode = '') {
    if (customCode) {
      return this.fetch('/urls/custom', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl,
          customCode
        }),
      })
    } else {
      return this.fetch('/urls', {
        method: 'POST',
        body: JSON.stringify({
          originalUrl
        }),
      })
    }
  }

  async deleteUrl(id) {
    return this.fetch(`/urls/${id}`, {
      method: 'DELETE',
    })
  }


  async redirectToUrl(shortCode) {
    return this.fetch(`/urls/redirect/${shortCode}`)
  }

  async validateShortCode(shortCode) {
    return this.fetch(`/urls/validate/${shortCode}`)
  }

  // Authentication methods (for your auth service)
  async register(username, password, email) {
    return this.fetch('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    })
  }

  async login(username, password) {
    return this.fetch('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  }

  async logout() {
    return this.fetch('/logout', {
      method: 'POST',
    })
  }
}

const apiService = new ApiService()
export default apiService