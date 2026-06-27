import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminStats } from '../../services/adminService'
import { formatPrice } from '../../utils/format'
import Loader from '../../components/common/Loader'

function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!stats) return <div className="empty-state">Statistiques indisponibles.</div>

  return (
    <div>
      <h1 className="page-title">Administration</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.users_count}</div>
          <div className="stat-label">Utilisateurs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.products_count}</div>
          <div className="stat-label">Produits</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.orders_count}</div>
          <div className="stat-label">Commandes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatPrice(stats.total_revenue)}</div>
          <div className="stat-label">Chiffre d'affaires</div>
        </div>
      </div>

      <div className="row row-wrap">
        <Link to="/admin/users" className="btn btn-outline">
          Gérer les utilisateurs
        </Link>
        <Link to="/admin/products" className="btn btn-outline">
          Modérer les produits
        </Link>
        <Link to="/admin/coupons" className="btn btn-outline">
          Gérer les coupons
        </Link>
      </div>
    </div>
  )
}

export default AdminDashboardPage
