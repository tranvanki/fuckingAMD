import { createContext, useContext, useState, useEffect } from 'react'

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
    const [isLoading, setIsLoading] = useState(true)
    const [token, setToken] = useState(null)

    const API_BASE_URL = 'https://localhost:8888'

    // Load user from localStorage on mount
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

    const signup = async (username, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/gateway/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Registration failed')
            }

            const data = await response.json()

            // Registration successful, now login
            await login(username, password)

            return data
        } catch (error) {
            console.error('Signup error:', error)
            throw error
        }
    }

    const login = async (username, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/gateway/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Login failed')
            }

            const data = await response.json()

            // Set token and user
            setToken(data.token)
            setCurrentUser({
                username: username,
                loginTime: new Date().toISOString()
            })

            return data
        } catch (error) {
            console.error('Login error:', error)
            throw error
        }
    }

    const logout = async () => {
        try {
            if (token) {
                await fetch(`${API_BASE_URL}/gateway/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
            }
        } catch (error) {
            console.error('Logout error:', error)
            // Continue with logout even if API call fails
        } finally {
            // Clear local state regardless of API call result
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