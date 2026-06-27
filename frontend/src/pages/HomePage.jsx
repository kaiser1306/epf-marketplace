import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTopSelling } from '../services/productService'
import { getCategories } from '../services/categoryService'
import ProductCard from '../components/products/ProductCard'
import Loader from '../components/common/Loader'

function HomePage() {
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getTopSelling(8), getCategories()])
      .then(([top, cats]) => {
        setTopProducts(top.data ?? [])
        setCategories(cats ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="hero">
        <h1>Bienvenue sur EPF Marketplace</h1>
        <p>Achetez et vendez en toute simplicité. Des milliers de produits vous attendent.</p>
        <Link to="/products" className="btn btn-outline mt-2" style={{ background: '#fff' }}>
          Explorer les produits
        </Link>
      </section>

      {categories.length > 0 && (
        <section className="mb-2">
          <h2>Catégories</h2>
          <div className="row row-wrap mt-1">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/products?category_id=${c.id}`}
                className="badge badge-info"
                style={{ padding: '0.4rem 0.9rem' }}
              >
                {c.name} ({c.products_count})
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-3">
        <h2>Meilleures ventes</h2>
        {loading ? (
          <Loader />
        ) : topProducts.length === 0 ? (
          <p className="muted">Aucun produit disponible pour le moment.</p>
        ) : (
          <div className="grid mt-2">
            {topProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default HomePage
