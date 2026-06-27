import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { getMe, updateProfile } from '../services/userService'
import { useAuth } from '../hooks/useAuth'

function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [avatar, setAvatar] = useState(null)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm()

  useEffect(() => {
    getMe()
      .then((fresh) => {
        updateUser(fresh)
        reset({
          name: fresh.name,
          bio: fresh.bio ?? '',
          phone: fresh.phone ?? '',
          city: fresh.city ?? '',
        })
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data) => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('bio', data.bio ?? '')
    formData.append('phone', data.phone ?? '')
    formData.append('city', data.city ?? '')
    if (avatar) formData.append('profile_image', avatar)

    try {
      const res = await updateProfile(formData)
      updateUser(res.user)
      toast.success('Profil mis à jour')
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Mise à jour impossible')
    }
  }

  if (loading) return null

  return (
    <div>
      <h1 className="page-title">Mon profil</h1>

      <div className="two-col">
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body center">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt="avatar"
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', margin: '0 auto' }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto',
                }}
              >
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <h3 className="mt-2">{user?.name}</h3>
            <p className="muted">{user?.email}</p>
            <span className="badge badge-info">{user?.role}</span>
            <p className="muted mt-1">
              ⭐ {Number(user?.rating ?? 0).toFixed(1)} ({user?.total_reviews ?? 0} avis)
            </p>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label className="label">Nom</label>
            <input className="input" {...register('name', { required: true })} />
          </div>
          <div className="field">
            <label className="label">Ville</label>
            <input className="input" {...register('city')} />
          </div>
          <div className="field">
            <label className="label">Téléphone</label>
            <input className="input" {...register('phone')} />
          </div>
          <div className="field">
            <label className="label">Bio</label>
            <textarea className="textarea" {...register('bio')} />
          </div>
          <div className="field">
            <label className="label">Photo de profil</label>
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
            />
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfilePage
