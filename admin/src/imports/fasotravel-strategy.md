Voici un récapitulatif complet de la stratégie technologique et financière de **FasoTravel** telle que nous l'avons stabilisée, en nous basant sur vos sources et nos échanges.

### 1. La Vision Stratégique
L'objectif est de transformer le transport au Burkina Faso avant de s'étendre.
*   **Phase 1 (Actuelle) :** Dominer le marché routier burkinabè (Ouaga, Bobo, Koudougou, Banfora).
*   **Phase 2 :** Devenir une plateforme **multi-modale** intégrant le **ferroviaire** (Sitarail) et l'**aéronautique** (vols intérieurs).
*   **Modèle Économique :** Une commission de **5 %** prélevée sur les sociétés de transport et **100 F CFA** de frais de service payés par le client.

### 2. Choix de l'Infrastructure Technologique ("The Best-of Stack")
Pour garantir la fiabilité tout en maîtrisant les coûts, nous avons validé les partenaires suivants :
*   **Paiement : PayDunya.** Choisi pour sa maîtrise de la zone UEMOA et son système de **Split Payment** qui sépare automatiquement votre commission de l'argent de la société.
*   **SMS & OTP : Infobip.** Retenu pour sa fiabilité de réception sur les réseaux **Orange et Moov** au Burkina. Utilisé pour l'authentification (OTP) et l'envoi du billet avec **Deep Link** (lien ouvrant l'application).
*   **Hébergement (Backend) : AWS Lightsail.** Accueille vos **12 services API** (auth, trips, tickets, etc.) et prépare l'évolution vers l'Intelligence Artificielle (Phase 4).
*   **Stockage Médias : AWS S3 + CloudFront.** Pour diffuser vos **Stories promotionnelles** et billets PDF de manière fluide et rapide partout au Burkina.
*   **Localisation : Google Maps.** Utilisé uniquement pour l'affichage visuel et le suivi, avec des optimisations strictes pour réduire la facture.

### 3. Stratégie d'Optimisation des Coûts (Google Maps)
Vous avez mis en place des règles d'ingénierie pour éviter les factures imprévues :
*   **Itinéraires :** Calculés une seule fois via l'API et stockés en base de données pour tous les voyages futurs.
*   **Gares :** Aucune utilisation de Google Places ; toutes les gares (nom, coordonnées GPS) sont gérées en interne dans votre base de données.
*   **Calculs de distance/ETA :** Faits directement par votre backend via des formules mathématiques, sans appeler Google.
*   **Live Tracking :** Un seul passager émet la position GPS par bus pour tous les autres utilisateurs, limitant les requêtes.
*   **Règle des 5 km :** Le partage de position externe n'est activé qu'à l'approche de la ville d'arrivée pour des raisons de sécurité.

### 4. Projection Financière (Base : 1 000 utilisateurs actifs/mois)
Voici l'équilibre financier estimé pour le lancement :

| Poste | Détails | Estimation Coût (FCFA) |
| :--- | :--- | :--- |
| **SMS** | 2 100 messages (Auth + Billets) | ~63 000 |
| **Hébergement & Médias** | AWS (API + Stockage Stories) | ~35 000 |
| **Google Maps** | Tracking & Cartes (après crédit) | ~20 000 |
| **TOTAL CHARGES TECH** | | **~118 000** |

**Revenus pour 1 000 billets (Prix moyen 5 000 F) :**
*   **Frais de service (100 F x 1 000) :** 100 000 F
*   **Commission Société (5 % sur 5 000 000 F) :** 250 000 F
*   **REVENU TOTAL : 350 000 F**
*   **MARGE NETTE (Tech) : ~232 000 F CFA / mois.**

### 5. État Actuel du Produit (MVP fonctionnel)
L'application est prête avec :
*   **3 interfaces professionnelles :** Responsable (pilotage), Manager (terrain), Caissier (vente guichet et mode hors-ligne).
*   **Fonctionnalités avancées :** Gestion des Stories style Instagram, suivi GPS en direct, et dashboards complets avec export Excel/PDF.
*   **Multilingue :** Français, Anglais et **Mooré** pour une adoption locale maximale.

Tout est maintenant prêt pour être structuré dans votre **Business Plan**. Souhaitez-vous que je commence la rédaction par la présentation de l'opportunité de marché ou par le détail de votre modèle opérationnel ?