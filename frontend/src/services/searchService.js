import api from './api'

export const search = (q, type = 'all', limit = 10) =>
  api.get('/api/search', { params: { q, type, limit } }).then((r) => r.data)
