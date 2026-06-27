import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { addFavorite } from '../../services/favoriteService'
import { formatPrice } from '../../utils/format'

const PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="%23f1f5f9"/><text x="50%" y="50%" font-size="14" fill="%2394a3b8" text-anchor="middle" dy=".3em">Sans image</text></svg>'

const HeartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)

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

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    try {
      await addFavorite(product.id)
      toast.success('Ajouté aux favoris')
    } catch {
      toast.error('Action impossible')
    }
  }

  return (
    <div className="product-card">
      <div className="pc-media">
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
        {onSale && <span className="pc-promo">PROMO</span>}
        <button type="button" className="pc-heart" onClick={handleFavorite} aria-label="Ajouter aux favoris">
          <HeartIcon />
        </button>
      </div>

      <div className="product-info">
        <Link to={`/products/${product.id}`} className="product-title">
          {product.title}
        </Link>
        {product.seller?.name && (
          <span className="muted" style={{ fontSize: '0.78rem' }}>
            {product.seller.name}
          </span>
        )}
        {product.rating != null && (
          <span className="pc-rating">
            <span className="pc-star">★</span>
            {Number(product.rating).toFixed(1)}
          </span>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 'auto', paddingTop: 6 }}>
          <span className="price">{formatPrice(displayPrice)}</span>
          {onSale && <span className="price-old">{formatPrice(product.price)}</span>}
        </div>
        <button type="button" className="pc-add" onClick={handleAdd}>
          Ajouter au panier
        </button>
      </div>
    </div>
  )
}

export default ProductCard
