# VELOX Security — Site (landing + dashboard)

Site officiel du bot **VELOX Security** : page de presentation + **dashboard** ou les clients
ajoutent le bot et le configurent (comme MEE6 / Dyno). Deploiement **Netlify** + **Supabase**
(le meme projet Supabase que le bot : ils partagent la table `velox_guilds`).

## Ce qu'il contient
- `public/index.html` — landing page (bouton **Ajouter a Discord**)
- `public/dashboard.html` + `assets/app.js` — dashboard (login Discord, liste des serveurs, reglages)
- `netlify/functions/` — backend (OAuth, lecture/ecriture de la config, salons/roles via le bot)

---

## Deploiement (Netlify)

### 1) Mettre le code sur Netlify
- Pousse ce dossier sur un repo GitHub, puis **Netlify → Add new site → Import** (il lit `netlify.toml` tout seul).
- (Ou glisse le dossier dans Netlify Drop, mais GitHub est mieux pour les fonctions.)

### 2) Variables d'environnement
Netlify → **Site settings → Environment variables** → ajoute celles de `.env.example` :
`CLIENT_ID, CLIENT_SECRET, DISCORD_TOKEN, SITE_URL, SESSION_SECRET, SUPABASE_URL, SUPABASE_KEY`.
- `SITE_URL` = l'URL finale du site (ex: `https://velox-security.netlify.app`).
- `SESSION_SECRET` = une longue chaine aleatoire.

### 3) Discord Developer Portal
- Onglet **OAuth2 → Redirects** → ajoute **exactement** :
  `https://TON-SITE.netlify.app/.netlify/functions/auth-callback`
- (Le `CLIENT_SECRET` est dans OAuth2 → Client Secret.)

### 4) C'est pret
- `https://ton-site/` → landing, bouton **Ajouter a Discord**.
- `https://ton-site/dashboard.html` → login Discord → liste des serveurs → reglages.

---

## Comment ca marche (pour toi)
- Le client clique **Ajouter a Discord** → invite le bot (scope bot).
- Il va sur le **dashboard**, se connecte avec Discord (scope identify + guilds).
- On liste ses serveurs ou il est **admin** ; ceux ou le bot est deja present sont configurables.
- Les reglages (protections ON/OFF, salon logs, role verify) sont ecrits dans **Supabase**,
  et le **bot les lit en direct** — meme table `velox_guilds`.

> Important : le bot (dossier `velox-security-bot`) doit tourner 24/7 (Oracle Cloud gratuit / VPS)
> et utiliser **le meme** `SUPABASE_URL` / cle service_role que le site.

## Test en local (optionnel)
```bash
npm i -g netlify-cli
netlify dev     # sert le site + les fonctions sur http://localhost:8888
```
(Mets les variables dans un fichier `.env` a la racine pour le test local.)
