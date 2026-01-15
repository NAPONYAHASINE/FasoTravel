# 📖 Guide d'Utilisation - TransportBF Dashboard

## 🚀 Démarrage Rapide

### Se Connecter

L'application utilise un système d'authentification mock. Pour vous connecter, utilisez n'importe quel email contenant le rôle souhaité :

**Responsable Société** :
- Email : `responsable@tsr.bf`
- Password : n'importe quoi
- Accès : Vue globale multi-gares

**Manager de Gare** :
- Email : `manager@tsr.bf`
- Password : n'importe quoi
- Accès : Gare de Ouagadougou uniquement

**Caissier** :
- Email : `caissier@tsr.bf`
- Password : n'importe quoi
- Accès : Gare de Ouagadougou + ses propres transactions

---

## 🔴 Guide RESPONSABLE

### 1. Dashboard (Page d'accueil)

**Ce que vous voyez** :
- 📊 4 stats principales (départs actifs, prochains départs, taux remplissage, revenus)
- 📈 Graphique ventes 7 jours (Online vs Guichets)
- 🏢 État des gares (online/offline, ventes, cars)
- ⚠️ Incidents actifs

**Actions possibles** :
- Cliquer sur une gare → Navigue vers Stations
- Cliquer "Exporter" → Télécharge CSV des ventes
- Cliquer "Voir toutes les gares" → Navigue vers Stations
- Cliquer "Voir tout" sur trajets → Navigue vers Traffic

### 2. Gestion du Trafic

**Voir les départs** :
- 4 onglets : En route / Programmés / Terminés / Annulés
- Chaque carte affiche : trajet, horaire, bus, occupancy
- Barre de progression colorée (rouge < 50%, jaune 50-80%, vert > 80%)

**Ajouter un départ** :
1. Cliquer "Nouveau départ"
2. Sélectionner une route
3. Entrer le numéro de bus (ex: BF-1234-OG)
4. Choisir date et heure de départ
5. Définir nombre de places (défaut: 45)
6. Cliquer "Créer le départ"

**Gérer un départ** :
- Départ programmé → "Démarrer embarquement"
- En embarquement → "Marquer comme parti"
- Parti → "Marquer comme arrivé"
- Programmé → "Annuler" (avec confirmation)

### 3. Gares

**Voir les gares** :
- Liste avec nom, ville, région, adresse, téléphone
- Manager affecté si existant
- Statut (Active/Inactive)

**Ajouter une gare** :
1. Cliquer "Nouvelle gare"
2. Remplir : nom, ville, région, adresse, téléphone
3. Optionnel : Affecter un manager
4. Choisir statut
5. Cliquer "Créer la gare"

**Modifier/Supprimer** :
- Cliquer "Modifier" sur une carte
- Ou cliquer l'icône poubelle pour supprimer

### 4. Routes

**Voir les routes** :
- Cartes avec : départ → arrivée
- Distance (km), Durée, Prix de base
- Description si renseignée
- Statut (Active/Inactive)

**Ajouter une route** :
1. Cliquer "Nouvelle route"
2. Entrer : Départ, Arrivée
3. Entrer : Distance (km), Durée (min), Prix (FCFA)
4. Optionnel : Description
5. Choisir statut
6. Cliquer "Créer la route"

**Modifier/Supprimer** :
- Cliquer "Modifier"
- Ou icône poubelle pour supprimer

### 5. Managers

**Voir les managers** :
- Nom, email, téléphone
- Gare affectée
- Date d'embauche
- Statut (Actif/Inactif)

**Ajouter un manager** :
1. Cliquer "Nouveau manager"
2. Remplir : nom, email, téléphone
3. Sélectionner une gare
4. Choisir statut
5. Cliquer "Créer le manager"

---

## 🟡 Guide MANAGER

### 1. Dashboard (Page d'accueil)

