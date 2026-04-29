# 🌾 VivriérPro — Plateforme de Distribution de Produits Vivriers

Plateforme logistique intelligente pour la gestion de la distribution de produits vivriers depuis un entrepôt central vers des points de distribution, avec **optimisation d'itinéraires basée sur la théorie des graphes (algorithme de Dijkstra)**.

---

## 🏗️ Stack Technique

| Technologie | Rôle |
|---|---|
| **Next.js 14** | Framework React full-stack (App Router) |
| **TypeScript** | Typage statique |
| **Prisma ORM** | Accès base de données |
| **SQLite** | Base de données (dev) / PostgreSQL (prod) |
| **D3.js** | Visualisation interactive du graphe |
| **Tailwind CSS** | Styles utilitaires |
| **Dijkstra** | Algorithme d'optimisation des itinéraires |

---

## 🚀 Installation rapide

### Prérequis
- **Node.js** >= 18.17.0
- **npm** >= 9.0.0

### Étapes

```bash
# 1. Cloner le projet
git clone <url-du-repo>
cd vivrier-platform

# 2. Installer les dépendances
npm install

# 3. Configurer l'environnement
cp .env .env.local
# Éditer .env.local si nécessaire

# 4. Initialiser la base de données
npm run db:push

# 5. Charger les données initiales
npm run db:seed

# 6. Lancer en développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 📁 Structure du projet

```
vivrier-platform/
├── prisma/
│   ├── schema.prisma        # Schéma de la BDD
│   └── seed.ts              # Données initiales
├── src/
│   ├── app/
│   │   ├── page.tsx         # Tableau de bord
│   │   ├── commandes/       # Gestion des commandes
│   │   ├── livraisons/      # Planification des tournées
│   │   ├── admin/           # Administration
│   │   └── api/             # Routes API REST
│   │       ├── points/      # CRUD points de distribution
│   │       ├── chemins/     # CRUD chemins (arêtes)
│   │       ├── commandes/   # CRUD commandes
│   │       ├── livraisons/  # Planification + Dijkstra
│   │       ├── vehicules/   # CRUD véhicules
│   │       └── graphe/      # Données graphe + chemin optimal
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── graph/
│   │   │   ├── GraphWrapper.tsx
│   │   │   └── GraphVisualization.tsx  # D3.js interactif
│   │   └── ui/
│   │       ├── StatsCard.tsx
│   │       ├── FenetreCommandeWidget.tsx
│   │       └── Toaster.tsx
│   └── lib/
│       ├── dijkstra.ts      # Algorithme + TSP glouton
│       ├── prisma.ts        # Client Prisma singleton
│       ├── utils.ts         # Utilitaires client
│       └── utils-server.ts  # Utilitaires serveur
└── package.json
```

---

## 🧠 Algorithme de Dijkstra

Le cœur de la plateforme repose sur l'algorithme de Dijkstra pour :

1. **Chemin le plus court** : depuis l'entrepôt vers un point de distribution
2. **Itinéraire optimal** : tournée multi-points avec heuristique TSP glouton
3. **Calcul du temps** : en fonction du type de véhicule et de la distance

```
Entrepôt → [Dijkstra] → Chemin optimal → Points de livraison
```

---

## ⏰ Fenêtre de commande

Les commandes ne sont acceptées que de **20h00 à 23h00**.  
- Un widget temps réel indique l'état de la fenêtre
- Les administrateurs peuvent forcer une commande hors fenêtre

---

## 🚗 Types de véhicules

| Type | Vitesse | Capacité |
|---|---|---|
| 🏍️ Moto | 40 km/h | 1 point/tournée |
| 🚐 Camionnette | 30 km/h | 3 points/tournée |
| 🚛 Camion | 25 km/h | 6 points/tournée |

---

## 🌐 API REST

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/points` | Lister les points |
| POST | `/api/points` | Créer un point |
| PATCH | `/api/points/[id]` | Modifier un point |
| DELETE | `/api/points/[id]` | Désactiver un point |
| GET | `/api/chemins` | Lister les chemins |
| POST | `/api/chemins` | Créer un chemin |
| DELETE | `/api/chemins/[id]` | Supprimer un chemin |
| GET | `/api/commandes` | Lister les commandes |
| POST | `/api/commandes` | Créer une commande |
| PATCH | `/api/commandes/[id]` | Changer le statut |
| GET | `/api/livraisons` | Lister les livraisons |
| POST | `/api/livraisons` | Planifier (Dijkstra) |
| PATCH | `/api/livraisons/[id]` | Changer le statut |
| GET | `/api/vehicules` | Lister les véhicules |
| POST | `/api/vehicules` | Ajouter un véhicule |
| GET | `/api/graphe` | Données graphe + Dijkstra |

---

## 🔧 Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run start        # Serveur de production
npm run db:push      # Synchroniser le schéma Prisma
npm run db:studio    # Interface graphique Prisma Studio
npm run db:seed      # Charger les données initiales
```

---

## 🚀 Déploiement en production

### Avec PostgreSQL (recommandé)

1. Modifier `.env` :
```
DATABASE_URL="postgresql://user:password@host:5432/vivrier"
```

2. Modifier `prisma/schema.prisma` :
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Déployer sur Vercel, Railway, ou votre serveur :
```bash
npm run build
npm run start
```

---

## 👥 Comptes par défaut (seed)

Aucun système d'authentification n'est inclus dans cette version de base.  
Pour ajouter l'auth : `npm install next-auth`

---

*Développé avec ❤️ — VivriérPro v1.0*
