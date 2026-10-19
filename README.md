# Secured Webshop

Projet pédagogique utilisé dans le cadre du cours **183 - Sécurité des applications** (ETML).

Cette application est un serveur web Node.js qui regroupe deux parties : un **backend** (API REST en Express qui communique avec la base de données MySQL) et un **frontend** (pages HTML servies directement par le même serveur). Les pages web appellent l'API via `fetch()` pour afficher et modifier les données.

---

## Démarrer le projet

### 1. Base de données (Docker)

```bash
# Depuis la racine du projet
docker-compose up -d
```

Lance MySQL sur le port **6033** et phpMyAdmin sur **8081**.
Le script `app/db/init/init.sql` est exécuté automatiquement au premier démarrage.

> **Note :** Si la base existe déjà (volume Docker), supprimer le volume pour réinitialiser :
>
> ```bash
> docker-compose down -v
> docker-compose up -d
> ```

### 2. Mise en place de l'environnement

Copiez le fichier .env.exemple et renomez le simplement .env puis modifier les valeurs secretes à l'interieur.

```bash
cd app
npm install
```

Générer une clé et un certificat pour la mise en place du serveur HTTPS.

```bash
# clé fonctionnelle 1an
openssl req -nodes -new -x509 -keyout server.key -out server.cert -days 365 -subj "//CN=localhost"
```

### 3. Lancement de l'application Node.js local

```bash
npm start
```

L'application démarre sur **http://localhost:8080**

### Fonctionnalités ajoutées

---

#### Système d'inscription et de connexion

L'utilisateur à la possibilité de s'inscrire sur le site avec un nom d'utilisateur, un email et un mot de passe. Les champs obligatoires sont vérifiés à deux niveaux, le frontend vérifie si les champs ne sont pas vide et s'ils respectent les conditions imposées : l'email doit contenir un @ et un domaine et le mot de passe doit respecter une politique de mot de passe dure. Si ces conditions sont remplies alors lorsque l'utilisateur envoie le formulaire, le site passe à la deuxième partie de la vérification en backend, le site va vérifier à nouveau tous les points : les champs ne sont pas vides, l'email est correct et le mot de passe suit une politique de mot de passe forte.

Lorsque tout a été vérifié, le serveur va faire les choses suivantes : il charger le pepper depuis le .env, l'ajouter à la suite du mot de passe, puis il va ajouter du sel et le hacher, à l'aide de BCrypte, et l'insérer en DB avec une requête préparée (prepared statement).  
Lors du login, il se passe sensiblement la même chose, ajoute le poivre au mot de passe, cette fois BCrypte récupère le mot de passe haché en DB puis le compare à l'aide du sel présent sur le champs du mot de passe.

#### Token de session

Lorsque l'utilisateur s'inscrit ou se connecte, le serveur va créer et signer un access token, grâce à la librairie jsonwebtoken, avec dedans l'identifiant de l'utilisateur et son rôle (admin ou user). Il va lui renvoyer sous forme de cookie en précisant combien de temps le token est valide.  
Désormais, lorsque l'utilisateur accède à une page qui requière d'être connectée, le middleware `auth.js` va vérifier si l'utilisateur à un token, s'il est n'est pas expirer et s'il est correctement signé.  
Lorsque l'utilisateur se déconnecte, on lui retire simplement son jeton.

#### Refresh token

Le jeton de session a une durée de vie de 15 minutes, cela permet que si un utilisateur se fait pirater et voler son token de session, le pirate peut l'utiliser 15 minutes maximum. Pour tout de même éviter que les utilisateurs doivent se reconnecter toutes les 15 minutes, il a été mis en place un système de refresh token.  
Lors de la connexion ou création du compte, on crée en DB un refresh token. Lorsque le jeton de session de l'utilisateur est échu et qu'il essaie d'accéder à une page requérant d'être connecté, alors on vérifie si l'utilisateur à un refresh token valide en DB, si oui alors on lui génère un nouveau token qu'on lui renvoie.  
La durée de vie d'un refresh token est de 7 jours, cela fait que l'utilisateur à besoin de se reconnecter tous les 7 jours au lieu de toutes les 15 minutes.

#### Certificat HTTPS

Afin d'avoir une connexion sécurisée entre le site et l'utilisateur, il a été mis en place le protocole HTTPS.  
Comme ce projet est réaliser entièrement en local, il n'y a pas réellement possibilité de tester la mise ne place du protocole HTTPS. Cependant, ce qui a été mis en place est protocole HTTPS basé sur un certificat auto-signé.

#### Limitation des tentatives de login

Dans le but d'éviter que les comptes des utilisateurs puissent être brut-force, une limitation d'essais de connexion par IP a été mise en place. Si l'utilisateur se trompe 5 fois dans son mot de passe alors on lui envoie un message pour lui signaler qu'il est rate limit et on bloque ses futures tentatives de connexion durant un temps donné (en l'occurrence 1 minute).

#### Chiffrement des données sensibles en DB

En cas de piratage de la base de données, les mots de passe sont en sécurité (sel, poivre et haché), mais des données sensibles persistent comme l'adresse de l'utilisateur, s'il en a entré une.  
Dans un souci de protection des données, l'adresse de l'utilisateur est chiffrée en DB grâce à la librairie Crypto. Elle est chiffrée à partir de `ENCRYPTION_KEY` stocké dans le .env, cela fait que tant que le .env est en sécurité, les données sensibles de l'utilisateur le sont aussi.

### Informations

---

## Pages disponibles

| URL                            | Description                             |
| ------------------------------ | --------------------------------------- |
| http://localhost:8080/         | Page d'accueil                          |
| http://localhost:8080/login    | Page de connexion                       |
| http://localhost:8080/register | Page d'inscription                      |
| http://localhost:8080/profile  | Gestion du profil (adresse + photo)     |
| http://localhost:8080/admin    | Administration (liste des utilisateurs) |

---

## API REST

| Méthode | Route                | Description                    |
| ------- | -------------------- | ------------------------------ |
| POST    | `/api/auth/login`    | Connexion                      |
| POST    | `/api/auth/register` | Inscription                    |
| GET     | `/api/profile`       | Récupérer le profil            |
| POST    | `/api/profile`       | Mettre à jour l'adresse        |
| POST    | `/api/profile/photo` | Uploader une photo de profil   |
| GET     | `/api/admin/users`   | Liste des utilisateurs (admin) |

---

## Outils

| Service    | URL                   | Identifiants                                       |
| ---------- | --------------------- | -------------------------------------------------- |
| phpMyAdmin | http://localhost:8081 | user: `db_user` / pass: `db_password` (par défaut) |

---

## Comptes de départ

| Email             | Mot de passe | Rôle  |
| ----------------- | ------------ | ----- |
| admin@webshop.com | admin123     | admin |
| alice@webshop.com | password1    | user  |
