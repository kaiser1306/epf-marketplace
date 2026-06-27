import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../../services/adminService'
import { formatPrice } from '../../utils/format'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'

function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { type: 'percent', is_active: true } })

  const load = (p = page) => {
    setLoading(true)
    getCoupons({ page: p })
      .then((res) => {
        setCoupons(res.data ?? [])
        setPagination(res.pagination ?? null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const onCreate = async (data) => {
    try {
      await createCoupon({
        code: data.code,
        type: data.type,
        value: Number(data.value),
        usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
        min_order_total: data.min_order_total ? Number(data.min_order_total) : null,
        is_active: data.is_active,
      })
      toast.success('Coupon créé')
      reset({ type: 'percent', is_active: true, code: '', value: '' })
      load(1)
      setPage(1)
    } catch (error) {
      const res = error.response?.data
      const firstError = res?.errors ? Object.values(res.errors)[0]?.[0] : null
      toast.error(firstError ?? res?.message ?? 'Création impossible')
    }
  }

  const toggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon.id, { is_active: !coupon.is_active })
      load(page)
    } catch {
      toast.error('Action impossible')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce coupon ?')) return
    try {
      await deleteCoupon(id)
      toast.success('Coupon supprimé')
      load(page)
    } catch {
      toast.error('Suppression impossible')
    }
  }

  return (
    <div>
      <h1 className="page-title">Coupons</h1>

      <div className="two-col">
        <form className="card" onSubmit={handleSubmit(onCreate)}>
          <div className="card-body form">
            <h3>Nouveau coupon</h3>
            <div className="field">
              <label className="label">Code</label>
              <input className="input" {...register('code', { required: 'Code requis' })} />
              {errors.code && <span className="error-text">{errors.code.message}</span>}
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Type</label>
                <select className="select" {...register('type')}>
                  <option value="percent">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Valeur</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  {...register('value', { required: 'Valeur requise' })}
                />
              </div>
            </div>
            <div className="row">
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Limite d'usage</label>
                <input type="number" className="input" {...register('usage_limit')} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Montant min. commande</label>
                <input type="number" step="0.01" className="input" {...register('min_order_total')} />
              </div>
            </div>
            <label className="row gap-sm">
              <input type="checkbox" {...register('is_active')} /> Actif
            </label>
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? 'Création...' : 'Créer le coupon'}
            </button>
          </div>
        </form>

        <div>
          {loading ? (
            <Loader />
          ) : coupons.length === 0 ? (
            <div className="empty-state">Aucun coupon.</div>
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Réduction</th>
                      <th>Usages</th>
                      <th>État</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.code}</strong>
                        </td>
                        <td>
                          {c.type === 'percent' ? `${c.value} %` : formatPrice(c.value)}
                        </td>
                        <td>
                          {c.times_used ?? 0}
                          {c.usage_limit ? ` / ${c.usage_limit}` : ''}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}
                            style={{ cursor: 'pointer', border: 'none' }}
                            onClick={() => toggleActive(c)}
                          >
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(c.id)}
                          >
                            Suppr.
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={pagination} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminCouponsPage
