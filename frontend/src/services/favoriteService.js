import api from './api'

export const getFavorites = (params = {}) =>
  api.get('/api/favorites', { params }).then((r) => r.data)

export const addFavorite = (productId) =>
  api.post('/api/favorites/add', { product_id: productId }).then((r) => r.data)

export const removeFavorite = (productId) =>
  api.delete(`/api/favorites/${productId}`).then((r) => r.data)
