import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getProducts } from '../../services/productService'
import { setProductStatus, forceDeleteProduct } from '../../services/adminService'
import { formatPrice, PRODUCT_STATUS_LABELS } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

const STATUSES = ['draft', 'published', 'sold', 'inactive']

function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = (p = page) => {
    setLoading(true)
    getProducts({ page: p })
      .then((res) => {
        setProducts(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const changeStatus = async (id, status) => {
    try {
      await setProductStatus(id, status)
      toast.success('Statut produit modifié')
      load(page)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Action impossible')
    }
  }

  const handleForceDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ce produit ?')) return
    try {
      await forceDeleteProduct(id)
      toast.success('Produit supprimé définitivement')
      load(page)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Suppression impossible')
    }
  }

  return (
    <div>
      <h1 className="page-title">Modération des produits</h1>
      <p className="muted mb-2">
        Liste des produits publiés. Vous pouvez forcer leur statut ou les supprimer définitivement.
      </p>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Prix</th>
                  <th>Vendeur</th>
                  <th>Forcer le statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{p.seller?.name ?? '—'}</td>
                    <td>
                      <select
                        className="select"
                        style={{ minWidth: 130 }}
                        value=""
                        onChange={(e) => e.target.value && changeStatus(p.id, e.target.value)}
                      >
                        <option value="">Choisir...</option>
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PRODUCT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleForceDelete(p.id)}
                      >
                        Supprimer
                      </button>
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

export default AdminProductsPage
