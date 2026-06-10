# 🗄️ STRUCTURE BASE DE DONNÉES - MARKETPLACE

## Diagramme ER (Entité-Relation)

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password        │
│ phone           │
│ bio             │
│ profile_image   │
│ city            │
│ role (buyer/seller/admin)
│ rating (avg)    │
│ total_reviews   │
│ suspended_at    │
│ created_at      │
│ updated_at      │
│ deleted_at (soft delete)
└────────┬────────┘
         │
         │ 1:N
    ┌────┴───────────────────────────┐
    │                                │
    │                                │
┌───▼──────────────┐    ┌───────────▼────────┐
│    PRODUCTS      │    │    ORDERS          │
├──────────────────┤    ├────────────────────┤
│ id (PK)          │    │ id (PK)            │
│ user_id (FK)     │    │ user_id (FK)       │
│ category_id (FK) │    │ order_number (UNIQUE)
│ title            │    │ total_amount       │
│ slug (UNIQUE)    │    │ discount_amount    │
│ description      │    │ coupon_id (FK)     │
│ price            │    │ shipping_cost      │
│ sale_price       │    │ status             │
│ sale_starts_at   │    │ shipping_address   │
│ sale_ends_at     │    │ shipping_city      │
│ quantity         │    │ shipping_postal_code
│ image            │    │ shipping_phone     │
│ images (JSON)    │    │ notes              │
│ status           │    │ shipped_at         │
│ sales_count      │    │ delivered_at       │
│ views            │    │ created_at         │
│ rating (avg)     │    │ updated_at         │
│ total_reviews    │    └──────────┬───────────┘
│ created_at       │               │ N:1
│ updated_at       │               ▼
│ deleted_at       │        ┌──────────────┐
└────┬─────────────┘        │   COUPONS    │
     │                      ├──────────────┤
     │                      │ id (PK)      │
     │                      │ code (UNIQUE)│
     │                      │ type, value  │
     │                      │ usage_limit  │
     │                      │ times_used   │
     │                      │ min_order_tot│
     │                      │ starts/ends  │
     │                      │ is_active    │
     │                      └──────────────┘
     │ 1:N
     │
┌────▼──────────────┐    ┌──────▼──────────────┐
│   CART_ITEMS      │    │   ORDER_ITEMS      │
├───────────────────┤    ├────────────────────┤
│ id (PK)           │    │ id (PK)            │
│ user_id (FK)      │    │ order_id (FK)      │
│ product_id (FK)   │    │ product_id (FK)    │
│ quantity          │    │ seller_id (FK)     │
│ price_at_add      │    │ quantity           │
│ created_at        │    │ unit_price         │
│ updated_at        │    │ subtotal           │
└───────────────────┘    │ status             │
                         │ created_at         │
                         └────────────────────┘


┌──────────────────┐    ┌──────────────────┐
│   CATEGORIES     │    │    REVIEWS       │
├──────────────────┤    ├──────────────────┤
│ id (PK)          │    │ id (PK)          │
│ name (UNIQUE)    │    │ product_id (FK)  │
│ slug (UNIQUE)    │    │ seller_id (FK)   │
│ description      │    │ buyer_id (FK)    │
│ icon             │    │ rating (1-5)     │
│ created_at       │    │ comment          │
│ updated_at       │    │ created_at       │
└──────────────────┘    │ updated_at       │
        ▲               └──────────────────┘
        │ 1:N
        │
     (PRODUCTS)


┌──────────────────┐
│   FAVORITES      │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ product_id (FK)  │
│ created_at       │
└──────────────────┘
   ▲        ▲
   │        │
 M:N      M:N
   │        │
 USERS   PRODUCTS


┌──────────────────┐
│    MESSAGES      │
├──────────────────┤
│ id (PK)          │
│ sender_id (FK)   │
│ recipient_id (FK)│
│ product_id (FK)  │
│ content          │
│ is_read          │
│ read_at          │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## Tables Détaillées

### 1. USERS
```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  bio TEXT,
  profile_image VARCHAR(255),
  city VARCHAR(100),
  role ENUM('buyer', 'seller', 'admin') DEFAULT 'buyer',
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_reviews INT DEFAULT 0,
  suspended_at TIMESTAMP NULL,
  email_verified_at TIMESTAMP NULL,
  remember_token VARCHAR(100),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX(email),
  INDEX(role),
  INDEX(suspended_at)
);
```

### 2. CATEGORIES
```sql
CREATE TABLE categories (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX(slug)
);
```

