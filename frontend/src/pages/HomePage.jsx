import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTopSelling, getProducts } from '../services/productService'
import { getCategories } from '../services/categoryService'
import ProductCard from '../components/products/ProductCard'
import Loader from '../components/common/Loader'
import { formatPrice } from '../utils/format'

// Palette appliquée aux tuiles de catégories (cyclique, sans donnée côté API)
const CAT_PALETTE = [
  { tint: '#eff6ff', color: '#2563eb' },
  { tint: '#fef2f2', color: '#dc2626' },
  { tint: '#fdf4ff', color: '#a21caf' },
  { tint: '#ecfdf5', color: '#16a34a' },
  { tint: '#fff1f2', color: '#e11d48' },
  { tint: '#f5f3ff', color: '#7c3aed' },
]

// Temps restant jusqu'à la fin de journée (compte à rebours des ventes flash)
const getRemaining = () => {
  const now = new Date()
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const diff = Math.max(0, end - now)
  return {
    h: Math.floor(diff / 3.6e6),
    m: Math.floor((diff % 3.6e6) / 6e4),
    s: Math.floor((diff % 6e4) / 1000),
  }
}
const pad = (n) => String(n).padStart(2, '0')

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
)

const ImageIcon = () => (
  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.6" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

const BoltIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
  </svg>
)

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
)

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

