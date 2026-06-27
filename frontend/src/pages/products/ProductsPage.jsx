import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProducts } from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import ProductCard from '../../components/products/ProductCard'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtres dérivés de l'URL (partageable / persistant au refresh)
  const categoryId = searchParams.get('category_id') ?? ''
  const sort = searchParams.get('sort') ?? 'newest'
  const minPrice = searchParams.get('min_price') ?? ''
  const maxPrice = searchParams.get('max_price') ?? ''
  const page = Number(searchParams.get('page') ?? 1)

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, sort }
    if (categoryId) params.category_id = categoryId
    if (minPrice) params.min_price = minPrice
    if (maxPrice) params.max_price = maxPrice

    getProducts(params)
      .then((res) => {
        setProducts(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }, [categoryId, sort, minPrice, maxPrice, page])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const changePage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)
  }

  return (
    <div>
      <h1 className="page-title">Produits</h1>

      <div className="filters-bar">
        <div className="field">
          <label className="label">Catégorie</label>
          <select
            className="select"
            value={categoryId}
            onChange={(e) => updateFilter('category_id', e.target.value)}
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Trier par</label>
          <select
            className="select"
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            <option value="newest">Plus récents</option>
            <option value="popular">Populaires</option>
            <option value="cheapest">Moins chers</option>
            <option value="most_rated">Mieux notés</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Prix min</label>
          <input
            className="input"
            type="number"
            style={{ maxWidth: 110 }}
            value={minPrice}
            onChange={(e) => updateFilter('min_price', e.target.value)}
          />
        </div>

        <div className="field">
          <label className="label">Prix max</label>
          <input
            className="input"
            type="number"
            style={{ maxWidth: 110 }}
            value={maxPrice}
            onChange={(e) => updateFilter('max_price', e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <div className="empty-state">Aucun produit ne correspond à ces filtres.</div>
      ) : (
        <>
          <div className="grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <Pagination pagination={pagination} onChange={changePage} />
        </>
      )}
    </div>
  )
}

export default ProductsPage
