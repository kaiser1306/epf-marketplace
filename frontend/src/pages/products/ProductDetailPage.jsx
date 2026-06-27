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
        toast.error("Vous devez avoir acheté ce produit pour laisser un avis")
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
    } catch (error) {
      toast.error(error.response?.data?.message ?? "Échec de l'envoi")
    }
  }

  if (loading) return <Loader />
  if (!product) return <div className="empty-state">Produit introuvable.</div>

  const onSale = product.is_on_sale && product.effective_price
  const displayPrice = onSale ? product.effective_price : product.price
  const isOwnProduct = user?.id === product.seller?.id

  return (
    <div>
      <Link to="/products" className="muted">
        ← Retour aux produits
      </Link>

      <div className="two-col mt-2">
        {/* Galerie */}
        <div>
          <img
            src={activeImage}
            alt={product.title}
            className="card"
            style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }}
          />
          {product.images?.length > 0 && (
            <div className="row row-wrap mt-1">
              {[product.image, ...product.images].map((img) => (
                <img
                  key={img}
                  src={img}
                  alt=""
                  onClick={() => setActiveImage(img)}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'cover',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: img === activeImage ? '2px solid var(--primary)' : '1px solid var(--border)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          {onSale && <span className="badge badge-sale">Promotion flash</span>}
          <h1>{product.title}</h1>
          <div className="mt-1">
            <span className="price" style={{ fontSize: '1.5rem' }}>
              {formatPrice(displayPrice)}
            </span>
            {onSale && <span className="price-old">{formatPrice(product.price)}</span>}
          </div>

          <p className="mt-1 muted">
            ⭐ {Number(product.rating ?? 0).toFixed(1)} ({product.total_reviews ?? 0} avis) ·{' '}
            {product.quantity > 0 ? `${product.quantity} en stock` : 'Rupture de stock'}
          </p>

          <p className="mt-2">{product.description}</p>

          {product.category && (
            <p className="muted">
              Catégorie :{' '}
              <Link to={`/products?category_id=${product.category.id}`}>
                {product.category.name}
              </Link>
            </p>
          )}

          {!isOwnProduct && (
            <div className="row mt-2">
              <input
                type="number"
                min="1"
                max={product.quantity}
                className="input"
                style={{ maxWidth: 80 }}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              />
              <button
                type="button"
                className="btn"
                onClick={handleAddToCart}
                disabled={product.quantity <= 0}
              >
                Ajouter au panier
              </button>
              <button type="button" className="btn btn-outline" onClick={toggleFavorite}>
                {favorite ? '♥ Favori' : '♡ Favori'}
              </button>
            </div>
          )}

          {/* Vendeur */}
          {product.seller && (
            <div className="card mt-3">
              <div className="card-body">
                <h3>Vendeur</h3>
                <p className="spread">
                  <span>
                    <strong>{product.seller.name}</strong>
                    <br />
                    <span className="muted">
                      ⭐ {Number(product.seller.rating ?? 0).toFixed(1)} · {product.seller.city ?? '—'}
                    </span>
                  </span>
                </p>
                {isAuthenticated && !isOwnProduct && (
                  <form onSubmit={contactSeller} className="mt-1">
                    <textarea
                      className="textarea"
                      placeholder="Poser une question au vendeur..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-sm mt-1">
                      Contacter le vendeur
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avis */}
      <section className="mt-3">
        <h2>Avis ({product.reviews?.length ?? 0})</h2>

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
                    {n} ⭐
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

        {product.reviews?.length === 0 ? (
          <p className="muted">Aucun avis pour ce produit.</p>
        ) : (
          product.reviews.map((r) => (
            <div key={r.id} className="card mb-2" style={{ padding: '0.85rem' }}>
              <div className="spread">
                <strong>{r.buyer?.name ?? 'Anonyme'}</strong>
                <span>{'⭐'.repeat(r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1">{r.comment}</p>}
              <span className="muted" style={{ fontSize: '0.8rem' }}>
                {formatDate(r.created_at)}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

export default ProductDetailPage
