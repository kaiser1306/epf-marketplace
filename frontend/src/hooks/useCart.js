import { createContext, useContext } from 'react'

// Contexte du panier (l'état est fourni par CartProvider)
export const CartContext = createContext(null)

export function useCart() {
  const context = useContext(CartContext)
  if (context === null) {
    throw new Error('useCart doit être utilisé à l’intérieur d’un CartProvider')
  }
  return context
}
