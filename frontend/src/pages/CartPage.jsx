import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/format'
import Loader from '../components/common/Loader'

function CartPage() {
  const { items, total, itemCount, loading, updateItem, removeItem, clear } = useCart()
  const navigate = useNavigate()

  if (loading) return <Loader />

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Votre panier est vide</h2>
        <Link to="/products" className="btn mt-2">
          Voir les produits
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Mon panier ({itemCount})</h1>
        <button type="button" className="btn btn-sm btn-outline" onClick={clear}>
          Vider le panier
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Prix</th>
              <th>Quantité</th>
              <th>Sous-total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link to={`/products/${item.product?.id}`} className="row">
                    <img
                      src={item.product?.image}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                    />
                    <span>{item.product?.title}</span>
                  </Link>
                </td>
                <td>{formatPrice(item.product?.effective_price ?? item.product?.price)}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max={item.product?.quantity}
                    className="input"
                    style={{ width: 70 }}
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value))
                      updateItem(item.id, qty)
                    }}
                  />
                </td>
                <td className="price">{formatPrice(item.subtotal)}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(item.id)}
                  >
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="spread mt-3">
        <h2>Total : {formatPrice(total)}</h2>
        <button type="button" className="btn" onClick={() => navigate('/checkout')}>
          Passer la commande
        </button>
      </div>
    </div>
  )
}

export default CartPage
