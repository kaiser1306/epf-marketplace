import { createContext, useContext } from 'react'

// Contexte d'authentification (l'état est fourni par AuthProvider)
export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider')
  }
  return context
}
