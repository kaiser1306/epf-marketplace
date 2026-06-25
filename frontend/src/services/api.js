import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Ajoute automatiquement le token Bearer sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Gestion centralisée des erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if (status === 401) {
      // Session invalide/expirée : on nettoie et on renvoie vers le login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // 403 et toutes les autres erreurs : on laisse passer
    // pour que les composants gèrent l'affichage (ex : "vous n'avez pas les droits")
    return Promise.reject(error)
  },
)

export default api
