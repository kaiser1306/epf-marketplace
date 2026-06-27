import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'

function RegisterPage() {
  const { register: registerUser, login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'buyer' } })

  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role,
        city: data.city || undefined,
        phone: data.phone || undefined,
      })
      // Connexion automatique après inscription
      await login(data.email, data.password)
      toast.success('Compte créé avec succès')
      navigate('/')
    } catch (error) {
      const res = error.response?.data
      // Laravel renvoie les erreurs de validation dans `errors`
      const firstError = res?.errors ? Object.values(res.errors)[0]?.[0] : null
      setServerError(firstError ?? res?.message ?? "Échec de l'inscription.")
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1 className="center">Inscription</h1>
        <p className="muted center mb-2">Rejoignez EPF Marketplace</p>

        {serverError && <div className="badge badge-danger mb-2">{serverError}</div>}

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label className="label">Nom complet</label>
            <input className="input" {...register('name', { required: 'Nom requis' })} />
            {errors.name && <span className="error-text">{errors.name.message}</span>}
          </div>

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
            <label className="label">Je m'inscris en tant que</label>
            <select className="select" {...register('role')}>
              <option value="buyer">Acheteur</option>
              <option value="seller">Vendeur</option>
            </select>
          </div>

          <div className="field">
            <label className="label">Mot de passe</label>
            <input
              className="input"
              type="password"
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: { value: 6, message: '6 caractères minimum' },
              })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="field">
            <label className="label">Confirmer le mot de passe</label>
            <input
              className="input"
              type="password"
              {...register('password_confirmation', {
                required: 'Confirmation requise',
                validate: (value) =>
                  value === password || 'Les mots de passe ne correspondent pas',
              })}
            />
            {errors.password_confirmation && (
              <span className="error-text">{errors.password_confirmation.message}</span>
            )}
          </div>

          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Ville (optionnel)</label>
              <input className="input" {...register('city')} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Téléphone (optionnel)</label>
              <input className="input" {...register('phone')} />
            </div>
          </div>

          <button type="submit" className="btn btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : "S'inscrire"}
          </button>
        </form>

        <p className="center mt-3 muted">
          Déjà inscrit ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
