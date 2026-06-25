import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restaure la session depuis le localStorage au montage
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken) {
      setToken(storedToken)
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    const { user: loggedUser, token: authToken } = response.data

    setUser(loggedUser)
    setToken(authToken)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(loggedUser))

    return { user: loggedUser, token: authToken }
  }

  const register = async (data) => {
    return api.post('/api/auth/register', data)
  }

  const logout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // On ignore les erreurs : la déconnexion locale doit aboutir quoi qu'il arrive
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider')
  }
  return context
}
