import api from './api'

export const createOrder = (data) =>
  api.post('/api/orders', data).then((r) => r.data)

export const getMyOrders = (params = {}) =>
  api.get('/api/orders/my-orders', { params }).then((r) => r.data)

export const getOrder = (id) =>
  api.get(`/api/orders/${id}`).then((r) => r.data)

export const cancelOrder = (id) =>
  api.post(`/api/orders/${id}/cancel`).then((r) => r.data)

export const updateOrderStatus = (id, status) =>
  api.put(`/api/orders/${id}/status`, { status }).then((r) => r.data)

// Vendeur : commandes reçues
export const getSellerOrders = (params = {}) =>
  api.get('/api/seller/orders', { params }).then((r) => r.data)
