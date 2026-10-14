// VELOX Security - dashboard client
const app = document.getElementById("app");
const navUser = document.getElementById("navUser");
const toastEl = document.getElementById("toast");
let ME = null;

function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); setTimeout(() => toastEl.classList.remove("show"), 1800); }
function esc(s) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function loading() { app.innerHTML = '<div class="center"><div class="spinner"></div></div>'; }
function iconURL(g) { return g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=96` : null; }

async function api(path, opts) {
  const r = await fetch("/.netlify/functions/" + path, { credentials: "same-origin", ...opts });
  if (r.status === 401) { ME = null; return { unauth: true }; }
  return r.json().catch(() => ({}));
}

function loginView() {
  navUser.innerHTML = '';
  app.innerHTML = `<div class="center"><div>
    <h1 style="font-size:30px;margin-bottom:10px">Dashboard VELOX Security</h1>
    <p style="color:var(--mut);margin-bottom:24px">Connecte-toi avec Discord pour gerer tes serveurs.</p>
    <a class="btn btn-primary" href="/.netlify/functions/auth-login">Se connecter avec Discord</a>
  </div></div>`;
}

function renderUser() {
  const av = ME.avatar ? `https://cdn.discordapp.com/avatars/${ME.id}/${ME.avatar}.png?size=48` : "https://cdn.discordapp.com/embed/avatars/0.png";
  navUser.innerHTML = `<span class="user-chip"><img src="${av}"> ${esc(ME.username)}</span>
    <a class="btn btn-ghost" href="/.netlify/functions/logout">Deconnexion</a>`;
}

async function serversView() {
  loading();
  const data = await api("me");
  if (data.unauth || !data.user) return loginView();
  ME = data.user; renderUser();
  const guilds = data.guilds || [];
  const cards = guilds.map(g => {
    const ic = iconURL(g);
    const img = ic ? `<img src="${ic}">` : `<div class="ph">${esc((g.name || "?")[0])}</div>`;
    const action = g.hasBot
      ? `<div class="meta" style="color:var(--ok)">Configurer →</div>`
      : `<div class="meta">+ Ajouter le bot</div>`;
    const href = g.hasBot ? `#/guild/${g.id}` : `/.netlify/functions/invite?guild=${g.id}`;
    return `<a class="srv" href="${href}">${img}<div style="overflow:hidden"><div class="nm">${esc(g.name)}</div>${action}</div></a>`;
  }).join("");
  app.innerHTML = `<div class="dash-head"><div><h1 style="font-size:26px">Tes serveurs</h1>
    <div style="color:var(--mut)">Choisis un serveur ou tu es admin pour le configurer.</div></div></div>
    <div class="servers">${cards || '<p style="color:var(--mut)">Aucun serveur ou tu es administrateur.</p>'}</div>`;
}

const FEATURES = [
  { key: "antiRaid", name: "Anti-raid", sub: "Lockdown auto en cas de vague d'arrivees" },
  { key: "antiSpam", name: "Anti-spam", sub: "Bloque le flood de messages / mentions" },
  { key: "antiPhishing", name: "Anti-phishing", sub: "Supprime les liens scam (36 000+ domaines)" },
  { key: "antiNuke", name: "Anti-nuke", sub: "Stoppe les bans / suppressions en masse" }
];

async function guildView(id) {
  loading();
  const data = await api("guild?id=" + id);
  if (data.unauth) return loginView();
  if (data.error) { app.innerHTML = `<div class="center"><div><p style="color:var(--velox2)">${esc(data.error)}</p><a class="btn btn-ghost" href="#/">Retour</a></div></div>`; return; }
  renderUser();
  const cfg = data.config, ch = data.channels || [], roles = data.roles || [];
  const chOpts = sel => `<option value="">— aucun —</option>` + ch.map(c => `<option value="${c.id}" ${sel === c.id ? "selected" : ""}>#${esc(c.name)}</option>`).join("");
  const roleOpts = sel => `<option value="">— aucun —</option>` + roles.map(r => `<option value="${r.id}" ${sel === r.id ? "selected" : ""}>@${esc(r.name)}</option>`).join("");
  const sw = (key, on) => `<span class="sw"><input type="checkbox" id="f_${key}" ${on ? "checked" : ""}><label for="f_${key}"></label></span>`;

  app.innerHTML = `
    <div class="dash-head">
      <div><a href="#/" style="color:var(--mut)">← Serveurs</a>
      <h1 style="font-size:26px;margin-top:6px">${esc(data.name)}</h1></div>
      <button class="btn btn-primary" id="save">Enregistrer</button>
    </div>
    <div class="panel"><h3>Protections</h3><div class="hint">Active ou desactive chaque securite.</div>
      ${FEATURES.map(f => `<div class="row"><div><div class="lbl">${f.name}</div><div class="sub">${f.sub}</div></div>${sw(f.key, cfg[f.key]?.enabled)}</div>`).join("")}
    </div>
    <div class="panel"><h3>Salons & roles</h3><div class="hint">Ou le bot ecrit les logs, et le role donne apres verification.</div>
      <div class="row"><div><div class="lbl">Salon des logs</div><div class="sub">Tous les evenements de securite</div></div><select id="logChannel">${chOpts(cfg.logChannel)}</select></div>
      <div class="row"><div><div class="lbl">Salon de verification</div><div class="sub">Ou poster le bouton Verify</div></div><select id="verifyChannel">${chOpts(cfg.verifyChannel)}</select></div>
      <div class="row"><div><div class="lbl">Role apres verification</div><div class="sub">Donne quand on clique Verify</div></div><select id="verifyRole">${roleOpts(cfg.verifyRole)}</select></div>
    </div>`;

  document.getElementById("save").onclick = async () => {
    const patch = { logChannel: val("logChannel"), verifyChannel: val("verifyChannel"), verifyRole: val("verifyRole") };
    FEATURES.forEach(f => { patch[f.key] = { ...(cfg[f.key] || {}), enabled: document.getElementById("f_" + f.key).checked }; });
    const res = await api("guild?id=" + id, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    if (res.ok) { Object.assign(cfg, patch); toast("Enregistre ✓"); } else { toast(res.error || "Erreur"); }
  };
  function val(id) { const v = document.getElementById(id).value; return v || null; }
}

function route() {
  const h = location.hash;
  const m = h.match(/^#\/guild\/(\d+)/);
  if (m) return guildView(m[1]);
  return serversView();
}
window.addEventListener("hashchange", route);
route();
