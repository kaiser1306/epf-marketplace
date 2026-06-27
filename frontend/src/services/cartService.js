import api from './api'

export const getCart = () => api.get('/api/cart').then((r) => r.data)

export const addToCart = (productId, quantity = 1) =>
  api
    .post('/api/cart/add', { product_id: productId, quantity })
    .then((r) => r.data)

export const updateCartItem = (cartItemId, quantity) =>
  api
    .put(`/api/cart/items/${cartItemId}`, { quantity })
    .then((r) => r.data)

export const removeCartItem = (cartItemId) =>
  api.delete(`/api/cart/items/${cartItemId}`).then((r) => r.data)

export const clearCart = () =>
  api.delete('/api/cart/clear').then((r) => r.data)
