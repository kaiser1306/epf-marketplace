import api from './api'

export const getMe = () => api.get('/api/auth/me').then((r) => r.data.user)

// Mise à jour profil (avatar possible) -> FormData
export const updateProfile = (formData) =>
  api
    .post('/api/auth/profile', appendMethodPut(formData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data)

function appendMethodPut(formData) {
  formData.append('_method', 'PUT')
  return formData
}
