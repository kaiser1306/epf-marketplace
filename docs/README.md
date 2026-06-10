# Documentation API — Marketplace EPF

Ce dossier décrit l’API REST du projet Laravel (`routes/api.php`). Les fichiers se complètent :

| Fichier | Contenu |
|--------|---------|
| [MARKETPLACE_API_ROUTES.md](./MARKETPLACE_API_ROUTES.md) | Liste des endpoints, paramètres, middlewares et comportement attendu |
| [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) | Schéma logique des tables et relations |
| [VALIDATIONS_AND_ERRORS.md](./VALIDATIONS_AND_ERRORS.md) | Règles de validation et codes HTTP usuels |
| [JSON_RESPONSES_EXAMPLES.md](./JSON_RESPONSES_EXAMPLES.md) | Exemples de payloads JSON alignés sur les contrôleurs |

## Conventions communes

- **Authentification** : [Laravel Sanctum](https://laravel.com/docs/sanctum) — en-tête `Authorization: Bearer {token}`. Le champ `token` renvoyé à l’inscription / connexion est un **jeton en texte clair** (pas un JWT).
- **Préfixe** : toutes les routes sont sous `/api` (ex. `GET /api/products`).
- **Format** : JSON pour les corps de requête et les réponses (sauf uploads `multipart/form-data` pour images).
- **Validation** : en cas d’échec, Laravel renvoie typiquement **422** avec `message` et `errors` (détails par champ).
- **Comptes suspendus** : après connexion, les routes protégées par le middleware `not_suspended` répondent **403** si `suspended_at` est renseigné (la connexion elle-même est déjà refusée pour un compte suspendu).
- **Rôles** : `buyer`, `seller`, `admin`. La création de produit exige `seller` ; les routes `admin/*` exigent `admin`.

Pour installer le projet et lancer les tests, voir le [README à la racine](../README.md).
