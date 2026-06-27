import api from './api'

export const addReview = (productId, data) =>
  api.post(`/api/products/${productId}/reviews`, data).then((r) => r.data)

export const deleteReview = (reviewId) =>
  api.delete(`/api/reviews/${reviewId}`).then((r) => r.data)
