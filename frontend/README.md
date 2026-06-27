# EPF Marketplace — Frontend React

Frontend de la marketplace EPF (examen CSI 3). SPA React qui consomme l'API REST
Laravel sécurisée par token Bearer, avec trois rôles : **buyer**, **seller**, **admin**.

## Stack

- React 19 + Vite 8
- React Router DOM 7 (routes protégées par authentification et par rôle)
- Axios (instance centralisée avec intercepteurs token / 401 / 403)
- React Context API (`AuthContext`, `CartContext`) pour l'état global
- React Hook Form (formulaires contrôlés + validation côté client)
- React Hot Toast (notifications)

## Prérequis

- Node.js 18+ et npm
- L'API backend Laravel `epf-marketplace` lancée (`php artisan serve`, migrations + seeders exécutés)

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` vers `.env` et renseigner l'URL **racine** de l'API (sans `/api` final) :

```bash
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8000
```

> Les services ajoutent eux-mêmes le préfixe `/api` (ex: `POST /api/auth/login`).

## Lancement

```bash
npm run dev        # serveur de développement (http://localhost:5173)
npm run build      # build de production (dossier dist/)
npm run preview    # prévisualisation du build
npm run lint       # analyse Oxlint
```

## Structure

```
src/
├── components/        # Composants réutilisables
│   ├── common/        # Layout, Navbar, PrivateRoute, RoleRoute, Loader, Pagination
│   └── products/      # ProductCard
├── contexts/          # AuthContext (auth + token), CartContext (panier persistant)
├── hooks/             # useDebounce
├── pages/             # Une page par route (auth, products, orders, seller, admin…)
├── services/          # Appels API par domaine (api.js = instance Axios)
└── utils/             # Helpers de formatage (prix, dates, libellés statuts)
```

## Fonctionnalités

- **Auth** : inscription (buyer/seller), connexion, profil (édition + avatar), déconnexion.
  Déconnexion automatique sur 401, message « pas les droits » sur 403.
- **Catalogue** : liste produits (filtres catégorie/prix, tri, pagination), détail produit
  (galerie, avis, contact vendeur), catégories, recherche globale (produits/vendeurs/catégories).
- **Acheteur** : panier persistant (serveur), commande avec coupon, suivi & annulation des
  commandes, favoris, messagerie.
- **Vendeur** : tableau de bord, gestion des produits (CRUD + upload images, promotion flash),
  commandes reçues avec mise à jour de statut.
- **Admin** : statistiques globales, gestion des utilisateurs (suspendre/réactiver),
  modération des produits, CRUD des coupons.

## Sécurité

- Le token est stocké dans `localStorage` et injecté via l'en-tête `Authorization: Bearer {token}`
  par un intercepteur Axios.
- Aucun mot de passe n'est stocké ; les entrées sont validées avant envoi.
- Les routes sensibles sont protégées par `PrivateRoute` (authentifié) et `RoleRoute` (rôle requis).

## Déploiement (Vercel)

1. Importer le dépôt sur Vercel, **Root Directory** = `frontend`.
2. Build command : `npm run build` — Output : `dist`.
3. Variable d'environnement : `VITE_API_URL` = URL publique du backend.
