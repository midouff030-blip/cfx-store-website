const { getSession, dFetch, botFetch, canManage, getConfig, saveConfig, mergeDefaults, json } = require("./_lib");

// Verifie que l'utilisateur connecte peut gerer cette guilde
async function assertManage(session, guildId) {
  const userGuilds = await dFetch("/users/@me/guilds", session.access_token, "Bearer");
  const g = userGuilds.find(x => x.id === guildId);
  if (!g || !canManage(g)) return null;
  return g;
}

exports.handler = async (event) => {
  const s = getSession(event);
  if (!s) return json(401, { error: "non connecte" });
  const guildId = event.queryStringParameters?.id;
  if (!guildId) return json(400, { error: "id manquant" });

  let g;
  try { g = await assertManage(s, guildId); } catch (e) { return json(500, { error: e.message }); }
  if (!g) return json(403, { error: "Tu n'es pas administrateur de ce serveur." });

  // ---- POST : sauvegarder ----
  if (event.httpMethod === "POST") {
    let patch = {};
    try { patch = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "json invalide" }); }
    const cur = await getConfig(guildId);
    const next = mergeDefaults({ ...cur, ...patch });
    try { await saveConfig(guildId, next); } catch (e) { return json(500, { error: "sauvegarde: " + e.message }); }
    return json(200, { ok: true });
  }

  // ---- GET : config + salons + roles ----
  try {
    const config = await getConfig(guildId);
    let channels = [], roles = [];
    try {
      const chs = await botFetch(`/guilds/${guildId}/channels`);
      channels = chs.filter(c => c.type === 0 || c.type === 5) // text + announcement
        .sort((a, b) => a.position - b.position)
        .map(c => ({ id: c.id, name: c.name }));
    } catch { /* bot pas dans la guilde */ }
    try {
      const rls = await botFetch(`/guilds/${guildId}/roles`);
      roles = rls.filter(r => r.name !== "@everyone" && !r.managed)
        .sort((a, b) => b.position - a.position)
        .map(r => ({ id: r.id, name: r.name }));
    } catch { }
    return json(200, { name: g.name, config, channels, roles });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
