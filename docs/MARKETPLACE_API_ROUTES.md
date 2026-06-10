# API Marketplace — Routes et fonctionnalités

**Implémentation** : Laravel + **Sanctum** (Bearer). **52** routes sous `/api`.

## Throttling

- `POST /api/auth/register` et `POST /api/auth/login` : limite **`auth`** — 10 requêtes / minute / IP (`AppServiceProvider`).

---

## Sans authentification

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/api/auth/register` | Inscription (`buyer` ou `seller`) |
| POST | `/api/auth/login` | Connexion (403 si compte suspendu) |
| GET | `/api/categories` | Liste des catégories |
| GET | `/api/categories/{category}` | Détail catégorie |
| GET | `/api/products` | Catalogue (filtres ci-dessous) |
| GET | `/api/products/top-selling` | Meilleures ventes (`limit` 1–50, défaut 10) |
| GET | `/api/products/{product}` | Détail produit (incrémente `views`) |
| GET | `/api/products/{product}/reviews` | Avis paginés |
| GET | `/api/sellers/{user}` | Profil vendeur |
| GET | `/api/sellers/{user}/products` | Produits du vendeur |
| GET | `/api/sellers/{user}/reviews` | Avis reçus par le vendeur |
| GET | `/api/search` | Recherche globale : query **`q`** (requis), `type` = `products` \| `sellers` \| `categories` \| `all` (défaut), `limit` 1–50 |

### `GET /api/products` — query

- `page`, `per_page` (1–100, défaut 12)
- `category_id`, `seller_id`, `min_price`, `max_price`
- `search` ou `q` — recherche titre / description (LIKE)
- `sort` : `newest` (défaut), `popular` (`sales_count`), `cheapest`, `most_rated`

Réponse : `data` (items publics avec `effective_price`, `is_on_sale`, `sales_count`, etc.) + `pagination` (`current_page`, `last_page`, `total`).

---

## Authentification Sanctum (sans blocage « non suspendu »)

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/api/auth/logout` | Révoque le token courant |

---

## `auth:sanctum` + `not_suspended`

Toutes les routes ci-dessous exigent un Bearer valide et un utilisateur non suspendu.

### Compte

| Méthode | Route | Description |
|--------|--------|-------------|
| GET | `/api/auth/me` | Utilisateur courant (payload `userPayload`) |
| PUT | `/api/auth/profile` | Mise à jour profil (multipart possible pour `profile_image`) |

### Produits (vendeur / propriétaire)

| Méthode | Route | Middleware / règle | Description |
|--------|--------|---------------------|-------------|
| GET | `/api/products/my-products` | — | Mes produits (`status` optionnel : draft, published, sold) |
| POST | `/api/products` | **`seller`** | Création produit (fichiers + promo flash optionnelle) |
| PUT | `/api/products/{product}` | propriétaire | Mise à jour |
| DELETE | `/api/products/{product}` | propriétaire | Suppression (fichiers nettoyés) |
| GET | `/api/products/{product}/is-favorite` | — | `{ "is_favorite": bool }` |

### Avis

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/api/products/{product}/reviews` | Créer un avis (règles métier dans `ReviewController`) |
| DELETE | `/api/reviews/{review}` | Supprimer son avis |

### Panier

| Méthode | Route | Description |
|--------|--------|-------------|
| GET | `/api/cart` | Contenu du panier |
| POST | `/api/cart/add` | Ajouter |
| PUT | `/api/cart/items/{cartItem}` | Quantité |
| DELETE | `/api/cart/items/{cartItem}` | Retirer une ligne |
| DELETE | `/api/cart/clear` | Vider |

### Commandes

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/api/orders` | Passer commande depuis le panier ; body peut inclure `coupon_code` |
| GET | `/api/orders/my-orders` | Mes commandes (`status`, pagination) |
| GET | `/api/orders/{order}` | Détail (acheteur, vendeur concerné, ou admin) |
| PUT | `/api/orders/{order}/status` | Voir `OrderController` (admin vs vendeur, transitions) |
| POST | `/api/orders/{order}/cancel` | Annulation acheteur si `pending` |

### Espace vendeur

| Méthode | Route | Description |
|--------|--------|-------------|
| GET | `/api/seller/orders` | Commandes contenant au moins une ligne du vendeur (`seller` ou `admin`) |
| GET | `/api/seller/dashboard` | Tableau de bord |
| GET | `/api/seller/statistics` | Statistiques |

### Favoris

| Méthode | Route | Description |
|--------|--------|-------------|
| GET | `/api/favorites` | Liste |
| POST | `/api/favorites/add` | Ajouter |
| DELETE | `/api/favorites/{product_id}` | Retirer |

### Messages

| Méthode | Route | Description |
|--------|--------|-------------|
| POST | `/api/messages` | Envoyer |
| GET | `/api/messages/conversations` | Liste des conversations |
| GET | `/api/messages/with/{user_id}` | Fil avec un utilisateur |
| GET | `/api/messages/unread-count` | Non lus |

---

## Administration — `auth:sanctum` + `not_suspended` + `admin`

Préfixe : **`/api/admin`**.

| Méthode | Route | Description |
|--------|--------|-------------|
| GET | `/api/admin/stats` | Statistiques globales |
| GET | `/api/admin/users` | Utilisateurs (pagination) |
| POST | `/api/admin/users/{user}/suspend` | Suspendre (`suspended_at`) |
| POST | `/api/admin/users/{user}/activate` | Réactiver |
| PATCH | `/api/admin/products/{id}/status` | Forcer le statut produit |
| DELETE | `/api/admin/products/{id}/force` | Suppression forcée |
| GET | `/api/admin/coupons` | Liste coupons |
| POST | `/api/admin/coupons` | Créer |
| PUT | `/api/admin/coupons/{coupon}` | Mettre à jour |
| DELETE | `/api/admin/coupons/{coupon}` | Supprimer |

---

## Fonctionnalités transverses

- **Prix effectif** : `Product::effectivePrice()` — tient compte du prix promo si la vente flash est active (`sale_price`, fenêtre `sale_starts_at` / `sale_ends_at`).
- **Coupons** : appliqués à la création de commande ; montant stocké dans `orders.discount_amount`, liaison `coupon_id`.
- **Soft deletes** : notamment sur `users` et `products` (selon migrations).
- **Images** : stockage `public` ; URLs via `PublicStorage::url()`.

Pour les règles de validation détaillées et les exemples JSON, voir les autres fichiers de ce dossier.
