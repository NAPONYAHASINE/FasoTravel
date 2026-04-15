# Guide de mise en production — FasoTravel Backend

> **Date :** 8 avril 2026
> **Statut actuel :** 29 suites de tests, 431 tests passent, TSC 0 erreurs, ESLint 0 erreurs
> **Ce document liste TOUT ce que toi (le développeur) dois faire manuellement** avant de lancer en production.

---

## Table des matières

1. [Résumé rapide — Checklist](#1-résumé-rapide--checklist)
2. [CRITIQUE — Sécurité & Secrets](#2-critique--sécurité--secrets)
3. [CRITIQUE — Base de données](#3-critique--base-de-données)
4. [CRITIQUE — Services externes à configurer](#4-critique--services-externes-à-configurer)
5. [CRITIQUE — CORS & Sécurité HTTP](#5-critique--cors--sécurité-http)
6. [HAUTE PRIORITÉ — Déploiement](#6-haute-priorité--déploiement)
7. [HAUTE PRIORITÉ — Fonctionnalités à compléter](#7-haute-priorité--fonctionnalités-à-compléter)
8. [MOYENNE PRIORITÉ — Hardening production](#8-moyenne-priorité--hardening-production)
9. [BASSE PRIORITÉ — Améliorations futures](#9-basse-priorité--améliorations-futures)

---

## 1. Résumé rapide — Checklist

### CRITIQUE (bloque le lancement) :
- [ ] Changer les secrets JWT (actuellement des valeurs dev)
- [ ] Changer le mot de passe PostgreSQL
- [ ] Désactiver `DB_SYNCHRONIZE` (mettre à `false`)
- [ ] Créer un compte PaydunYa et obtenir les clés API
- [ ] Créer une clé API Google Maps
- [ ] Mettre à jour les origines CORS avec les URLs de production
- [ ] Installer et configurer Helmet.js pour les headers de sécurité
- [ ] Implémenter la vérification de signature webhook PaydunYa

### HAUTE PRIORITÉ (première semaine après lancement) :
- [ ] Créer les migrations TypeORM (remplacer auto-sync)
- [ ] Créer un Dockerfile
- [ ] Configurer Firebase pour les notifications push
- [ ] Configurer un stockage S3 pour les fichiers (remplacer le base64)
- [ ] Ajouter un endpoint `/health`
- [ ] Configurer un pipeline CI/CD

### MOYENNE PRIORITÉ (premier mois) :
- [ ] Configurer Infobip (SMS)
- [ ] Configurer SendGrid (email)
- [ ] Configurer Redis pour le tracking en temps réel
- [ ] Monitoring & alertes (Sentry, etc.)

---

## 2. CRITIQUE — Sécurité & Secrets

### 2.1 Générer de nouveaux secrets JWT

**Fichier concerné :** `backend/.env`

Les secrets actuels sont des valeurs de développement. En production, il faut des secrets cryptographiquement aléatoires.

**Comment faire :**

```bash
# Ouvre un terminal et exécute ces 2 commandes :
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copie les résultats dans ton fichier `.env` :
```env
JWT_SECRET=<la_valeur_générée_ici>
JWT_REFRESH_SECRET=<la_valeur_générée_ici>
```

> **Important :** Ne commite JAMAIS le fichier `.env` dans Git. Il est déjà dans `.gitignore`.

### 2.2 Changer le mot de passe PostgreSQL

**Fichiers concernés :** `backend/.env` et `backend/docker-compose.yml`

```env
# Dans .env — utilise un mot de passe fort
DB_PASSWORD=un_mot_de_passe_très_long_et_complexe_ici_2026!
```

Mets le même dans `docker-compose.yml` ligne 7, ou mieux : utilise une variable d'environnement :
```yaml
environment:
  POSTGRES_DB: fasotravel
  POSTGRES_USER: fasotravel
  POSTGRES_PASSWORD: ${DB_PASSWORD}
```

---

## 3. CRITIQUE — Base de données

### 3.1 Désactiver la synchronisation automatique

**Fichier :** `backend/.env`

```env
# ⚠️ En PRODUCTION, ces deux lignes DOIVENT être :
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

**Pourquoi ?** `synchronize: true` modifie automatiquement le schéma de la base à chaque démarrage. En production, ça peut **détruire des données**.

### 3.2 Créer les migrations TypeORM

Puisqu'on désactive `synchronize`, il faut créer des migrations pour initialiser le schéma.

**Comment faire :**

```bash
cd c:\FasoTravel\backend

# 1. Assure-toi que la DB tourne avec synchronize=true UNE DERNIÈRE FOIS
docker compose up -d
npm run start:dev
# → Ça crée toutes les 48 tables

# 2. Arrête le serveur, puis génère la migration initiale
npx typeorm migration:generate -d dist/config/database.config.js src/database/migrations/InitialSchema

# 3. Mets DB_SYNCHRONIZE=false dans .env

# 4. Désormais, pour appliquer les migrations :
npx typeorm migration:run -d dist/config/database.config.js
```

> **Alternative simple :** Si tu n'es pas encore prêt pour les migrations, laisse `synchronize: true` en staging mais **JAMAIS en production**.

### 3.3 Supprimer Adminer en production

**Fichier :** `backend/docker-compose.yml`

Le service `adminer` (port 8080) expose un accès direct à ta base. Supprime-le ou commente-le dans le `docker-compose.yml` de production.

### 3.4 Sauvegardes automatiques

Configure un cron ou un service de backup pour PostgreSQL :

```bash
# Exemple de sauvegarde quotidienne (ajoute dans un cron)
pg_dump -h localhost -p 5450 -U fasotravel -d fasotravel > backup_$(date +%Y%m%d).sql
```

---

## 4. CRITIQUE — Services externes à configurer

### 4.1 PaydunYa (Paiements) — OBLIGATOIRE

C'est ton fournisseur de paiement. Sans lui, aucun paiement ne fonctionne.

**Étapes :**

1. **Crée un compte** sur [PaydunYa.com](https://paydunya.com)
2. **Crée une application** dans le dashboard PaydunYa
3. **Récupère les 3 clés** (Master Key, Private Key, Token)
4. **Mets-les dans `.env`** :
   ```env
   PAYDUNYA_MASTER_KEY=ta_master_key_ici
   PAYDUNYA_PRIVATE_KEY=ta_private_key_ici
   PAYDUNYA_TOKEN=ton_token_ici
   PAYDUNYA_MODE=test   # Garde "test" d'abord, puis passe à "live"
   ```
5. **Configure le webhook** dans le dashboard PaydunYa :
   - URL du webhook : `https://ton-api.fasotravel.bf/api/payments/webhook`
6. **Teste un paiement** de bout en bout en mode `test`
7. **Passe en `live`** quand tout est validé :
   ```env
   PAYDUNYA_MODE=live
   ```

**⚠️ IMPORTANT — Vérification de signature :**
Le fichier `backend/src/payments/payments.controller.ts` (ligne 66) contient un commentaire :
```
// In production: verify signature against PAYDUNYA_MASTER_KEY
```
**Tu dois me demander d'implémenter cette vérification avant de passer en production.**
C'est une faille de sécurité critique si quelqu'un envoie de faux webhooks.

### 4.2 Google Maps API — OBLIGATOIRE

Utilisé pour le tracking GPS et le calcul d'itinéraires.

**Étapes :**

1. Va sur [Google Cloud Console](https://console.cloud.google.com)
2. Crée un projet (ou utilise un existant)
3. Active ces APIs :
   - **Directions API**
   - **Distance Matrix API**
   - **Maps JavaScript API** (pour les frontends)
4. Va dans **Identifiants** → **Créer un identifiant** → **Clé API**
5. **Restreins la clé** :
   - Par adresse IP (backend uniquement)
   - Par référent HTTP (pour les frontends)
6. Mets dans `.env` :
   ```env
   GOOGLE_MAPS_API_KEY=AIza...ta_clé_ici
   ```

> **Note :** Sans cette clé, le backend utilise un calcul Haversine (vol d'oiseau). Ça marche mais c'est moins précis.

### 4.3 Firebase (Notifications push) — HAUTE PRIORITÉ

**Étapes :**

1. Va sur [Firebase Console](https://console.firebase.google.com)
2. Crée un projet Firebase
3. Va dans **Paramètres du projet** → **Comptes de service**
4. Clique **Générer une nouvelle clé privée** → Télécharge le JSON
5. Mets dans `.env` :
   ```env
   FIREBASE_PROJECT_ID=ton-projet-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@ton-projet.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

> **Note :** Le service de push notifications n'est pas encore implémenté dans le code. Les variables sont prêtes, mais il faudra me demander de coder le `NotificationPushService` quand tu auras le projet Firebase.

### 4.4 AWS S3 & CloudFront (Stockage de fichiers) — HAUTE PRIORITÉ

Actuellement, les logos d'opérateurs et les stories sont stockés en **base64 dans la base de données**. En production, il faut utiliser S3.

**Étapes :**

1. Connecte-toi à [AWS Console](https://console.aws.amazon.com)
2. **Crée un bucket S3** :
   - Nom : `fasotravel-uploads` (ou similaire)
   - Région : `eu-west-3` (Paris) ou `af-south-1` (Le Cap)
   - Bloque l'accès public (on utilisera CloudFront)
3. **Crée une distribution CloudFront** pointant vers le bucket
4. **Crée un utilisateur IAM** avec la politique :
   ```json
   {
     "Effect": "Allow",
     "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
     "Resource": "arn:aws:s3:::fasotravel-uploads/*"
   }
   ```
5. **Mets dans `.env`** :
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=eu-west-3
   AWS_S3_BUCKET=fasotravel-uploads
   AWS_CLOUDFRONT_URL=https://dxxxxx.cloudfront.net
   ```
6. **Demande-moi de coder le service S3 upload** — les fichiers concernés :
   - `backend/src/operators/operators.service.ts` (ligne 338 : stockage base64 → S3)
   - `backend/src/stories/stories.service.ts` (ligne 217 : pré-signés S3)

### 4.5 Infobip (SMS) — MOYENNE PRIORITÉ

Pour envoyer des SMS aux passagers (incidents, confirmations...).

1. Crée un compte sur [Infobip](https://www.infobip.com)
2. Récupère ta clé API et l'URL de base
3. Mets dans `.env` :
   ```env
   INFOBIP_API_KEY=ta_clé
   INFOBIP_BASE_URL=https://xxx.api.infobip.com
   ```

### 4.6 SendGrid (Email) — MOYENNE PRIORITÉ

Pour envoyer des emails transactionnels.

1. Crée un compte sur [SendGrid](https://sendgrid.com)
2. Vérifie ton domaine d'envoi (`fasotravel.bf` ou similaire)
3. Crée une clé API
4. Mets dans `.env` :
   ```env
   SENDGRID_API_KEY=SG.ta_clé
   SENDGRID_FROM_EMAIL=noreply@fasotravel.bf
   ```

---

## 5. CRITIQUE — CORS & Sécurité HTTP

### 5.1 Mettre à jour les origines CORS

**Fichier :** `backend/src/main.ts` (ligne 19)

Actuellement, les origines sont `localhost`. Tu dois décider des URLs de production :

| Frontend | URL actuelle | URL production (exemple) |
|----------|-------------|--------------------------|
| Mobile | `http://localhost:3000` | `https://mobile.fasotravel.bf` |
| Societe | `http://localhost:3001` | `https://societe.fasotravel.bf` |
| Admin | `http://localhost:3002` | `https://admin.fasotravel.bf` |

**Quand tu auras les URLs :** Dis-moi et je mettrai à jour le fichier `main.ts`.

### 5.2 Installer Helmet.js

Helmet ajoute des headers de sécurité HTTP (X-Frame-Options, CSP, HSTS...).

```bash
cd c:\FasoTravel\backend
npm install helmet
```

**Ensuite, dis-moi et je l'ajouterai dans `main.ts`.**

### 5.3 Certificat SSL/TLS

Le backend DOIT être accessible en HTTPS en production. Options :

- **Let's Encrypt** (gratuit) — si tu gères le serveur toi-même
- **AWS Certificate Manager** — si tu déploies sur AWS
- **Cloudflare** — proxy SSL gratuit devant ton serveur

---

## 6. HAUTE PRIORITÉ — Déploiement

### 6.1 Créer un Dockerfile

Dis-moi quand tu es prêt et je créerai :
- `backend/Dockerfile`
- `backend/.dockerignore`

### 6.2 La commande de build

```bash
cd c:\FasoTravel\backend
npm run build          # Compile en JS dans dist/
npm run start:prod     # Lance en production
```

### 6.3 Pipeline CI/CD

Options recommandées :
- **GitHub Actions** (si ton repo est sur GitHub)
- **GitLab CI** (si ton repo est sur GitLab)

Le pipeline idéal :
1. `npm ci` → installe les dépendances
2. `npm run lint` → vérifie le code
3. `npm test` → lance les 431 tests
4. `npm run build` → compile
5. Déploie sur le serveur

**Dis-moi quel service tu utilises et je créerai le fichier de pipeline.**

### 6.4 Endpoint de santé

Le backend n'a pas d'endpoint `/health`. C'est nécessaire pour :
- Les load balancers (AWS ALB, nginx, etc.)
- Le monitoring
- Docker health checks

**Dis-moi et je l'ajouterai.**

---

## 7. HAUTE PRIORITÉ — Fonctionnalités à compléter

Ces éléments sont codés avec des **placeholders** ou **TODO** dans le code :

| Fonctionnalité | Fichier | Ce qui manque |
|---|---|---|
| **Webhook PaydunYa signature** | `payments/payments.controller.ts:66` | Vérification de la signature HMAC |
| **Upload fichiers S3** | `operators/operators.service.ts:338` | Actuellement stocke en base64, doit utiliser S3 |
| **Stories media upload** | `stories/stories.service.ts:217` | Doit retourner des URLs pré-signées S3 |
| **Redis pour tracking** | `tracking/tracking.service.ts:70` | Utilise une Map en mémoire, doit migrer vers Redis |
| **Push notifications** | Non implémenté | Le service Firebase n'existe pas encore |
| **SMS service** | Non implémenté | L'envoi de SMS via Infobip n'est pas codé |

**Pour chacun de ces éléments, dis-moi quand tu as configuré le service externe correspondant et je coderai l'implémentation.**

---

## 8. MOYENNE PRIORITÉ — Hardening production

### 8.1 Logging structuré

Le backend utilise `console.log` / NestJS Logger. Pour la production, passe à un logger structuré (JSON) avec Winston ou Pino :

```bash
npm install nestjs-pino pino pino-pretty
```

### 8.2 Monitoring & erreur tracking

Installe Sentry pour capturer les erreurs en production :

```bash
npm install @sentry/nestjs
```

### 8.3 Rate limiting avancé

Le backend a un throttle global (100 requêtes/60s). En production :
- Rate limit par IP
- Rate limit par endpoint (plus strict sur `/auth/login`)
- Rate limit par clé API (pour l'External API)

### 8.4 Redis en production

Actuellement Redis est configuré mais peu utilisé. Pour la production :
- Active l'authentification Redis (`requirepass`)
- Utilise un service managé (AWS ElastiCache, Redis Cloud)
- Configure la persistance (AOF)

---

## 9. BASSE PRIORITÉ — Améliorations futures

- [ ] Documentation API complète (Swagger est déjà en place sur `/api/docs`)
- [ ] Tests d'intégration end-to-end (2 fichiers existent dans `test/`)
- [ ] Feature flags management UI
- [ ] Audit de performance (requêtes N+1, index DB)
- [ ] Internationalisation des messages d'erreur (fr/en/moore)
- [ ] Backup automatisé avec conservation 30 jours

---

## Récapitulatif — Ce que TU fais vs Ce que JE fais

| Toi (actions manuelles) | Moi (code) |
|---|---|
| Créer les comptes : PaydunYa, Google Cloud, Firebase, AWS, Infobip, SendGrid | Implémenter le service S3 upload |
| Obtenir et mettre les clés API dans `.env` | Implémenter la vérification signature webhook |
| Décider des URLs de production | Mettre à jour CORS dans main.ts |
| Acheter/configurer le nom de domaine | Créer le Dockerfile |
| Configurer le certificat SSL | Créer le pipeline CI/CD |
| Configurer le serveur de production | Ajouter Helmet.js |
| Mettre `DB_SYNCHRONIZE=false` | Créer les migrations TypeORM |
| Générer les secrets JWT | Implémenter le push notification service |
| Configurer les backups DB | Migrer le tracking vers Redis |
| Choisir le fournisseur de hosting | Ajouter l'endpoint /health |

---

**Quand tu es prêt avec un ou plusieurs de ces points, dis-moi et on avance ensemble.**
