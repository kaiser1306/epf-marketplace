# Exemples de réponses JSON

Les structures ci-dessous correspondent aux payloads construits dans les contrôleurs (`userPayload`, `publicListItem`, `orderDetailPayload`, etc.). Les URLs d’images dépendent de `APP_URL` et de `php artisan storage:link`.

---

## Authentification

### Inscription — `201 Created`
```json
{
  "user": {
    "id": 1,
    "name": "Marie Dupont",
    "email": "marie@example.com",
    "role": "buyer",
    "bio": null,
    "phone": "0612345678",
    "city": "Paris",
    "profile_image": null,
    "rating": "5.00",
    "total_reviews": 0
  },
  "token": "1|abcdefghijklmnopqrstuvwxyz1234567890ABCDEF",
  "message": "Inscription réussie."
}
```

Le champ `token` est un **jeton Sanctum en clair**, pas un JWT.

### Connexion — `200 OK`
Même forme pour `user` (sans `created_at` dans le payload) + `token` + `message`.

### `GET /api/auth/me` — `200 OK`
```json
{
  "user": {
    "id": 1,
    "name": "Marie Dupont",
    "email": "marie@example.com",
    "role": "buyer",
    "bio": "…",
    "phone": "0612345678",
    "city": "Paris",
    "profile_image": "http://localhost/storage/profiles/abc.jpg",
    "rating": "4.50",
    "total_reviews": 12
  }
}
```

---

## Catalogue produits

### `GET /api/products` — `200 OK`
```json
{
  "data": [
    {
      "id": 42,
      "title": "Lampe design",
      "price": "79.00",
      "effective_price": "71.10",
      "is_on_sale": true,
      "sale_ends_at": "2026-06-01T23:59:59+00:00",
      "image": "http://localhost/storage/products/x.jpg",
      "rating": "4.80",
      "sales_count": 120,
      "seller": {
        "id": 5,
        "name": "Boutique Démo"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "total": 30
  }
}
```

*Remarque : la liste publique n’inclut pas la catégorie ni `slug` dans `publicListItem`.*

### `GET /api/products/{id}` — `200 OK` (extrait)
```json
{
  "id": 42,
  "title": "Lampe design",
  "slug": "lampe-design-a1b2",
  "description": "…",
  "price": "79.00",
  "effective_price": "71.10",
  "is_on_sale": true,
  "sale_price": "71.10",
  "sale_starts_at": "2026-05-01T00:00:00+00:00",
  "sale_ends_at": "2026-06-01T23:59:59+00:00",
  "quantity": 12,
  "image": "http://localhost/storage/products/x.jpg",
  "images": [],
  "status": "published",
  "views": 58,
  "rating": "4.80",
  "total_reviews": 15,
  "seller": {
    "id": 5,
    "name": "Boutique Démo",
    "bio": "…",
    "profile_image": null,
    "rating": "4.90",
    "total_reviews": 40,
    "phone": "0611111111",
    "city": "Lyon"
  },
  "category": {
    "id": 2,
    "name": "Maison",
    "slug": "maison"
  },
  "reviews": [
    {
      "id": 9,
      "rating": 5,
      "comment": "Très bien",
      "buyer": {
        "name": "Acheteur Démo",
        "profile_image": null
      },
      "created_at": "2026-05-08T12:00:00+00:00"
    }
  ]
}
```

### `GET /api/products/top-selling` — `200 OK`
```json
{
  "data": []
}
```
Chaque élément a la même forme qu’un item de `GET /api/products` (`publicListItem`).

---

## Commande

### `POST /api/orders` — `201 Created` (extrait)
```json
{
  "order": {
    "id": 10,
    "order_number": "ORDER-XXXXXXXX",
    "total_amount": "135.00",
    "discount_amount": "13.50",
    "coupon": { "code": "DEMO10" },
    "shipping_cost": "0.00",
    "status": "pending",
    "shipping_address": "10 rue de la Paix",
    "shipping_city": "Paris",
    "shipping_postal_code": "75002",
    "items": [
      {
        "id": 1,
        "product": {
          "id": 3,
          "title": "Casque audio",
          "price": "99.00",
          "image": "http://localhost/storage/products/y.jpg"
        },
        "seller": { "id": 2, "name": "Vendeur Démo" },
        "quantity": 1,
        "unit_price": "99.00",
        "subtotal": "99.00",
        "status": "pending"
      }
    ],
    "created_at": "2026-05-09T10:00:00+00:00",
    "shipped_at": null,
    "delivered_at": null
  },
  "message": "Commande créée."
}
```

Si aucun coupon : `"coupon": null`, `"discount_amount": "0.00"`.

---

## Recherche

### `GET /api/search?q=lamp&type=all` — `200 OK`
```json
{
  "products": [
    { "id": 42, "title": "Lampe design", "price": "79.00", "image": "http://localhost/storage/…" }
  ],
  "sellers": [],
  "categories": []
}
```

---

## Erreur de validation — `422`
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

---

Pour la liste complète des endpoints, voir [MARKETPLACE_API_ROUTES.md](./MARKETPLACE_API_ROUTES.md).
