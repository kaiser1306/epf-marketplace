import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSellerDashboard } from '../../services/sellerService'
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'

function SellerDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSellerDashboard()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />
  if (!data) return <div className="empty-state">Données indisponibles.</div>

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Tableau de bord vendeur</h1>
        <div className="row">
          <Link to="/seller/products" className="btn btn-outline btn-sm">
            Mes produits
          </Link>
          <Link to="/seller/products/new" className="btn btn-sm">
            + Nouveau produit
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{formatPrice(data.total_sales)}</div>
          <div className="stat-label">Ventes totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.total_orders}</div>
          <div className="stat-label">Commandes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.pending_orders}</div>
          <div className="stat-label">En attente</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{data.active_products}/{data.total_products}</div>
          <div className="stat-label">Produits actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">⭐ {Number(data.average_rating ?? 0).toFixed(1)}</div>
          <div className="stat-label">Note moyenne</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <h3>Commandes récentes</h3>
          {data.recent_orders?.length === 0 ? (
            <p className="muted">Aucune commande.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Total</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_orders?.map((o) => (
                    <tr key={o.order_number}>
                      <td>{o.order_number}</td>
                      <td>{formatPrice(o.total)}</td>
                      <td>{ORDER_STATUS_LABELS[o.status] ?? o.status}</td>
                      <td>{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3>Meilleurs produits</h3>
          {data.top_products?.length === 0 ? (
            <p className="muted">Aucune vente.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Ventes</th>
                    <th>Revenu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_products?.map((p, i) => (
                    <tr key={i}>
                      <td>{p.title}</td>
                      <td>{p.sales_count}</td>
                      <td>{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerDashboardPage
