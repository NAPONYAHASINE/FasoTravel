# Questionnaire terrain — Visite en gare
## FasoTravel — Questions à poser aux sociétés de transport

> **But :** Valider que l'application correspond à la réalité du terrain et identifier les adaptations nécessaires.
> **Comment utiliser ce document :** Imprime-le ou ouvre-le sur ton téléphone. Pour chaque question, note la réponse directement. Les encadrés `[Notre hypothèse]` montrent ce que l'application suppose actuellement.

---

## SECTION A — Organisation de la société

### A1. Structure et hiérarchie

**A1.1** Comment votre société est-elle organisée ? Qui fait quoi ?
> `[Notre hypothèse : 3 niveaux — Responsable (patron), Manager (chef de gare), Caissier (vente de tickets)]`
- Est-ce que ces 3 rôles existent chez vous ?
- Y a-t-il d'autres rôles ? (contrôleur, chef de ligne, comptable, dispatcher, chef de parc...)
- Qui décide des prix ? Qui décide des horaires ?

**A1.2** Combien de personnes travaillent dans votre gare ?
- Combien de caissiers en même temps ?
- Est-ce que le même caissier vend pour plusieurs destinations ?
- Y a-t-il un système de rotation/shift ?

**A1.3** Qui est le "patron" de la gare ?
- Est-ce le propriétaire de la société ou un employé ?
- A-t-il plusieurs gares sous sa responsabilité ?
- Comment communique-t-il avec les autres gares ? (appel, WhatsApp, rien ?)

**A1.4** Avez-vous des succursales/branches dans d'autres villes ?
> `[Notre hypothèse : Une société peut avoir plusieurs branches, chacune liée à une gare]`
- Si oui, combien et où ?
- Chaque branche a-t-elle son propre responsable ?
- Les prix sont-ils les mêmes entre branches ou différents ?

---

### A2. Rapport avec les autres sociétés

