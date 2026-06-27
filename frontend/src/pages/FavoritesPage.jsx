import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getFavorites, removeFavorite } from '../services/favoriteService'
import { useCart } from '../hooks/useCart'
import { formatPrice } from '../utils/format'
import Loader from '../components/common/Loader'
import Pagination from '../components/common/Pagination'

function FavoritesPage() {
  const { addItem } = useCart()
  const [favorites, setFavorites] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = page) => {
    setLoading(true)
    getFavorites({ page: p })
      .then((res) => {
        setFavorites(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const handleRemove = async (productId) => {
    try {
      await removeFavorite(productId)
      toast.success('Retiré des favoris')
      load(page)
    } catch {
      toast.error('Action impossible')
    }
  }

  if (loading) return <Loader />

  return (
    <div>
      <h1 className="page-title">Mes favoris</h1>
      {favorites.length === 0 ? (
        <div className="empty-state">Aucun favori. Ajoutez des produits à votre liste !</div>
      ) : (
        <>
          <div className="grid">
            {favorites.map((p) => (
              <div key={p.id} className="product-card">
                <Link to={`/products/${p.id}`}>
                  <img className="product-thumb" src={p.image} alt={p.title} />
                </Link>
                <div className="product-info">
                  <Link to={`/products/${p.id}`} className="product-title">
                    {p.title}
                  </Link>
                  <span className="price">{formatPrice(p.price)}</span>
                  <div className="row mt-1">
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => addItem(p.id, 1)}
                    >
                      Panier
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleRemove(p.id)}
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination pagination={pagination} onChange={setPage} />
        </>
      )}
    </div>
  )
}

export default FavoritesPage
