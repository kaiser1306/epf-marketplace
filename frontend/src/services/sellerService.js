import api from './api'

// Profil public d'un vendeur
export const getSeller = (userId) =>
  api.get(`/api/sellers/${userId}`).then((r) => r.data)

export const getSellerProducts = (userId, params = {}) =>
  api.get(`/api/sellers/${userId}/products`, { params }).then((r) => r.data)

export const getSellerReviews = (userId, params = {}) =>
  api.get(`/api/sellers/${userId}/reviews`, { params }).then((r) => r.data)

// Espace vendeur connecté
export const getSellerDashboard = () =>
  api.get('/api/seller/dashboard').then((r) => r.data)

export const getSellerStatistics = (period = 'month') =>
  api.get('/api/seller/statistics', { params: { period } }).then((r) => r.data)