### 3. PRODUCTS
```sql
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  category_id BIGINT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(12,2),
  sale_starts_at TIMESTAMP NULL,
  sale_ends_at TIMESTAMP NULL,
  quantity INT DEFAULT 1,
  image VARCHAR(255),
  images JSON,
  status ENUM('draft', 'published', 'sold', 'inactive') DEFAULT 'draft',
  views INT DEFAULT 0,
  sales_count INT UNSIGNED DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX(user_id),
  INDEX(category_id),
  INDEX(status),
  INDEX(slug)
);
```

### 4. CART_ITEMS
```sql
CREATE TABLE cart_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT DEFAULT 1,
  price_at_add DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id),
  INDEX(user_id)
);
```

### 5. COUPONS
```sql
CREATE TABLE coupons (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(40) UNIQUE NOT NULL,
  type VARCHAR(16) NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  usage_limit INT UNSIGNED,
  times_used INT UNSIGNED DEFAULT 0,
  min_order_total DECIMAL(12,2),
  starts_at TIMESTAMP NULL,
  ends_at TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 6. ORDERS
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  order_number VARCHAR(32) UNIQUE NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  coupon_id BIGINT,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(32) DEFAULT 'pending',
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(120) NOT NULL,
  shipping_postal_code VARCHAR(32) NOT NULL,
  shipping_phone VARCHAR(32) NOT NULL,
  notes TEXT,
  shipped_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE SET NULL,
  INDEX(user_id),
  INDEX(status),
  INDEX(order_number)
);
```

### 7. ORDER_ITEMS
```sql
CREATE TABLE order_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY(seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX(order_id),
  INDEX(seller_id)
);
```

### 8. REVIEWS
```sql
CREATE TABLE reviews (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  seller_id BIGINT NOT NULL,
  buyer_id BIGINT NOT NULL,
  rating INT NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY(seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(product_id, buyer_id),
  INDEX(seller_id),
  INDEX(buyer_id)
);
```

### 9. FAVORITES
```sql
CREATE TABLE favorites (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id),
  INDEX(user_id)
);
```

### 10. MESSAGES
```sql
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  sender_id BIGINT NOT NULL,
  recipient_id BIGINT NOT NULL,
  product_id BIGINT,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL,
  INDEX(sender_id),
  INDEX(recipient_id),
  INDEX(is_read)
);
```

*(Les définitions exactes de colonnes et index additionnels proviennent des migrations Laravel du dépôt ; ce schéma résume la forme logique.)*

---

## Indexes Recommandés

| Table | Colonnes | Type | Raison |
|-------|----------|------|--------|
| products | (category_id, status) | COMPOSITE | Filtrer par catégorie et statut |
| products | (user_id, status) | COMPOSITE | Récupérer les produits d'un vendeur |
| orders | (user_id, status) | COMPOSITE | Commandes d'un utilisateur |
| order_items | (order_id, seller_id) | COMPOSITE | Articles d'une commande pour un vendeur |
| messages | (sender_id, recipient_id) | COMPOSITE | Conversation entre deux utilisateurs |
| reviews | (product_id, seller_id) | COMPOSITE | Avis d'un produit et vendeur |

---

## Transactions Importantes

### Créer une commande
```
BEGIN TRANSACTION
  1. INSERT INTO orders (...)
  2. SELECT * FROM cart_items WHERE user_id = X (verrouillage)
  3. Pour chaque item du panier:
     - INSERT INTO order_items (prix unitaire = effectivePrice du produit)
     - UPDATE products SET quantity -= qty, sales_count += qty
  4. Valider coupon éventuel → total, discount_amount, coupon_id sur orders
  5. Incrémenter times_used du coupon si appliqué
  6. DELETE FROM cart_items WHERE user_id = X
  7. Si quantity produit = 0 → status = 'sold'
COMMIT
```

### Ajouter un avis
```
BEGIN TRANSACTION
  1. INSERT INTO reviews (...)
  2. UPDATE products SET rating = AVG(rating from reviews)
  3. UPDATE users SET rating = AVG(rating from reviews) WHERE id = seller_id
COMMIT
```

### Modifier le statut d'une commande
```
BEGIN TRANSACTION
  1. UPDATE order_items SET status = X WHERE order_id = Y
  2. UPDATE orders SET status = X, shipped_at/delivered_at = NOW() si nécessaire
COMMIT
```

---

## Séquences de données typiques

### Achat simple
User (buyer) → addToCart → updateCart → createOrder → OrderItem créé → Vendeur livre → updateOrderStatus

### Interactions vendeur-acheteur
Buyer → sendMessage → Seller → replyMessage → Buyer → leaveReview

### Gestion inventaire
Seller → createProduct (quantity=10) → 
→ Buyer1 createOrder (qty=2, quantity devient 8) → 
→ Buyer2 createOrder (qty=3, quantity devient 5) → 
→ Buyer3 createOrder (qty=5, quantity devient 0, status='sold')
