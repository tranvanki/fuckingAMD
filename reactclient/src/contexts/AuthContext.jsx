import { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/api'
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('currentUser')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setCurrentUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  // Save token and user to localStorage when they change
  useEffect(() => {
    if (token && currentUser) {
      localStorage.setItem('authToken', token)
      localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      localStorage.removeItem('authToken')
      localStorage.removeItem('currentUser')
    }
  }, [token, currentUser])

  const signup = async (username, password, email) => {
    try {
      const response = await fetch('https://localhost:8888/gateway/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          email
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      const data = await response.json()
      
      // After successful registration, automatically log in
      return await login(username, password)
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const login = async (username, password) => {
    try {
      console.log('Attempting login:', { username }) // Debug log
      const data = await apiService.login(username, password)
      
      // Check if response has token (successful login)
      if (data && data.token) {
        setToken(data.token)
        setCurrentUser({ 
          username,
          createdAt: new Date().toISOString()
        })
        return data
      } else {
        // Handle case where login returns success message but no token
        throw new Error('Login successful but no token received')
      }
    } catch (error) {
          console.error('Login error:', error) // Debug log
      // Clean up the error message
      let errorMessage = error.message
      if (errorMessage.includes('Invalid login')) {
        errorMessage = 'Invalid username or password'
      }
      throw new Error(errorMessage || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      if (token) {
        await fetch('https://localhost:8888/gateway/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setCurrentUser(null)
    }
  }

  const value = {
    currentUser,
    token,
    signup,
    login,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}