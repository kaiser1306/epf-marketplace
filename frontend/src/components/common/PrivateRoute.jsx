
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

function PrivateRoute() {
  const { loading, isAuthenticated } = useAuth()

  if (loading) {
    return <p>Chargement...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default PrivateRoute