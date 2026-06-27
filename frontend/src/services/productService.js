import api from './api'

// Catalogue public
export const getProducts = (params = {}) =>
  api.get('/api/products', { params }).then((r) => r.data)

export const getTopSelling = (limit = 10) =>
  api.get('/api/products/top-selling', { params: { limit } }).then((r) => r.data)

export const getProduct = (id) =>
  api.get(`/api/products/${id}`).then((r) => r.data)

export const getProductReviews = (id, params = {}) =>
  api.get(`/api/products/${id}/reviews`, { params }).then((r) => r.data)

// Vendeur
export const getMyProducts = (params = {}) =>
  api.get('/api/products/my-products', { params }).then((r) => r.data)

export const isFavorite = (id) =>
  api.get(`/api/products/${id}/is-favorite`).then((r) => r.data.is_favorite)

// Création / mise à jour avec upload d'images -> FormData
export const createProduct = (formData) =>
  api
    .post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

// Laravel ne lit pas le multipart sur PUT : on passe par POST + _method=PUT
export const updateProduct = (id, formData) => {
  formData.append('_method', 'PUT')
  return api
    .post(`/api/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)
}

export const deleteProduct = (id) =>
  api.delete(`/api/products/${id}`).then((r) => r.data)
