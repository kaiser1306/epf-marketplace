import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'

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
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          EPF Marketplace
        </Link>

        <form className="nav-search" onSubmit={handleSearch}>
          <input
            className="input"
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
              <NavLink to="/favorites" className="nav-link">
                Favoris
              </NavLink>
              <NavLink to="/messages" className="nav-link">
                Messages
              </NavLink>
              <NavLink to="/orders" className="nav-link">
                Commandes
              </NavLink>
              <NavLink to="/cart" className="nav-link">
                Panier
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </NavLink>
              <NavLink to="/profile" className="nav-link">
                {user?.name?.split(' ')[0] ?? 'Profil'}
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
