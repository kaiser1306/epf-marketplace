import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { createOrder } from '../services/orderService'
import { useCart } from '../hooks/useCart'
import { useAuth } from '../hooks/useAuth'
import { formatPrice } from '../utils/format'

function CheckoutPage() {
  const { items, total, refresh } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { shipping_city: user?.city ?? '', shipping_phone: user?.phone ?? '' },
  })

  const onSubmit = async (data) => {
    try {
      const res = await createOrder(data)
      await refresh()
      toast.success('Commande passée avec succès')
      navigate(`/orders/${res.order.id}`)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Impossible de créer la commande')
    }
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>Votre panier est vide</h2>
        <button type="button" className="btn mt-2" onClick={() => navigate('/products')}>
          Voir les produits
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Finaliser la commande</h1>

      <div className="two-col">
        <form className="form" onSubmit={handleSubmit(onSubmit)}>
          <div className="field">
            <label className="label">Adresse de livraison</label>
            <input className="input" {...register('shipping_address', { required: 'Adresse requise' })} />
            {errors.shipping_address && (
              <span className="error-text">{errors.shipping_address.message}</span>
            )}
          </div>

          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Ville</label>
              <input className="input" {...register('shipping_city', { required: 'Ville requise' })} />
              {errors.shipping_city && (
                <span className="error-text">{errors.shipping_city.message}</span>
              )}
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label className="label">Code postal</label>
              <input
                className="input"
                {...register('shipping_postal_code', { required: 'Code postal requis' })}
              />
              {errors.shipping_postal_code && (
                <span className="error-text">{errors.shipping_postal_code.message}</span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label">Téléphone</label>
            <input className="input" {...register('shipping_phone', { required: 'Téléphone requis' })} />
            {errors.shipping_phone && (
              <span className="error-text">{errors.shipping_phone.message}</span>
            )}
          </div>

          <div className="field">
            <label className="label">Code promo (optionnel)</label>
            <input className="input" {...register('coupon_code')} />
          </div>

          <div className="field">
            <label className="label">Notes (optionnel)</label>
            <textarea className="textarea" {...register('notes')} />
          </div>

          <button type="submit" className="btn btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Validation...' : 'Confirmer la commande'}
          </button>
        </form>

        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            <h3>Récapitulatif</h3>
            {items.map((item) => (
              <div key={item.id} className="spread mt-1">
                <span>
                  {item.product?.title} × {item.quantity}
                </span>
                <span>{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <hr className="mt-2" />
            <div className="spread mt-1">
              <strong>Total</strong>
              <strong className="price">{formatPrice(total)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
