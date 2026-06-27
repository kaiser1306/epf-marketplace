import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMyProducts, deleteProduct } from '../../services/productService'
import { formatPrice, PRODUCT_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

function MyProductsPage() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = page) => {
    setLoading(true)
    const params = { page: p }
    if (status) params.status = status
    getMyProducts(params)
      .then((res) => {
        setProducts(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page])

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return
    try {
      await deleteProduct(id)
      toast.success('Produit supprimé')
      load(page)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Suppression impossible')
    }
  }

  return (
    <div>
      <div className="spread">
        <h1 className="page-title">Mes produits</h1>
        <Link to="/seller/products/new" className="btn">
          + Nouveau produit
        </Link>
      </div>

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
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="sold">Vendu</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <div className="empty-state">Aucun produit. Créez votre première annonce !</div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Vues</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="row">
                        <img
                          src={p.image}
                          alt=""
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                        />
                        {p.title}
                      </div>
                    </td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.quantity}</td>
                    <td>{p.views}</td>
                    <td>
                      <span className="badge">{PRODUCT_STATUS_LABELS[p.status] ?? p.status}</span>
                    </td>
                    <td>
                      <div className="row">
                        <Link to={`/seller/products/${p.id}/edit`} className="btn btn-sm btn-outline">
                          Modifier
                        </Link>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(p.id)}
                        >
                          Supprimer
                        </button>
                      </div>
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

export default MyProductsPage
