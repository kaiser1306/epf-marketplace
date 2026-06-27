import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import * as cartService from '../services/cartService'
import { useAuth } from '../hooks/useAuth'
import { CartContext } from '../hooks/useCart'

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState('0.00')
  const [itemCount, setItemCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const applyCart = (data) => {
    setItems(data.items ?? [])
    setTotal(data.total ?? '0.00')
    setItemCount(data.item_count ?? 0)
  }

  const resetCart = () => {
    setItems([])
    setTotal('0.00')
    setItemCount(0)
  }

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      resetCart()
      return
    }
    setLoading(true)
    try {
      const data = await cartService.getCart()
      applyCart(data)
    } catch {
      // erreurs réseau gérées globalement par l'intercepteur
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Recharge le panier à la connexion / changement d'utilisateur (persistance serveur)
  useEffect(() => {
    refresh()
  }, [refresh, user?.id])

  const addItem = async (productId, quantity = 1) => {
    try {
      await cartService.addToCart(productId, quantity)
      await refresh()
      toast.success('Article ajouté au panier')
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Impossible d'ajouter l'article")
      throw error
    }
  }

  const updateItem = async (cartItemId, quantity) => {
    try {
      await cartService.updateCartItem(cartItemId, quantity)
      await refresh()
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Mise à jour impossible')
    }
  }

  const removeItem = async (cartItemId) => {
    try {
      await cartService.removeCartItem(cartItemId)
      await refresh()
      toast.success('Article retiré')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Suppression impossible')
    }
  }

  const clear = async () => {
    try {
      await cartService.clearCart()
      resetCart()
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de vider le panier')
    }
  }

  const value = {
    items,
    total,
    itemCount,
    loading,
    refresh,
    addItem,
    updateItem,
    removeItem,
    clear,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
