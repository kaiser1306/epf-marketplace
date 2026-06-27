import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getOrder, cancelOrder } from '../../services/orderService'
import { formatPrice, formatDate, ORDER_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'

function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getOrder(id)
      .then(setOrder)
      .catch(() => toast.error('Commande introuvable'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleCancel = async () => {
    if (!window.confirm('Annuler cette commande ?')) return
    try {
      const res = await cancelOrder(id)
      setOrder(res.order)
      toast.success('Commande annulée')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Annulation impossible')
    }
  }

  if (loading) return <Loader />
  if (!order) return <div className="empty-state">Commande introuvable.</div>

  return (
    <div>
      <Link to="/orders" className="muted">
        ← Mes commandes
      </Link>

      <div className="spread mt-2">
        <h1>Commande {order.order_number}</h1>
        <span className="badge badge-info">{ORDER_STATUS_LABELS[order.status] ?? order.status}</span>
      </div>
      <p className="muted">Passée le {formatDate(order.created_at)}</p>

      <div className="two-col mt-2">
        <div>
          <h3>Articles</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Prix unitaire</th>
                  <th>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product?.title ?? 'Produit supprimé'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.unit_price)}</td>
                    <td>{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-body">
              <h3>Livraison</h3>
              <p>{order.shipping_address}</p>
              <p className="muted">
                {order.shipping_city} {order.shipping_postal_code}
              </p>
            </div>
          </div>

          <div className="card mt-2">
            <div className="card-body">
              {order.discount_amount > 0 && (
                <div className="spread">
                  <span>Réduction {order.coupon?.code && `(${order.coupon.code})`}</span>
                  <span>- {formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="spread mt-1">
                <strong>Total</strong>
                <strong className="price">{formatPrice(order.total_amount)}</strong>
              </div>
            </div>
          </div>

          {order.status === 'pending' && (
            <button type="button" className="btn btn-danger btn-block mt-2" onClick={handleCancel}>
              Annuler la commande
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetailPage
