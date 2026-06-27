import api from './api'

// Statistiques globales
export const getAdminStats = () =>
  api.get('/api/admin/stats').then((r) => r.data)

// Utilisateurs
export const getAdminUsers = (params = {}) =>
  api.get('/api/admin/users', { params }).then((r) => r.data)

export const suspendUser = (userId) =>
  api.post(`/api/admin/users/${userId}/suspend`).then((r) => r.data)

export const activateUser = (userId) =>
  api.post(`/api/admin/users/${userId}/activate`).then((r) => r.data)

// Modération produits
export const setProductStatus = (productId, status) =>
  api.patch(`/api/admin/products/${productId}/status`, { status }).then((r) => r.data)

export const forceDeleteProduct = (productId) =>
  api.delete(`/api/admin/products/${productId}/force`).then((r) => r.data)

// Coupons (CRUD)
export const getCoupons = (params = {}) =>
  api.get('/api/admin/coupons', { params }).then((r) => r.data)

export const createCoupon = (data) =>
  api.post('/api/admin/coupons', data).then((r) => r.data)

export const updateCoupon = (id, data) =>
  api.put(`/api/admin/coupons/${id}`, data).then((r) => r.data)

export const deleteCoupon = (id) =>
  api.delete(`/api/admin/coupons/${id}`).then((r) => r.data)
