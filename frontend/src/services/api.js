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
    const url = error.config?.url ?? ''

    // On n'auto-déconnecte PAS sur les routes d'auth : un login échoué renvoie 401
    // et le composant doit pouvoir afficher "Identifiants invalides".
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')

    if (status === 401 && !isAuthRoute) {
      // Session invalide/expirée : on nettoie et on renvoie vers le login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    // 403 et toutes les autres erreurs : on laisse passer
    // pour que les composants gèrent l'affichage (ex : "vous n'avez pas les droits")
    return Promise.reject(error)
  },
)

export default api
