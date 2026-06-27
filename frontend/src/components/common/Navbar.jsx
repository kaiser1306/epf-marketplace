import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
)

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
)

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.6A8.4 8.4 0 1 1 21 11.5z" />
  </svg>
)

const BagIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const CartIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
  </svg>
)

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`)
    }
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-dark">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          EPF<span className="brand-accent">market</span>
        </Link>

        <form className="nv-search" onSubmit={handleSearch}>
          <SearchIcon />
          <input
            placeholder="Rechercher un produit, un vendeur..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </form>

        <div className="nav-links">
          <NavLink to="/products" className="nav-link">
            Produits
          </NavLink>
          <NavLink to="/categories" className="nav-link">
            Catégories
          </NavLink>

          {user?.role === 'seller' && (
            <NavLink to="/seller" className="nav-link">
              Espace vendeur
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className="nav-link">
              Administration
            </NavLink>
          )}
        </div>

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <NavLink to="/favorites" className="nv-icon-btn" title="Favoris" aria-label="Favoris">
                <HeartIcon />
              </NavLink>
              <NavLink to="/messages" className="nv-icon-btn" title="Messages" aria-label="Messages">
                <ChatIcon />
              </NavLink>
              <NavLink to="/orders" className="nv-icon-btn" title="Commandes" aria-label="Commandes">
                <BagIcon />
              </NavLink>
              <NavLink to="/cart" className="nv-icon-btn" title="Panier" aria-label="Panier">
                <CartIcon />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </NavLink>
              <NavLink to="/profile" title={user?.name ?? 'Profil'} aria-label="Profil">
                <span className="nv-avatar">{initials(user?.name)}</span>
              </NavLink>
              <button type="button" className="btn btn-sm btn-outline" onClick={handleLogout}>
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">
                Connexion
              </NavLink>
              <Link to="/register" className="btn btn-sm">
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