**A2.1** Dans cette gare, y a-t-il plusieurs sociétés qui opèrent ?
> `[Notre hypothèse : Une gare peut être partagée entre plusieurs sociétés, OU chaque société a sa propre gare]`
- Chaque société a-t-elle son propre guichet ?
- Partagez-vous des infrastructures (salle d'attente, parking...) ?

**A2.2** Existe-t-il un "syndicat" ou une "association" des transporteurs qui fixe certaines règles ?
- Imposent-ils des tarifs minimums/maximums ?
- Y a-t-il des horaires imposés de départ ?
- Faut-il une autorisation/licence pour opérer une ligne ?

---

## SECTION B — Gares et stations

### B1. La gare physique

**B1.1** Comment s'appelle votre gare exactement ?
> `[Données dont on a besoin : nom, ville, adresse, coordonnées GPS]`

**B1.2** Quels services sont disponibles dans votre gare ?
> `[Notre hypothèse : amenities = wifi, toilettes, climatisation, restaurant, salle d'attente, parking]`
- Salle d'attente ? Climatisée ?
- Toilettes ?
- Restauration/buvette ?
- Parking ?
- Consigne à bagages ?
- WiFi ?
- Espace prière ?
- Quoi d'autre ?

**B1.3** Quels sont vos horaires d'ouverture ?
> `[Notre hypothèse : champ texte libre "openingHours"]`
- La gare est-elle ouverte tous les jours ?
- Fermez-vous le dimanche ? Les jours fériés ?
- Heure d'ouverture du premier guichet ?
- Heure de fermeture ?

**B1.4** Combien de véhicules peuvent stationner dans votre gare en même temps ?
> `[Notre hypothèse : champ "capacity" sur la gare]`

**B1.5** Y a-t-il des points de vente en dehors de la gare ? (agences en ville, points relais...)

---

## SECTION C — Les trajets et lignes

### C1. Organisation des lignes

**C1.1** Quelles sont vos destinations au départ de cette gare ?
> Note chaque destination avec le prix :

| Destination | Prix (FCFA) | Durée estimée | Distance (km) |
|------------|-------------|---------------|---------------|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

**C1.2** Y a-t-il des arrêts intermédiaires sur vos lignes ?
> `[Notre hypothèse : un trajet peut avoir des "segments" avec des arrêts — ex: Ouaga → Koudougou → Bobo]`
- Peut-on acheter un billet pour un arrêt intermédiaire ? (ex: Ouaga → Koudougou seulement)
- Le prix est-il proportionnel ou fixe par segment ?
- Le passager peut-il monter à un arrêt intermédiaire ?

**C1.3** Comment sont fixés les horaires de départ ?
> `[Notre hypothèse : les départs sont programmés à heures fixes]`
- Départs à heures fixes (ex: 6h, 8h, 10h...) ?
- OU départ quand le bus est plein ?
- OU un mélange des deux ?
- Qui décide de l'heure de départ ?

**C1.4** Combien de départs par jour pour chaque destination ?
- Est-ce que ça change selon le jour de la semaine ?
- Y a-t-il plus de départs les vendredis/weekends ?
- Y a-t-il des périodes de forte demande (fêtes, marchés...) ?

**C1.5** Avez-vous des trajets de nuit ?
- Si oui, y a-t-il un prix différent ?
- Des mesures de sécurité particulières ?

---

### C2. Prix et tarification

**C2.1** Comment fixez-vous vos prix ?
> `[Notre hypothèse : prix fixe par trajet, en FCFA, stocké comme entier — ex: 5000]`
- Prix fixe ou négociable ?
- Le prix change-t-il selon la saison/période ?
- Existe-t-il des catégories de prix ? (VIP, standard, économique...)
- Prix différent pour les enfants ? À partir de quel âge paient-ils plein tarif ?

**C2.2** Vos prix incluent-ils les bagages ?
> `[Notre hypothèse : champ "baggagePrice" séparé sur l'opérateur]`
- Combien de bagages gratuits par passager ?
- Prix par bagage supplémentaire ?
- Comment sont pesés/mesurés les bagages ?
- Y a-t-il un poids maximum ?

**C2.3** Accepteriez-vous de faire des promotions via l'application ?
> `[Notre hypothèse : système de promotions avec pourcentage de réduction, dates de début/fin, nombre max d'utilisations]`
- Faites-vous déjà des promotions ? Comment ?
- Seriez-vous intéressés par des réductions pour les premiers utilisateurs de l'app ?

---

## SECTION D — Les véhicules

### D1. Le parc de véhicules

**D1.1** Quels types de véhicules utilisez-vous ?

| Type | Nombre de places | Combien en avez-vous ? |
|------|-----------------|----------------------|
| Minicar/Sprinter | | |
| Bus moyen | | |
| Grand bus | | |
| Autre : | | |

> `[Notre hypothèse : un véhicule a un nombre de sièges fixe avec un plan de sièges (rangées × sièges par rangée)]`

**D1.2** Comment sont numérotés les sièges ?
- Y a-t-il une numérotation sur les sièges réels ?
- Le passager choisit-il son siège ou c'est attribué ?
- Y a-t-il des sièges "premium" (plus chers) ?

**D1.3** Quel est le plan de sièges typique ?
> `[Notre hypothèse : grille avec rangées, sièges par rangée, couloir — ex: 2+2 ou 2+3]`
- Dessinez ou décrivez la disposition :
  - Nombre de rangées ?
  - Sièges par rangée (gauche + droite) ?
  - Où est le couloir ?
  - Y a-t-il des sièges qui n'existent pas (ex: rangée du fond = 5 au lieu de 4) ?

**D1.4** Un même véhicule fait-il plusieurs allers-retours par jour ?
- Le bus revient-il le même jour ?

**D1.5** Vos véhicules ont-ils un numéro d'identification/immatriculation visible ?
> `[Notre hypothèse : champ "busNumber" sur le trajet]`

---

## SECTION E — La vente de billets

### E1. Le processus actuel

**E1.1** Comment vendez-vous les billets aujourd'hui ?
- Au guichet physique uniquement ?
- Par téléphone (réservation) ?
- Via WhatsApp ?
- Autre application/site web ?

**E1.2** Qu'est-ce que le passager reçoit quand il achète un billet ?
> `[Notre hypothèse : ticket avec code alphanumérique + QR code]`
- Un reçu papier ?
- Un ticket cartonné ?
- Rien (juste son nom sur une liste) ?
- Un numéro de siège ?

**E1.3** Peut-on réserver un billet à l'avance ?
> `[Notre hypothèse : le passager peut réserver via l'app, le siège est "tenu" pendant 10 minutes en attendant le paiement]`
- Si oui, combien de temps à l'avance ? (1 jour, 1 semaine, 1 heure ?)
- Faut-il payer pour réserver ou on paie le jour du départ ?
- Y a-t-il des annulations ? Comment ça se passe ? Remboursement ?

**E1.4** Comment vérifiez-vous les billets au moment de l'embarquement ?
- Vérification du nom ?
- Vérification d'un numéro ?
- Scan de quelque chose ?
- Pas de vérification ?

**E1.5** Les passagers peuvent-ils transférer leur billet à quelqu'un d'autre ?
> `[Notre hypothèse : oui, transfert possible pendant 24h via un token]`
- C'est possible actuellement ?
- Si oui, comment ça se passe ?
- Y a-t-il des frais de transfert ?

---

### E2. Paiements

**E2.1** Quels moyens de paiement acceptez-vous ?
> `[Notre hypothèse : Cash, Orange Money, Moov Money, Wave, Carte bancaire]`

| Moyen | Accepté ? (oui/non) | % des ventes estimé |
|-------|---------------------|-------------------|
| Espèces (cash) | | |
| Orange Money | | |
| Moov Money | | |
| Wave | | |
| Carte bancaire | | |
| Coris Money | | |
| Autre : | | |

**E2.2** Si vous acceptez le mobile money, comment ça fonctionne ?
- Le passager envoie sur un numéro commun de la société ?
- Chaque caissier a son propre numéro ?
- Utilisez-vous un compte marchand ?

**E2.3** Comment gérez-vous la caisse en fin de journée ?
> `[Notre hypothèse : le caissier fait un rapport journalier avec total cash, total mobile money, nombre de billets vendus, remboursements]`
- Qui fait le comptage ?
- Y a-t-il un pointage/versement à faire ?
- Comment sont gérés les remboursements ?

**E2.4** Seriez-vous prêts à ce que FasoTravel collecte les paiements et vous reverse votre part ?
> `[Notre hypothèse : FasoTravel prend une commission (platformFee) et reverse le reste (companyAmount) à la société]`
- Quel pourcentage de commission serait acceptable ? (5%, 10%, 15% ?)
- Préférez-vous un montant fixe par billet ?
- Tous les combien voudriez-vous être payés ? (quotidien, hebdomadaire, mensuel ?)

---

## SECTION F — Suivi et gestion en temps réel

### F1. Tracking GPS

**F1.1** Vos véhicules ont-ils un système de suivi GPS ?
> `[Notre hypothèse : on peut suivre le bus en temps réel sur une carte]`
- Si oui, lequel ? (traceur GPS intégré, boîtier externe...)
- Si non, seriez-vous intéressés par un traceur GPS sur les véhicules ?

---

### F2. Gestion des incidents

**F2.1** Quels types de problèmes rencontrez-vous le plus souvent ?
> `[Notre hypothèse : panne mécanique, retard, accident, annulation]`
- Pannes mécaniques — fréquence ?
- Retards — combien en moyenne ?
- Annulations — fréquence ?
- Accidents — procédure ?
- Autres ?

**F2.2** Comment informez-vous les passagers en cas de problème ?
- Appel individuel ?
- Pas de notification ?
- Annonce sur place ?

**F2.3** Que proposez-vous en cas d'annulation ?
- Remboursement total ?
- Transfert sur le prochain départ ?
- Rien ?

---

## SECTION G — Modèle économique

### G1. Commission et partenariat

**G1.1** Utilisez-vous déjà une plateforme de réservation en ligne ?
- Si oui, laquelle ? Combien prennent-ils ?
- Si non, pourquoi ?

**G1.2** Quel est votre chiffre d'affaires moyen par jour pour cette gare ?
- Nombre de billets vendus par jour (estimation) ?
- Recette moyenne journalière ?

**G1.3** Qu'est-ce qui vous intéresserait le plus dans une application ?
- [ ] Vendre des billets en ligne (plus de clients)
- [ ] Gérer la caisse informatiquement (moins d'erreurs)
- [ ] Suivre les véhicules en temps réel
- [ ] Avoir des statistiques (meilleurs trajets, heures de pointe...)
- [ ] Communiquer avec les passagers (notifications, promos)
- [ ] Autre : _______________

**G1.4** Paieriez-vous un abonnement mensuel OU préférez-vous une commission par billet vendu ?
- Abonnement fixe : combien max FCFA/mois ?
- Commission par billet : quel % max ?
- Gratuit avec commission uniquement sur les ventes en ligne ?

---

### G2. Application Société

**G2.1** Qui dans votre équipe utiliserait l'application société ?
> `[Notre hypothèse : le responsable pour la gestion complète, le manager pour les opérations quotidiennes, le caissier pour la vente]`
- Ont-ils des smartphones ?
- Savent-ils utiliser des applications ?
- Préfèrent-ils un ordinateur ou un téléphone ?

**G2.2** Quels rapports aimeriez-vous voir ?
- Ventes par jour/semaine/mois ?
- Performance par ligne/destination ?
- Taux de remplissage par départ ?
- Comparaison avec les mois précédents ?

---

## SECTION H — Informations spécifiques Burkina Faso

### H1. Réglementaire

**H1.1** Y a-t-il des réglementations spécifiques au transport interurbain ?
- Licence de transport requise ?
- Assurance obligatoire ? Laquelle ?
- Contrôle technique des véhicules ? Fréquence ?
- L'État impose-t-il des tarifs maximums ?

**H1.2** Existe-t-il un organisme de régulation ? (ex: DGTTM, OTRAF...)
- Faut-il une autorisation pour vendre des billets en ligne ?
- Y a-t-il des taxes spécifiques sur la vente de billets ?

---

### H2. Saisonnalité et spécificités locales

**H2.1** Quelles sont les périodes de forte affluence ?
- Fêtes religieuses (Tabaski, Ramadan, Noël...) ?
- Rentrée scolaire ?
- Jours de marché dans certaines villes ?
- Événements (SIAO, FESPACO...) ?

**H2.2** Y a-t-il des lignes saisonnières ? (ouvertes seulement certaines périodes)

**H2.3** Les routes sont-elles praticables toute l'année ?
- Certaines lignes sont-elles fermées en saison des pluies ?

---

## SECTION I — Questions bonus (si le temps le permet)

**I1.** Combien de voyageurs en moyenne par bus ?
- Est-ce que le bus part parfois à moitié vide ?
- Ou refuse-t-on des passagers par manque de places ?

**I2.** Comment gérez-vous les groupes ? (scolaires, entreprises, événements)
- Tarif de groupe ?
- Réservation de bus entier possible ?

**I3.** Les passagers voyagent-ils souvent avec des colis/marchandises ?
- Y a-t-il un service d'envoi de colis sans passager ?
- Comment est facturé ce service ?

**I4.** Avez-vous un service de navette/transport urbain ou uniquement interurbain ?

**I5.** Avez-vous une personne dédiée à la comptabilité/finance ?

---

## Notes de visite

**Société visitée :** _________________________________

**Date :** _______  **Heure :** _______

**Personne interviewée :** _________________________________

**Fonction :** _________________________________

**Téléphone de contact :** _________________________________

**Observations personnelles :**

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

**Ce qui m'a surpris / Ce que je n'avais pas prévu :**

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

---

## Après la visite — Checklist

- [ ] J'ai noté les destinations et prix réels
- [ ] J'ai compris la hiérarchie des rôles
- [ ] J'ai compris comment les sièges sont organisés
- [ ] J'ai compris le processus de vente actuel
- [ ] J'ai compris les moyens de paiement utilisés
- [ ] J'ai compris la gestion de caisse
- [ ] J'ai discuté du modèle de commission
- [ ] J'ai la liste des services/commodités de la gare
- [ ] J'ai pris des photos (gare, bus, tickets, plan de sièges)
- [ ] J'ai un contact pour revenir poser des questions

---

> **Ramène toutes les réponses et je mettrai à jour le code en conséquence. Photographie aussi les vrais billets/tickets actuels et les plans de sièges des bus — ça m'aidera à adapter l'interface.**
