import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="empty-state">
      <h1 style={{ fontSize: '3rem' }}>404</h1>
      <p>Cette page n'existe pas.</p>
      <Link to="/" className="btn mt-2">
        Retour à l'accueil
      </Link>
    </div>
  )
}

export default NotFoundPage
