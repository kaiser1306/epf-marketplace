// Formatage d'un montant en FCFA (le backend renvoie des chaines décimales)
export const formatPrice = (value) => {
  const number = Number(value ?? 0)
  return `${number.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`
}

// Date lisible à partir d'un ISO 8601
export const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Libellés FR pour les statuts de commande
export const ORDER_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

// Libellés FR pour les statuts produit
export const PRODUCT_STATUS_LABELS = {
  draft: 'Brouillon',
  published: 'Publié',
  sold: 'Vendu',
  inactive: 'Inactif',
}
