# Marketplace API (EPF)

API REST de marketplace construite avec **Laravel 13**, **PHP 8.3** et **Laravel Sanctum** pour l’authentification par token Bearer. Le projet expose des ressources pour acheteurs, vendeurs et administrateurs (catalogue, panier, commandes, avis, favoris, messagerie, coupons, promotions, modération).

## Fonctionnalités principales

- Inscription / connexion avec rôles `buyer`, `seller` ; rôle `admin` pour la gestion
- CRUD produits (vendeur), catalogue public, **top selling**, **prix promo** (flash sale) avec fenêtre de dates
- Panier, commande depuis le panier avec **code promo** (`coupons`)
- Avis (condition : avoir acheté le produit), favoris, recherche multi-entités
- Messagerie entre utilisateurs (avec `read_at` / non lus)
- Espace vendeur : commandes filtrées, tableau de bord, statistiques
- Administration : statistiques, suspension d’utilisateurs, modération produits, CRUD coupons

La liste des **52** routes est décrite dans [docs/MARKETPLACE_API_ROUTES.md](docs/MARKETPLACE_API_ROUTES.md). Le dossier [docs/](docs/README.md) indexe toute la documentation technique.

## Prérequis

- PHP **8.3+** avec extensions habituelles Laravel (pdo, mbstring, openssl, tokenizer, xml, ctype, json, etc.)
- Composer 2.x
- Node.js 20+ (assets Vite, optionnel pour l’API seule)
- MySQL, MariaDB ou PostgreSQL (SQLite possible pour le développement / tests)

## Installation

```bash
cd epf-marketplace
composer install
cp .env.example .env
php artisan key:generate
```

Configurez la base dans `.env` (`DB_*`), puis :

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

Les seeders chargent **CategorySeeder** et **MarketplaceSeeder** (utilisateurs et produits de démonstration, coupon **DEMO10**).

### Comptes de démonstration (après `db:seed`)

| Rôle   | Email               | Mot de passe |
|--------|---------------------|--------------|
| Acheteur | `buyer@example.com` | `secret12`   |
| Vendeur  | `seller@example.com` | `secret12`   |
| Admin    | `admin@example.com`  | `secret12`   |

## Lancer l’application

L’application se compose de **deux parties** à démarrer dans **deux terminaux séparés** :
le backend (API Laravel) et le frontend (SPA React).

### 1. Backend — API Laravel

Prérequis : la base MySQL doit tourner (ex. **MySQL de XAMPP**) et le `.env` doit être configuré (`DB_*`).

```bash
# à la racine du projet (epf-marketplace/)
php artisan serve
```

API disponible sur : `http://localhost:8000/api/...`

> Inutile de placer le projet dans `htdocs` : `php artisan serve` embarque son propre serveur web.
> Seul **MySQL** de XAMPP est requis (Apache facultatif).

### 2. Frontend — React (Vite)

Dans un **second terminal** :

```bash
cd frontend
npm install                 
cp .env.example .env     
npm run dev
```

Interface disponible sur : `http://localhost:5173`

> Le frontend appelle l’API à l’URL définie par `VITE_API_URL`. Pensez à autoriser
> l’origine du front (`http://localhost:5173`) dans la config CORS de Laravel (`config/cors.php`).

### Connexion

Utilisez un des [comptes de démonstration](#comptes-de-démonstration-après-db-seed) ci-dessus
(mot de passe `secret12`).

> Les routes `POST /api/auth/register` et `POST /api/auth/login` sont limitées à **10 requêtes par minute et par IP**.

## Tests

```bash
php artisan test
```

Les tests fonctionnels couvrent une partie du flux marketplace (voir `tests/Feature/`).

## Documentation

| Document | Contenu |
|----------|---------|
| [docs/README.md](docs/README.md) | Index et conventions |
| [docs/MARKETPLACE_API_ROUTES.md](docs/MARKETPLACE_API_ROUTES.md) | Routes, paramètres, middlewares |
| [docs/DATABASE_STRUCTURE.md](docs/DATABASE_STRUCTURE.md) | Modèle de données |
| [docs/VALIDATIONS_AND_ERRORS.md](docs/VALIDATIONS_AND_ERRORS.md) | Validation et codes HTTP |
| [docs/JSON_RESPONSES_EXAMPLES.md](docs/JSON_RESPONSES_EXAMPLES.md) | Exemples de réponses |

