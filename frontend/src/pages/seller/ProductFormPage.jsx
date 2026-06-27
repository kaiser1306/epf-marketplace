import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  getProduct,
  createProduct,
  updateProduct,
} from '../../services/productService'
import { getCategories } from '../../services/categoryService'
import Loader from '../../components/common/Loader'

function ProductFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { status: 'draft', quantity: 1 } })

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getProduct(id)
      .then((p) => {
        reset({
          title: p.title,
          description: p.description,
          price: p.price,
          quantity: p.quantity,
          category_id: p.category?.id ?? '',
          status: p.status,
          sale_price: p.sale_price ?? '',
        })
      })
      .catch(() => {
        // Produit en brouillon non accessible publiquement : formulaire vierge
        toast('Pré-remplissage indisponible (brouillon), saisissez les champs.', { icon: 'ℹ️' })
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const onSubmit = async (data) => {
    const formData = new FormData()
    const fields = ['title', 'description', 'price', 'quantity', 'category_id', 'status']
    fields.forEach((f) => {
      if (data[f] !== undefined && data[f] !== '') formData.append(f, data[f])
    })
    if (data.sale_price) formData.append('sale_price', data.sale_price)
    if (image) formData.append('image', image)

    try {
      if (isEdit) {
        await updateProduct(id, formData)
        toast.success('Produit mis à jour')
      } else {
        await createProduct(formData)
        toast.success('Produit créé')
      }
      navigate('/seller/products')
    } catch (error) {
      const res = error.response?.data
      const firstError = res?.errors ? Object.values(res.errors)[0]?.[0] : null
      toast.error(firstError ?? res?.message ?? 'Enregistrement impossible')
    }
  }

  if (loading) return <Loader />

  return (
    <div>
      <h1 className="page-title">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h1>

      <form className="form" style={{ maxWidth: 640 }} onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label className="label">Titre</label>
          <input className="input" {...register('title', { required: 'Titre requis' })} />
          {errors.title && <span className="error-text">{errors.title.message}</span>}
        </div>

        <div className="field">
          <label className="label">Description</label>
          <textarea
            className="textarea"
            {...register('description', { required: 'Description requise' })}
          />
          {errors.description && <span className="error-text">{errors.description.message}</span>}
        </div>

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Prix (FCFA)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              {...register('price', { required: 'Prix requis' })}
            />
            {errors.price && <span className="error-text">{errors.price.message}</span>}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Quantité en stock</label>
            <input type="number" className="input" {...register('quantity')} />
          </div>
        </div>

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Catégorie</label>
            <select className="select" {...register('category_id', { required: 'Catégorie requise' })}>
              <option value="">Choisir...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category_id && <span className="error-text">{errors.category_id.message}</span>}
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Statut</label>
            <select className="select" {...register('status')}>
              <option value="draft">Brouillon</option>
              <option value="published">Publié</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label className="label">Prix promo flash (optionnel)</label>
          <input type="number" step="0.01" className="input" {...register('sale_price')} />
        </div>

        <div className="field">
          <label className="label">
            Image principale {isEdit ? '(laisser vide pour conserver)' : '(requise)'}
          </label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </div>

        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer le produit'}
        </button>
      </form>
    </div>
  )
}

export default ProductFormPage
