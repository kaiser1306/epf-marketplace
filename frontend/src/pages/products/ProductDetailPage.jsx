import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProduct, isFavorite } from '../../services/productService'
import { addReview } from '../../services/reviewService'
import { addFavorite, removeFavorite } from '../../services/favoriteService'
import { sendMessage } from '../../services/messageService'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { formatPrice, formatDate } from '../../utils/format'
import Loader from '../../components/common/Loader'

function Stars({ value = 0 }) {
  const filled = Math.round(value)
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? '' : 'empty'}>
          ★
        </span>
      ))}
    </span>
  )
}

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [favorite, setFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [showContact, setShowContact] = useState(false)

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [messageText, setMessageText] = useState('')

  const load = () => {
    setLoading(true)
    getProduct(id)
      .then((data) => {
        setProduct(data)
        setActiveImage(data.image)
      })
      .catch(() => toast.error('Produit introuvable'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (isAuthenticated) {
      isFavorite(id).then(setFavorite).catch(() => {})
    }
  }, [id, isAuthenticated])

  const requireAuth = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return false
    }
    return true
  }

  const handleAddToCart = async () => {
    if (!requireAuth()) return
    await addItem(product.id, quantity)
  }

  const toggleFavorite = async () => {
    if (!requireAuth()) return
    try {
      if (favorite) {
        await removeFavorite(product.id)
        setFavorite(false)
        toast.success('Retiré des favoris')
      } else {
        await addFavorite(product.id)
        setFavorite(true)
        toast.success('Ajouté aux favoris')
      }
    } catch {
      toast.error('Action impossible')
    }
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    try {
      await addReview(product.id, { rating: Number(reviewRating), comment: reviewComment })
      toast.success('Avis enregistré')
      setReviewComment('')
      load()
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Vous devez avoir acheté ce produit pour laisser un avis')
      } else {
        toast.error(error.response?.data?.message ?? 'Impossible d’enregistrer l’avis')
      }
    }
  }

  const contactSeller = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    try {
      await sendMessage({
        recipient_id: product.seller.id,
        content: messageText,
        product_id: product.id,
      })
      toast.success('Message envoyé au vendeur')
      setMessageText('')
      setShowContact(false)
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Échec de l'envoi")
    }
  }

  if (loading) return <Loader />
  if (!product) return <div className="empty-state">Produit introuvable.</div>

  const onSale = product.is_on_sale && product.effective_price
  const displayPrice = onSale ? product.effective_price : product.price
  const isOwnProduct = user?.id === product.seller?.id
  const discount = onSale
    ? Math.round((1 - Number(product.effective_price) / Number(product.price)) * 100)
    : 0

  const reviews = product.reviews ?? []
  const totalReviews = product.total_reviews ?? reviews.length
  const avg = Number(product.rating ?? 0)
  const dist = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length)
  const gallery = [product.image, ...(product.images ?? [])].filter(Boolean)

  return (
    <div>
      {/* Fil d'Ariane */}
      <nav className="pd-breadcrumb">
        <Link to="/products">Produits</Link>
        {product.category && (
          <>
            {' › '}
            <Link to={`/products?category_id=${product.category.id}`}>
              {product.category.name}
            </Link>
          </>
        )}
        {' › '}
        <span style={{ color: '#64748b' }}>{product.title}</span>
      </nav>

      <div className="pd-grid">
        {/* Galerie */}
        <div className="pd-gallery-wrap">
          {onSale && <span className="pd-flash-badge">PROMO FLASH</span>}
          <img
            src={activeImage || product.image}
            alt={product.title}
            className="pd-gallery-main"
          />
          {gallery.length > 1 && (
            <div className="pd-thumbs">
              {gallery.map((img) => (
                <img
                  key={img}
                  src={img}
                  alt=""
                  onClick={() => setActiveImage(img)}
                  className={`pd-thumb ${img === activeImage ? 'active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bloc d'achat */}
        <div>
          <h1 className="pd-title">{product.title}</h1>

          <div className="pd-rating-row">
            <Stars value={avg} />
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {avg.toFixed(1)} · {totalReviews} avis
            </span>
            <span className={`pd-stock-pill ${product.quantity > 0 ? '' : 'out'}`}>
              <span className="dot" />
              {product.quantity > 0 ? `En stock · ${product.quantity}` : 'Rupture de stock'}
            </span>
          </div>

          <div className="pd-price-box">
            <span className="pd-price">{formatPrice(displayPrice)}</span>
            {onSale && <span className="pd-price-old">{formatPrice(product.price)}</span>}
            {onSale && discount > 0 && <span className="pd-discount">−{discount}%</span>}
          </div>

          {!isOwnProduct && (
            <div className="pd-actions">
              <div className="qty-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.quantity || q + 1, q + 1))}
                  disabled={quantity >= product.quantity}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="btn"
                style={{ flex: 1 }}
                onClick={handleAddToCart}
                disabled={product.quantity <= 0}
              >
                Ajouter au panier
              </button>
              <button
                type="button"
                className={`pd-fav-btn ${favorite ? 'on' : ''}`}
                onClick={toggleFavorite}
                aria-label="Ajouter aux favoris"
              >
                {favorite ? '♥' : '♡'}
              </button>
            </div>
          )}

          <div className="pd-trust">
            <div className="trust-item">
              <span>🚚</span>
              <span>Livré sous 48h</span>
            </div>
            <div className="trust-item">
              <span>↩️</span>
              <span>Retour 30 jours</span>
            </div>
            <div className="trust-item">
              <span>🔒</span>
              <span>Paiement sécurisé</span>
            </div>
          </div>

          {/* Vendeur */}
          {product.seller && (
            <>
              <div className="pd-seller">
                <span className="pd-seller-avatar">{initials(product.seller.name)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{product.seller.name}</div>
                  <div className="muted" style={{ fontSize: '0.8rem' }}>
                    ★ {Number(product.seller.rating ?? 0).toFixed(1)} vendeur ·{' '}
                    {product.seller.city ?? '—'}
                  </div>
                </div>
                {isAuthenticated && !isOwnProduct && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowContact((v) => !v)}
                  >
                    Contacter
                  </button>
                )}
              </div>

              {showContact && isAuthenticated && !isOwnProduct && (
                <form onSubmit={contactSeller} className="pd-contact-form">
                  <textarea
                    className="textarea"
                    placeholder="Poser une question au vendeur..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-sm mt-1">
                    Envoyer le message
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="pd-tabs">
        <button
          type="button"
          className={`pd-tab ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>
        <button
          type="button"
          className={`pd-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Avis ({totalReviews})
        </button>
      </div>

      {activeTab === 'description' ? (
        <p className="pd-desc" style={{ maxWidth: 760 }}>
          {product.description}
        </p>
      ) : (
        <div className="pd-reviews-grid">
          <div className="rating-summary">
            <div className="rating-big">{avg.toFixed(1)}</div>
            <Stars value={avg} />
            <div className="muted" style={{ fontSize: '0.8rem', margin: '0.5rem 0 1rem' }}>
              {totalReviews} avis vérifiés
            </div>
            <div className="rating-bars">
              {[5, 4, 3, 2, 1].map((star, i) => {
                const pct = reviews.length ? Math.round((dist[i] / reviews.length) * 100) : 0
                return (
                  <div key={star} className="rating-bar">
                    <span className="rating-bar-label">{star}★</span>
                    <span className="rating-bar-track">
                      <span className="rating-bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            {isAuthenticated && !isOwnProduct && (
              <form onSubmit={submitReview} className="card mb-2" style={{ padding: '1rem' }}>
                <div className="row">
                  <select
                    className="select"
                    style={{ maxWidth: 120 }}
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} ★
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    placeholder="Votre commentaire (optionnel)"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                  <button type="submit" className="btn">
                    Publier
                  </button>
                </div>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="muted">Aucun avis pour ce produit.</p>
            ) : (
              <div className="review-list">
                {reviews.map((r) => (
                  <div key={r.id} className="review-card">
                    <div className="spread">
                      <strong>{r.buyer?.name ?? 'Anonyme'}</strong>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-1" style={{ color: '#475569' }}>
                        {r.comment}
                      </p>
                    )}
                    <span className="muted" style={{ fontSize: '0.78rem' }}>
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailPage
