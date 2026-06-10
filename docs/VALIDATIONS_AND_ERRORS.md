# Validations et erreurs HTTP

Ce document est aligné sur les règles **`$request->validate()`** des contrôleurs API. Les messages d’erreur métier sont souvent traduits (`__()`) en français.

## Format standard Laravel

- **422 Unprocessable Entity** — échec de validation : corps du type  
  `{ "message": "...", "errors": { "champ": ["..."] } }`
- **401 Unauthorized** — absent ou token Sanctum invalide (`auth:sanctum`)
- **403 Forbidden** — rôle, propriété, compte suspendu, ou règle métier (ex. avis sans achat)
- **404 Not Found** — modèle introuvable ou produit non `published` sur les routes publiques
- **429 Too Many Requests** — dépassement du throttle `auth` sur register/login

---

## Authentification

### `POST /api/auth/register`

| Champ | Règles |
|--------|--------|
| `name` | requis, string, max 255 |
| `email` | requis, email, max 255, unique `users.email` |
| `password` | requis, string, min 6 |
| `phone` | optionnel, string, max 32 |
| `role` | optionnel, `buyer` ou `seller` (défaut `buyer`) |
| `city` | optionnel, string, max 120 |
| `bio` | optionnel, string, max 2000 |

Réponse succès : **201** avec `user`, `token` (texte Sanctum), `message`.

### `POST /api/auth/login`

| Champ | Règles |
|--------|--------|
| `email` | requis, email |
| `password` | requis, string |

- **401** si identifiants incorrects (`message` : identifiants invalides).
- **403** si `suspended_at` est défini (compte suspendu).

### `PUT /api/auth/profile` (authentifié)

| Champ | Règles |
|--------|--------|
| `name` | optionnel, string, max 255 |
| `bio` | optionnel, string, max 2000 |
| `phone` | optionnel, string, max 32 |
| `city` | optionnel, string, max 120 |
| `profile_image` | optionnel, fichier image, max 2 Mo, mimes: jpeg, png, jpg, webp, gif |

---

## Produits

### `POST /api/products` (vendeur)

| Champ | Règles |
|--------|--------|
| `title` | requis, string, max 255 |
| `description` | requis, string |
| `price` | requis, numeric, min 0 |
| `quantity` | optionnel, integer, min 0 (défaut 1 côté création) |
| `category_id` | requis, existe dans `categories` |
| `image` | requis, image, max 4096 Ko, mimes jpeg, png, jpg, webp, gif |
| `images` | optionnel, tableau max 10, mêmes règles par fichier |
| `status` | optionnel, `draft` ou `published` |
| `sale_price` | optionnel, numeric, min 0, doit être inférieur au prix normal (`lt:price`) |
| `sale_starts_at` / `sale_ends_at` | optionnels, dates ; fin ≥ début |

### `PUT /api/products/{product}` (propriétaire)

Champs en `sometimes` / `nullable` avec les mêmes familles de règles ; `status` peut être `draft`, `published`, `sold`, `inactive`. Si `sale_price` est non nul, il doit rester **strictement inférieur** au prix effectif — sinon **422** avec message explicite.

### `GET /api/products/my-products`

Query optionnelle : `status` ∈ `draft`, `published`, `sold`.

---

## Panier

- **`POST /api/cart/add`** : `product_id` requis (existe), `quantity` optionnel min 1. Erreurs **422** si produit non publié ou stock insuffisant.
- **`PUT /api/cart/items/{cartItem}`** : `quantity` requis, min 1 ; cohérence stock.

---

## Commandes

### `POST /api/orders`

| Champ | Règles |
|--------|--------|
| `shipping_address` | requis, string, max 500 |
| `shipping_city` | requis, string, max 120 |
| `shipping_postal_code` | requis, string, max 32 |
| `shipping_phone` | requis, string, max 32 |
| `notes` | optionnel, string, max 2000 |
| `coupon_code` | optionnel, string, max 40 |

Erreurs **422** possibles : panier vide, produit indisponible, stock, coupon invalide ou conditions non remplies (voir `CouponService`).

### `PUT /api/orders/{order}/status`

Body : `status` requis — valeurs autorisées selon acteur (admin vs vendeur) ; transitions d’articles validées par `OrderStatusService` pour le vendeur.

---

## Avis

### `POST /api/products/{product}/reviews`

- **403** si l’utilisateur n’a pas acheté le produit (`hasPurchasedProduct`).
- `rating` : requis, entier 1–5 ; `comment` : optionnel, max 5000 caractères.  
  Upsert par couple `(product_id, buyer_id)`.

### `GET /api/products/{product}/reviews`

Query : `sort` optionnel ∈ `newest`, `highest_rated`, `lowest_rated` ; `per_page` paginé.

---

## Favoris

- **`GET /api/favorites`** : `sort` optionnel ∈ `newest`, `price_low_to_high`, `price_high_to_low`.
- **`POST /api/favorites/add`** : `product_id` requis.

---

## Messages

### `POST /api/messages`

| Champ | Règles |
|--------|--------|
| `recipient_id` | requis, existe dans `users`, ≠ expéditeur |
| `content` | requis, string, max 5000 |
| `product_id` | optionnel, existe dans `products` |

---

## Recherche

### `GET /api/search`

| Paramètre | Règles |
|------------|--------|
| `q` | requis, string, 1–255 caractères |
| `type` | optionnel : `products`, `sellers`, `categories`, `all` (défaut) |
| `limit` | optionnel, 1–50 |

---

## Administration (rôle `admin`)

### Coupons — `POST/PUT /api/admin/coupons`

- `code`, `type` (`percent` | `fixed`), `value`, dates, `usage_limit`, `min_order_total`, `is_active` selon `AdminCouponController`.
- **422** si `type === percent` et `value` > 100.

### Produits — `PATCH /api/admin/products/{id}/status`

Body : `status` requis ∈ `draft`, `published`, `sold`, `inactive`.

### Utilisateurs — `GET /api/admin/users`

Query : `role` optionnel ∈ `buyer`, `seller`, `admin` ; pagination `per_page`.

---

## Références

Détail des routes : [MARKETPLACE_API_ROUTES.md](./MARKETPLACE_API_ROUTES.md).  
Exemples de JSON : [JSON_RESPONSES_EXAMPLES.md](./JSON_RESPONSES_EXAMPLES.md).
