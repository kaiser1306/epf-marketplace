import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../utils/format'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Sans image</text></svg>'

function ProductCard({ product }) {
  const { isAuthenticated } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()

  const onSale = product.is_on_sale && product.effective_price
  const displayPrice = onSale ? product.effective_price : product.price

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    await addItem(product.id, 1)
  }

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`}>
        <img
          className="product-thumb"
          src={product.image || PLACEHOLDER}
          alt={product.title}
          onError={(e) => {
            e.currentTarget.src = PLACEHOLDER
          }}
        />
      </Link>
      <div className="product-info">
        {onSale && <span className="badge badge-sale">Promo</span>}
        <Link to={`/products/${product.id}`} className="product-title">
          {product.title}
        </Link>
        {product.seller?.name && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {product.seller.name}
          </span>
        )}
        <div>
          <span className="price">{formatPrice(displayPrice)}</span>
          {onSale && <span className="price-old">{formatPrice(product.price)}</span>}
        </div>
        {product.rating != null && (
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            ⭐ {Number(product.rating).toFixed(1)}
          </span>
        )}
        <button type="button" className="btn btn-sm btn-block mt-1" onClick={handleAdd}>
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}

export default ProductCard
