const crypto = require("crypto");

const {
  CLIENT_ID, CLIENT_SECRET, DISCORD_TOKEN,
  SUPABASE_URL, SUPABASE_KEY, SESSION_SECRET,
  SITE_URL, BOT_PERMISSIONS
} = process.env;

const API = "https://discord.com/api/v10";
const PERMS = BOT_PERMISSIONS || "1099780156598";
const MANAGE_GUILD = 0x20n;

const DEFAULT_CONFIG = {
  logChannel: null, muteRole: null, modRoles: [],
  verifyChannel: null, verifyRole: null,
  antiRaid: { enabled: true, joinThreshold: 8, joinWindowSec: 10, action: "lockdown" },
  antiSpam: { enabled: true, maxMessages: 6, windowSec: 5, maxMentions: 5, action: "mute" },
  antiPhishing: { enabled: true, action: "ban" },
  antiNuke: { enabled: true, maxActionsPerMin: 4 }
};
function mergeDefaults(c) {
  c = c || {};
  return {
    ...DEFAULT_CONFIG, ...c,
    antiRaid: { ...DEFAULT_CONFIG.antiRaid, ...(c.antiRaid || {}) },
    antiSpam: { ...DEFAULT_CONFIG.antiSpam, ...(c.antiSpam || {}) },
    antiPhishing: { ...DEFAULT_CONFIG.antiPhishing, ...(c.antiPhishing || {}) },
    antiNuke: { ...DEFAULT_CONFIG.antiNuke, ...(c.antiNuke || {}) }
  };
}

// ---- Session (signed cookie) ----
function b64url(buf) { return Buffer.from(buf).toString("base64url"); }
function sign(data) {
  const body = b64url(JSON.stringify(data));
  const sig = crypto.createHmac("sha256", SESSION_SECRET || "dev").update(body).digest("base64url");
  return body + "." + sig;
}
function verify(token) {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expect = crypto.createHmac("sha256", SESSION_SECRET || "dev").update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (data.exp && Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}
function getSession(event) {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const m = cookie.match(/velox_session=([^;]+)/);
  return m ? verify(decodeURIComponent(m[1])) : null;
}
function setCookie(token) {
  return `velox_session=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}
function clearCookie() { return "velox_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"; }

const redirectUri = () => `${SITE_URL}/.netlify/functions/auth-callback`;

// ---- Discord helpers ----
async function dFetch(path, token, type = "Bearer") {
  const r = await fetch(API + path, { headers: { Authorization: `${type} ${token}` } });
  if (!r.ok) throw new Error(`discord ${path} ${r.status}`);
  return r.json();
}
const botFetch = (path) => dFetch(path, DISCORD_TOKEN, "Bot");

function canManage(g) {
  if (g.owner) return true;
  try { return (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD; } catch { return false; }
}

// ---- Supabase REST ----
async function getConfig(guildId) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/velox_guilds?guild_id=eq.${guildId}&select=config`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  const rows = await r.json().catch(() => []);
  return mergeDefaults(rows?.[0]?.config);
}
async function saveConfig(guildId, config) {
  await fetch(`${SUPABASE_URL}/rest/v1/velox_guilds?on_conflict=guild_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
      "content-type": "application/json", Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({ guild_id: guildId, config, updated_at: new Date().toISOString() })
  });
}

const json = (code, obj, extraHeaders = {}) => ({
  statusCode: code, headers: { "content-type": "application/json", ...extraHeaders }, body: JSON.stringify(obj)
});
const redirect = (url, cookie) => ({ statusCode: 302, headers: { Location: url, ...(cookie ? { "Set-Cookie": cookie } : {}) }, body: "" });

module.exports = {
  CLIENT_ID, CLIENT_SECRET, DISCORD_TOKEN, API, PERMS, SITE_URL,
  DEFAULT_CONFIG, mergeDefaults,
  sign, verify, getSession, setCookie, clearCookie, redirectUri,
  dFetch, botFetch, canManage, getConfig, saveConfig, json, redirect
};
