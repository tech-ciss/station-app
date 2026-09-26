# YELY Station — application caissier

Application mobile des caissiers des stations partenaires YELY. Elle permet d’ouvrir une session sur une pompe, d’identifier un chauffeur, d’enregistrer un plein avec son justificatif et de suivre l’activité du service.

Le projet utilise Expo SDK 54, React Native 0.81, Expo Router et TypeScript.

## Fonctionnalités

- connexion avec code station, téléphone ivoirien et PIN à 4 chiffres ;
- restauration de session et renouvellement automatique de l’access token ;
- sélection d’une pompe libre et ouverture d’une session de travail ;
- scan du QR chauffeur avec saisie manuelle de secours ;
- saisie du carburant, du montant et du volume ;
- photo justificative obligatoire de la pompe ;
- analyse facultative de la photo par un service IA ;
- upload du justificatif et création de la transaction ;
- historique, détail et statistiques des transactions ;
- fermeture de session et changement de pompe ;
- persistance locale et file de transactions à synchroniser.

## Stack technique

| Domaine | Technologie |
| --- | --- |
| Application | Expo 54, React Native 0.81, React 19 |
| Navigation | Expo Router 6 et routes protégées |
| État local | Zustand |
| Persistance | react-native-mmkv |
| API | Axios et TanStack Query |
| Interface | NativeWind et Tailwind CSS |
| Caméra | expo-camera et expo-image-picker |
| Build | EAS Build |

## Prérequis

- Node.js LTS et npm ;
- un backend YELY accessible depuis l’appareil ;
- Android Studio pour un émulateur Android ;
- macOS et Xcode pour le simulateur iOS ;
- un compte Expo pour les builds EAS.

Le projet utilise MMKV, qui est un module natif. Pour un développement fiable, privilégier un **development build** plutôt qu’Expo Go.

## Installation

Depuis la racine du dépôt :

```bash
cd mobile/yely-cashier-mobile
npm ci
```

Créer un fichier `.env.local` :

```env
EXPO_PUBLIC_API_URL=http://ADRESSE_DU_BACKEND:8000/api/v1

# Analyse IA facultative
EXPO_PUBLIC_PUMP_PHOTO_AI_URL=
EXPO_PUBLIC_PUMP_PHOTO_AI_KEY=
EXPO_PUBLIC_PUMP_PHOTO_AI_FIELD=file
EXPO_PUBLIC_PUMP_PHOTO_AI_LAYOUT=auto
```

`EXPO_PUBLIC_API_URL` doit contenir le préfixe `/api/v1`.

> Important : sans cette variable, l’application utilise `https://api.yely.tech/api/v1`. Toujours la définir en développement pour ne pas envoyer accidentellement des données vers la production.

Les variables `EXPO_PUBLIC_*` sont intégrées au bundle. Ne jamais y placer un secret sensible. Pour l’IA de production, préférer un proxy backend ou un jeton public strictement limité.

### Adresse du backend

| Environnement | Exemple |
| --- | --- |
| Émulateur Android | `http://10.0.2.2:8000/api/v1` |
| Simulateur iOS | `http://127.0.0.1:8000/api/v1` |
| Téléphone physique | `http://192.168.1.20:8000/api/v1` |
| Production | `https://api.yely.tech/api/v1` |

Sur un téléphone physique, le téléphone et l’ordinateur doivent être sur le même réseau. Le backend doit écouter sur une interface accessible et autoriser le client dans sa configuration CORS.

Redémarrer Metro après toute modification de l’environnement.

## Lancement

```bash
# Démarrer Metro
npm start

# Android
npm run android

# iOS — macOS uniquement
npm run ios

# Web — surtout utile pour vérifier l’interface
npm run web
```

La caméra, les permissions et MMKV doivent être testés sur Android ou iOS. Le rendu web ne remplace pas une recette sur appareil.

Pour vider le cache Metro :

```bash
npx expo start --clear
```

## Development build et EAS

```bash
# Connexion Expo
npx eas-cli login

# Build de développement
npx eas-cli build --platform android --profile development

# APK interne de recette
npx eas-cli build --platform android --profile preview

# Build de production
npx eas-cli build --platform android --profile production
```

Profils définis dans `eas.json` :

- `development` : development client distribué en interne ;
- `preview` : APK interne lié à l’environnement EAS `preview` ;
- `production` : build de publication avec version auto-incrémentée.

Identifiants natifs :

- Android : `ci.yely.station` ;
- iOS : `ci.yely.station` ;
- deep link : `yely-station`.

## Parcours métier

1. Le caissier saisit le code station, son numéro et son PIN.
2. L’application vérifie que le compte possède le rôle `CASHIER`.
3. Une éventuelle session ouverte est restaurée depuis le backend.
4. Sans session active, le caissier sélectionne une pompe libre.
5. Il scanne le QR d’un chauffeur ou saisit son code manuellement.
6. Il vérifie le chauffeur puis saisit carburant, montant et litres.
7. Il prend une photo justificative.
8. Si l’IA est configurée, les valeurs reconnues sont proposées mais restent à vérifier.
9. La photo est uploadée, puis la transaction est créée.
10. Le caissier retrouve la transaction dans le succès, le service et l’historique.
11. Il peut fermer le service ou changer de pompe.

