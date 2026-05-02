import { createContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  // Set axios default header when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      localStorage.setItem('token', token)
    } else {
      delete axios.defaults.headers.common['Authorization']
      localStorage.removeItem('token')
    }
  }, [token])

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const { data } = await axios.get('/api/auth/me')
          setUser(data.user)
        } catch (err) {
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    checkAuth()
  }, [token])

  const register = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/register', { email, password })
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed'
      throw new Error(message)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post('/api/auth/login', { email, password })
      setToken(data.token)
      setUser(data.user)
      return data.user
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed'
      throw new Error(message)
    }
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
    localStorage.removeItem('token')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
