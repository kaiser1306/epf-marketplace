import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function RoleRoute({ role }) {
  const { loading, isAuthenticated, user } = useAuth()

  if (loading) {
    return <p>Chargement...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== role) {
    return <p>Vous n'avez pas les droits pour accéder à cette page</p>
  }

  return <Outlet />
}

export default RoleRoute
