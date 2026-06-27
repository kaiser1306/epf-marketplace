import api from './api'

export const getCategories = () =>
  api.get('/api/categories').then((r) => r.data)

export const getCategory = (id) =>
  api.get(`/api/categories/${id}`).then((r) => r.data)
