import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await login(data.email, data.password)
      toast.success('Connexion réussie')
      navigate('/')
    } catch (error) {
      const message = error.response?.data?.message ?? 'Identifiants invalides.'
      setServerError(message)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="center">Connexion</h1>
        <p className="muted center mb-2">Accédez à votre compte EPF Marketplace</p>

        {serverError && <div className="badge badge-danger mb-2">{serverError}</div>}

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              {...register('email', { required: 'Email requis' })}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label className="label">Mot de passe</label>
            <input
              className="input"
              type="password"
              {...register('password', { required: 'Mot de passe requis' })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="center mt-3 muted">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
