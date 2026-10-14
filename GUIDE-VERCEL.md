# VELOX Security — déployer le site sur Vercel (via GitHub)

## 1) Mettre le code sur GitHub
- Va sur https://github.com → New repository → nom: `velox-security-site` → Create.
- Upload : bouton "uploading an existing file" → glisse TOUT le contenu de ce dossier
  (les dossiers `api/`, `assets/`, les fichiers `index.html`, `dashboard.html`, `package.json`).
  NE PAS uploader de `.env` (les secrets se mettent dans Vercel, pas sur GitHub).
- Commit.

## 2) Importer dans Vercel
- Va sur https://vercel.com → connecte-toi avec GitHub.
- "Add New… → Project" → choisis le repo `velox-security-site` → Import.
- Framework Preset: **Other** (laisse par défaut). Ne touche à rien. Deploy.
- Tu obtiens une URL: `https://velox-security-xxx.vercel.app`.

## 3) Variables d'environnement (Vercel → Project → Settings → Environment Variables)
Ajoute ces 8 (voir .env.example) :
- CLIENT_ID = 1559969617827594270
- CLIENT_SECRET = (Discord Developer Portal → OAuth2 → Client Secret → Reset si besoin)
- DISCORD_TOKEN = le token du bot (le même que sur Wispbyte)
- SUPABASE_URL = https://egwzqpejosksuwoavifv.supabase.co
- SUPABASE_KEY = la clé service_role (la nouvelle après Roll)
- SESSION_SECRET = (déjà dans .env.example, ou génère-en une)
- SITE_URL = ton URL Vercel exacte (ex: https://velox-security-xxx.vercel.app) — SANS slash final
- BOT_PERMISSIONS = 1099780156598

Après avoir ajouté les variables → onglet Deployments → … → **Redeploy**.

## 4) Discord Developer Portal → OAuth2 → Redirects
Ajoute EXACTEMENT :
```
https://TON-URL.vercel.app/api/auth-callback
```
(remplace par ton URL réelle). Save Changes.

## 5) Tester
- Ouvre `https://TON-URL.vercel.app` → la landing s'affiche.
- Clique "Dashboard" → "Se connecter avec Discord" → autorise → tu reviens sur le dashboard
  avec la liste de tes serveurs. Choisis-en un, règle les protections, Enregistre.
- Le bot (sur Wispbyte) et le site partagent la même base Supabase → tout est synchro.

## Routes du site
- /api/invite        → ajoute le bot
- /api/auth-login    → login Discord
- /api/auth-callback → retour OAuth (à mettre dans le Dev Portal)
- /api/me            → user + serveurs
- /api/guild?id=...  → config d'un serveur (GET/POST)
- /api/logout
