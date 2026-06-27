import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getSellerOrders, updateOrderStatus } from '../../services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

const NEXT_STATUS = ['confirmed', 'shipped', 'delivered']

function SellerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = page) => {
    setLoading(true)
    getSellerOrders({ page: p })
      .then((res) => {
        setOrders(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const changeStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status)
      toast.success('Statut mis à jour')
      load(page)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Mise à jour impossible')
    }
  }

  if (loading) return <Loader />

  return (
    <div>
      <h1 className="page-title">Commandes reçues</h1>

      {orders.length === 0 ? (
        <div className="empty-state">Aucune commande reçue.</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Acheteur</th>
                  <th>Articles</th>
                  <th>Total (mes produits)</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.order_number}</td>
                    <td>
                      {o.buyer?.name}
                      <br />
                      <span className="muted" style={{ fontSize: '0.8rem' }}>
                        {o.buyer?.phone}
                      </span>
                    </td>
                    <td>
                      {o.items?.map((it, i) => (
                        <div key={i} style={{ fontSize: '0.85rem' }}>
                          {it.product?.title} × {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td>{formatPrice(o.total_amount)}</td>
                    <td>
                      <span className="badge">{ORDER_STATUS_LABELS[o.status] ?? o.status}</span>
                    </td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>
                      <select
                        className="select"
                        style={{ minWidth: 130 }}
                        value=""
                        onChange={(e) => e.target.value && changeStatus(o.id, e.target.value)}
                      >
                        <option value="">Changer statut...</option>
                        {NEXT_STATUS.map((s) => (
                          <option key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
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

export default SellerOrdersPage