function HomePage() {
  const navigate = useNavigate()
  const [topProducts, setTopProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [flashDeals, setFlashDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroQuery, setHeroQuery] = useState('')
  const [remaining, setRemaining] = useState(getRemaining())

  useEffect(() => {
    Promise.all([getTopSelling(8), getCategories(), getProducts({ per_page: 12 })])
      .then(([top, cats, list]) => {
        setTopProducts(top.data ?? [])
        setCategories(cats ?? [])
        const deals = (list.data ?? [])
          .filter((p) => p.is_on_sale && p.effective_price)
          .slice(0, 3)
        setFlashDeals(deals)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining()), 1000)
    return () => clearInterval(timer)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    const q = heroQuery.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/products')
  }

  const discountOf = (p) =>
    Math.round((1 - Number(p.effective_price) / Number(p.price)) * 100)

  return (
    <div>
      {/* ===== Hero ===== */}
      <section className="home-hero">
        <div className="home-hero-grid">
          <div>
            <span className="hero-badge">
              <span className="hero-dot" />+12 000 produits de vendeurs vérifiés
            </span>
            <h1 className="hero-title">
              Tout acheter, tout vendre,
              <br />
              <span>en toute simplicité.</span>
            </h1>
            <p className="hero-sub">
              La marketplace EPF connecte acheteurs et vendeurs autour de milliers de
              produits — paiement sécurisé, livraison rapide, avis vérifiés.
            </p>
            <form className="hero-search" onSubmit={submitSearch}>
              <SearchIcon />
              <input
                value={heroQuery}
                onChange={(e) => setHeroQuery(e.target.value)}
                placeholder="Que recherchez-vous ?"
              />
              <button type="submit" className="btn">
                Rechercher
              </button>
            </form>
            <div className="hero-stats">
              <div>
                <div className="hero-stat-value">12k+</div>
                <div className="hero-stat-label">Produits</div>
              </div>
              <div>
                <div className="hero-stat-value">2 300</div>
                <div className="hero-stat-label">Vendeurs</div>
              </div>
              <div>
                <div className="hero-stat-value">4,7★</div>
                <div className="hero-stat-label">Note moyenne</div>
              </div>
            </div>
          </div>

          <div className="hero-collage">
            <div className="hero-collage-bg" />
            <div
              className="hero-float"
              style={{ left: 30, top: 40, width: 200, transform: 'rotate(-3deg)' }}
            >
              <div
                className="hero-float-img"
                style={{ background: 'linear-gradient(150deg,#fff1e6,#eef2f7)', color: '#fb923c' }}
              >
                <ImageIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Clavier Aurora 75%</div>
              <span className="price" style={{ fontSize: '0.95rem' }}>
                {formatPrice(129900)}
              </span>
            </div>
            <div
              className="hero-float"
              style={{ right: 24, bottom: 36, width: 180, transform: 'rotate(4deg)' }}
            >
              <div
                className="hero-float-img"
                style={{ background: 'linear-gradient(150deg,#e0f2fe,#eef2f7)', color: '#38bdf8' }}
              >
                <ImageIcon />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Casque Studio ANC</div>
              <span className="price" style={{ fontSize: '0.95rem' }}>
                {formatPrice(89900)}
              </span>
            </div>
            <div className="hero-ship">Livraison 48h ✓</div>
          </div>
        </div>
      </section>

      {/* ===== Catégories ===== */}
      {categories.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Explorer par catégorie</h2>
            <Link to="/categories" className="section-link">
              Tout voir →
            </Link>
          </div>
          <div className="cat-grid">
            {categories.slice(0, 12).map((c, i) => {
              const pal = CAT_PALETTE[i % CAT_PALETTE.length]
              return (
                <Link key={c.id} to={`/products?category_id=${c.id}`} className="cat-card">
                  <span className="cat-icon" style={{ background: pal.tint, color: pal.color }}>
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="cat-name">{c.name}</span>
                  {c.products_count != null && (
                    <span className="cat-count">{c.products_count} produits</span>
                  )}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ===== Ventes flash ===== */}
      {flashDeals.length > 0 && (
        <section className="section">
          <div className="flash-banner">
            <div className="flash-side">
              <span className="flash-tag">
                <BoltIcon />
                VENTES FLASH
              </span>
              <h2>Offres du jour</h2>
              <p>Se termine dans</p>
              <div className="flash-timer">
                <div className="timer-box">
                  <div className="timer-num">{pad(remaining.h)}</div>
                  <div className="timer-label">heures</div>
                </div>
                <div className="timer-box">
                  <div className="timer-num">{pad(remaining.m)}</div>
                  <div className="timer-label">min</div>
                </div>
                <div className="timer-box">
                  <div className="timer-num accent">{pad(remaining.s)}</div>
                  <div className="timer-label">sec</div>
                </div>
              </div>
            </div>
            <div className="flash-products">
              {flashDeals.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="flash-card">
                  <div className="flash-card-media">
                    <span className="flash-discount">-{discountOf(p)}%</span>
                    {p.image && <img src={p.image} alt={p.title} />}
                  </div>
                  <div className="flash-card-title">{p.title}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
                    <span className="price">{formatPrice(p.effective_price)}</span>
                    <span className="price-old">{formatPrice(p.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Meilleures ventes ===== */}
      <section className="section">
        <div className="section-head">
          <h2>Meilleures ventes</h2>
          <Link to="/products" className="section-link">
            Voir le catalogue →
          </Link>
        </div>
        {loading ? (
          <Loader />
        ) : topProducts.length === 0 ? (
          <p className="muted">Aucun produit disponible pour le moment.</p>
        ) : (
          <div className="grid">
            {topProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ===== CTA vendeur ===== */}
      <section className="section">
        <div className="seller-cta">
          <div className="seller-cta-text">
            <h2>Vous avez quelque chose à vendre&nbsp;?</h2>
            <p>
              Ouvrez votre boutique en quelques minutes. Gérez vos produits, vos commandes
              et vos promotions flash depuis un tableau de bord dédié.
            </p>
            <div className="row">
              <Link to="/register" className="btn">
                Devenir vendeur
              </Link>
              <Link to="/products" className="btn btn-outline">
                En savoir plus
              </Link>
            </div>
          </div>
          <div className="cta-perks">
            <div className="perk">
              <span className="perk-icon" style={{ background: '#ffedd5', color: 'var(--primary)' }}>
                <ChartIcon />
              </span>
              <div>
                <div className="perk-title">0% jusqu'à 10 ventes</div>
                <div className="perk-sub">Commission offerte au lancement</div>
              </div>
            </div>
            <div className="perk">
              <span className="perk-icon" style={{ background: '#dcfce7', color: 'var(--success)' }}>
                <ShieldIcon />
              </span>
              <div>
                <div className="perk-title">Paiements protégés</div>
                <div className="perk-sub">Virement sous 48h après livraison</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              EPF<span>market</span>
            </div>
            <p className="footer-about">
              La marketplace qui connecte acheteurs et vendeurs, en toute confiance.
            </p>
          </div>
          <div className="footer-col">
            <h4>Acheter</h4>
            <Link to="/products">Catalogue</Link>
            <Link to="/categories">Catégories</Link>
            <Link to="/favorites">Favoris</Link>
          </div>
          <div className="footer-col">
            <h4>Vendre</h4>
            <Link to="/register">Devenir vendeur</Link>
            <Link to="/seller">Tableau de bord</Link>
          </div>
          <div className="footer-col">
            <h4>Aide</h4>
            <span>Centre d'aide</span>
            <span>Livraison &amp; retours</span>
            <span>Contact</span>
          </div>
        </div>
        <div className="footer-bottom">© 2026 EPF Marketplace — Projet CSI 3</div>
      </footer>
    </div>
  )
}

export default HomePage
