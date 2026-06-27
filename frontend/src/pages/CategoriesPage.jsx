import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../services/categoryService'
import Loader from '../components/common/Loader'

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  return (
    <div>
      <h1 className="page-title">Catégories</h1>
      {categories.length === 0 ? (
        <div className="empty-state">Aucune catégorie.</div>
      ) : (
        <div className="grid">
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category_id=${c.id}`} className="card">
              <div className="card-body">
                <div style={{ fontSize: '2rem' }}>{c.icon ?? '📦'}</div>
                <h3>{c.name}</h3>
                <p className="muted">{c.products_count} produit(s)</p>
                {c.description && <p className="muted">{c.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default CategoriesPage