Navigation protégée :

```text
Non authentifié
    → Connexion

Authentifié, sans session active
    → Sélection de pompe

Authentifié, avec session active
    → Scan → Confirmation → Succès
    → Service / Historique / Profil
```

## Endpoints backend

| Usage | Méthode et route |
| --- | --- |
| Connexion | `POST /auth/station/cashier/login` |
| Refresh token | `POST /auth/refresh` |
| Profil | `GET /auth/me` |
| Pompes | `GET /stations/me/:stationId/pumps` |
| Session courante | `GET /stations/me/work-sessions/current` |
| Ouvrir une session | `POST /stations/me/work-sessions/start` |
| Fermer une session | `POST /stations/me/work-sessions/:sessionId/close` |
| Identifier un chauffeur | `GET /drivers/resolve-by-qr/:qrCodeToken` |
| Uploader une photo | `POST /uploads/pump-photo` |
| Créer une transaction | `POST /transactions` |
| Transactions du caissier | `GET /cashiers/me/transactions` |
| Détail d’une transaction | Lecture depuis le store local persisté |

Ces routes sont relatives à `EXPO_PUBLIC_API_URL`. Le helper `fetchTransactionById` existe dans le client API, mais l’écran de détail mobile lit actuellement la transaction dans le store local persisté.

Une photo peut être retournée sous forme de chemin relatif comme `/uploads/photo.jpg`. L’application utilise alors l’origine de l’API, sans `/api/v1` :

```text
https://api.yely.tech/uploads/photo.jpg
```

## Authentification et stockage

- l’access token est ajouté aux requêtes Axios ;
- un `401` déclenche une tentative de refresh partagée entre les requêtes concurrentes ;
- si le refresh échoue, la session locale est supprimée ;
- l’authentification, la pompe active et les transactions sont persistées avec MMKV ;
- seuls les utilisateurs `CASHIER` sont acceptés.

Ne jamais journaliser les tokens, le PIN, un QR complet ou une photo en base64.

## Synchronisation hors ligne

Si la création distante échoue, la transaction reste localement en `LOCAL_PENDING`. La file prévoit :

- les statuts `LOCAL_PENDING`, `SYNCING`, `FAILED` et `SYNCED` ;
- une reprise séquentielle ;
- cinq tentatives maximum par transaction ;
- la date de la dernière tentative.

### Limite actuelle

La connectivité utilise encore un état simulé en mémoire via `setMockOnline` et n’est pas reliée à NetInfo. La file et l’auto-synchronisation existent, mais la détection réseau réelle doit être branchée avant de qualifier le mode hors ligne pour la production.

## Structure

```text
app/                         Routes Expo Router
  (auth)/                    Connexion
  (session)/                 Pompe, scan, confirmation et succès
  (tabs)/                    Service, historique et profil
src/
  components/                UI et layouts partagés
  features/
    auth/                    Authentification caissier
    offline/                 File de synchronisation
    qr-scan/                 Caméra et identification chauffeur
    station-session/         Pompes et sessions de travail
    transactions/            Saisie, photo et historique
  hooks/                     Bootstrap, navigation et single-flight
  navigation/                Règles d’accès aux routes
  services/                  API, stockage et query client
  store/                     Stores Zustand persistés
  theme/                     Styles et design tokens
  types/                     Modèles TypeScript
tests/                       Tests Node locaux
```

## Qualité et tests

```bash
npm run typecheck
npm test
```

La suite couvre notamment :

- les gardes de navigation ;
- la protection contre les doubles soumissions ;
- la restauration de l’affectation station ;
- l’ouverture et la fermeture des sessions ;
- la navigation après transaction ;
- la normalisation de la réponse IA.

Avant livraison, exécuter ces deux commandes puis effectuer une recette sur appareil réel : connexion, sélection de pompe, caméra, QR, photo, transaction, détail et fermeture de session.

## Dépannage

### Le backend est inaccessible

- ne pas utiliser `localhost` sur un téléphone physique ;
- vérifier l’URL et le préfixe `/api/v1` ;
- vérifier le réseau, le pare-feu, le port, HTTPS et CORS ;
- redémarrer Metro après une modification de `.env.local`.

### L’application revient à la connexion

- vérifier le rôle `CASHIER` ;
- vérifier que le compte est actif et affecté à la station ;
- contrôler `/auth/me` et `/auth/refresh`.

### Aucune pompe n’apparaît

- vérifier l’affectation station ;
- vérifier que des pompes actives existent ;
- une pompe ayant une session ouverte est considérée comme occupée.

### Caméra ou MMKV indisponible

- utiliser un development build ;
- accepter les permissions caméra et galerie ;
- reconstruire après une modification native.

### Transaction « En attente »

- contrôler le réseau et l’URL API ;
- vérifier l’upload de photo puis `POST /transactions` dans les logs ;
- tenir compte de la limite actuelle de détection réseau.

## Sécurité

- ne jamais committer de `.env.local`, token ou secret fournisseur ;
- utiliser HTTPS hors développement local ;
- limiter les permissions caméra et galerie au besoin métier ;
- masquer les données personnelles et QR dans les logs ;
- vérifier l’environnement EAS avant chaque build.
