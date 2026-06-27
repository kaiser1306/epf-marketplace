import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { search as searchApi } from '../services/searchService'
import { formatPrice } from '../utils/format'
import Loader from '../components/common/Loader'

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const type = searchParams.get('type') ?? 'all'

  const [results, setResults] = useState({ products: [], sellers: [], categories: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q.trim()) {
      setResults({ products: [], sellers: [], categories: [] })
      return
    }
    setLoading(true)
    searchApi(q, type, 20)
      .then(setResults)
      .finally(() => setLoading(false))
  }, [q, type])

  const changeType = (newType) => {
    const next = new URLSearchParams(searchParams)
    next.set('type', newType)
    setSearchParams(next)
  }

  return (
    <div>
      <h1 className="page-title">Recherche : « {q} »</h1>

      <div className="row row-wrap mb-2">
        {['all', 'products', 'sellers', 'categories'].map((t) => (
          <button
            key={t}
            type="button"
            className={`btn btn-sm ${type === t ? '' : 'btn-outline'}`}
            onClick={() => changeType(t)}
          >
            {{ all: 'Tout', products: 'Produits', sellers: 'Vendeurs', categories: 'Catégories' }[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          {(type === 'all' || type === 'products') && (
            <section className="mt-2">
              <h2>Produits ({results.products?.length ?? 0})</h2>
              <div className="grid mt-1">
                {results.products?.map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="product-card">
                    <img className="product-thumb" src={p.image} alt={p.title} />
                    <div className="product-info">
                      <span className="product-title">{p.title}</span>
                      <span className="price">{formatPrice(p.price)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(type === 'all' || type === 'sellers') && (
            <section className="mt-3">
              <h2>Vendeurs ({results.sellers?.length ?? 0})</h2>
              <div className="row row-wrap mt-1">
                {results.sellers?.map((s) => (
                  <div key={s.id} className="card" style={{ padding: '0.75rem', minWidth: 180 }}>
                    <strong>{s.name}</strong>
                    <div className="muted">⭐ {Number(s.rating ?? 0).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(type === 'all' || type === 'categories') && (
            <section className="mt-3">
              <h2>Catégories ({results.categories?.length ?? 0})</h2>
              <div className="row row-wrap mt-1">
                {results.categories?.map((c) => (
                  <Link
                    key={c.id}
                    to={`/products?category_id=${c.id}`}
                    className="badge badge-info"
                    style={{ padding: '0.4rem 0.9rem' }}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default SearchPage
