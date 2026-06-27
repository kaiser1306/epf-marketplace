import api from './api'

export const getConversations = () =>
  api.get('/api/messages/conversations').then((r) => r.data)

export const getThread = (userId, params = {}) =>
  api.get(`/api/messages/with/${userId}`, { params }).then((r) => r.data)

export const sendMessage = (data) =>
  api.post('/api/messages', data).then((r) => r.data)

export const getUnreadCount = () =>
  api.get('/api/messages/unread-count').then((r) => r.data.unread_count)
