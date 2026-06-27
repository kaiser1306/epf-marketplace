import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../../services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

const STATUS_BADGE = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  shipped: 'badge-info',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
}

function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const params = { page }
    if (status) params.status = status
    getMyOrders(params)
      .then((res) => {
        setOrders(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }, [status, page])

  return (
    <div>
      <h1 className="page-title">Mes commandes</h1>

      <div className="filters-bar">
        <div className="field">
          <label className="label">Statut</label>
          <select
            className="select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">Tous</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : orders.length === 0 ? (
        <div className="empty-state">Aucune commande pour l'instant.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>N° commande</th>
                  <th>Date</th>
                  <th>Articles</th>
                  <th>Total</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{o.item_count}</td>
                    <td className="price">{formatPrice(o.total_amount)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[o.status] ?? ''}`}>
                        {ORDER_STATUS_LABELS[o.status] ?? o.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/orders/${o.id}`} className="btn btn-sm btn-outline">
                        Détail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export default OrdersPage