**Ce que vous voyez** :
- 👥 Caissiers actifs (qui ont vendu aujourd'hui)
- 💰 Revenus du jour de votre gare
- 🚌 Départs actifs de votre gare
- 🎫 Billets vendus aujourd'hui

**Sections** :
- **Performance des caissiers** : Ventes et caisse par caissier
- **Prochains départs** : 4 prochaines heures
- **Actions rapides** : Raccourcis vers pages principales

---

## 🟢 Guide CAISSIER

### 1. Dashboard (Page d'accueil)

**Ce que vous voyez** :
- 💵 VOS ventes du jour
- 🎫 VOS billets vendus
- 💰 VOTRE solde de caisse
- 🚌 Prochains départs disponibles

**Ventes récentes** :
- Vos 5 dernières ventes
- Nom passager, trajet, prix, heure

**Actions rapides** :
- Vendre un billet
- Gérer la caisse
- Rembourser

### 2. Vente de Billets ⭐ IMPORTANT

**Étape par étape** :

**1. Rechercher un trajet**
- Taper une destination dans la barre de recherche
- Ou voir la liste complète
- Cliquer sur le trajet souhaité

**2. Sélectionner les sièges**
- Grille interactive A1, A2, B1, B2...
- Gris foncé = occupé (non cliquable)
- Gris clair = disponible
- Orange = sélectionné
- Cliquer pour sélectionner/désélectionner
- Vous pouvez sélectionner plusieurs sièges

**3. Informations passager**
- Entrer le nom complet
- Entrer le téléphone
- Choisir le mode de paiement :
  - 💵 Espèces
  - 📱 Mobile Money
  - 💳 Carte bancaire
- Vérifier le récapitulatif

**4. Valider**
- Cliquer "Valider la vente"
- Vérifier les infos dans le popup
- Cliquer "Confirmer et imprimer"
- ✅ Billet(s) créé(s)
- ✅ Transaction(s) enregistrée(s)
- ✅ Places mises à jour
- ✅ Simulation d'impression

### 3. Gestion de Caisse

**Voir votre caisse** :
- **Solde actuel** : Grosse carte en haut
- Ventes, Remboursements, Dépôts, Retraits
- Répartition par mode de paiement
- Liste complète des transactions

**Faire un dépôt** :
1. Cliquer "Dépôt"
2. Entrer le montant
3. Optionnel : Description (ex: "Dépôt initial de journée")
4. Cliquer "Enregistrer le dépôt"
5. ✅ Solde augmenté

**Faire un retrait** :
1. Cliquer "Retrait"
2. Voir le solde disponible
3. Entrer le montant (≤ solde)
4. Optionnel : Description (ex: "Remise en banque")
5. Cliquer "Enregistrer le retrait"
6. ✅ Solde diminué

### 4. Remboursements

**Voir les billets remboursables** :
- Seulement VOS billets
- Seulement les billets VALIDES
- Seulement pour trajets FUTURS (non partis)

**Rechercher** :
- Par nom de passager
- Par téléphone
- Par ID de billet
- Par trajet

**Rembourser un billet** :
1. Trouver le billet dans la liste
2. Cliquer "Rembourser ce billet"
3. Entrer la RAISON (obligatoire)
4. Vérifier les infos
5. Confirmer
6. ✅ Billet remboursé
7. ✅ Place libérée
8. ✅ Transaction de remboursement créée
9. ✅ Votre caisse diminuée

### 5. Historique

**Filtrer par période** :
- Aujourd'hui
- 7 derniers jours
- 30 derniers jours

**Voir les stats** :
- Ventes (nombre + montant)
- Remboursements
- Dépôts
- Retraits
- **Résultat net** (calcul automatique)

**Exporter** :
- Cliquer "Exporter"
- Fichier CSV téléchargé
- Nom : `historique-[période]-[date].csv`
- Toutes les colonnes incluses

**Lire l'historique** :
- Chaque transaction avec :
  - Type (icône + couleur)
  - Description
  - Mode de paiement
  - Montant (+ ou -)
  - Date et heure précises

---

## 💡 Astuces et Conseils

### Pour TOUS les Rôles

**Thème Sombre/Clair** :
- Icône lune/soleil en haut à droite
- Préférence sauvegardée dans le navigateur

**Navigation** :
- Menu latéral à gauche
- Logo en haut → Retour dashboard
- Icône profil → Déconnexion

**Notifications** :
- Toast en haut à droite
- Vert = Succès
- Rouge = Erreur
- Fermeture auto après 3-5s

### Pour les CAISSIERS

**Bon workflow de vente** :
1. Matin : Faire un dépôt (fond de caisse)
2. Vendre les billets au fur et à mesure
3. Rembourser si nécessaire
4. Soir : Vérifier l'historique
5. Soir : Faire un retrait (remise en banque)
6. Export de l'historique

**Éviter les erreurs** :
- Toujours vérifier le nom du passager
- Double-check le numéro de siège
- Confirmer le mode de paiement
- Ne rembourser que si vraiment nécessaire
- Toujours mettre une raison au remboursement

### Pour les MANAGERS

**Surveillance quotidienne** :
- Vérifier les caissiers actifs
- Surveiller les revenus vs objectifs
- S'assurer que les départs ont lieu
- Vérifier les soldes de caisse

### Pour les RESPONSABLES

**Gestion stratégique** :
- Surveiller toutes les gares
- Créer les routes nécessaires
- Affecter les managers
- Suivre les tendances (graphique 7j)
- Exporter les données régulièrement

---

## 🐛 Problèmes Connus et Solutions

### "Je ne vois pas certaines données"
➡️ **Normal** : Vous voyez uniquement ce qui concerne votre rôle et votre gare (sauf Responsable)

### "Le billet n'apparaît pas dans remboursements"
➡️ **Vérifier** :
- Le billet a été vendu par VOUS
- Le billet est VALIDE (pas déjà utilisé/remboursé)
- Le départ n'a PAS encore eu lieu

### "Mon solde de caisse ne correspond pas"
➡️ **Vérifier l'historique** :
- Toutes les transactions sont listées
- Ventes et dépôts = +
- Remboursements et retraits = -

### "Les sièges occupés ne sont pas corrects"
➡️ **C'est dynamique** : Calculé en temps réel selon les billets vendus

---

## 📞 Support

Pour toute question ou problème :
1. Consultez ce guide
2. Vérifiez `/IMPLEMENTATION_SUMMARY.md` pour les détails techniques
3. Consultez `/AUDIT_PROGRESS.md` pour voir ce qui est implémenté

---

**Bonne utilisation de TransportBF Dashboard ! 🚌✨**
