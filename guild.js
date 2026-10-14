const { getSession, dFetch, botFetch, canManage, getConfig, saveConfig, mergeDefaults } = require("./_lib");

async function assertManage(session, guildId) {
  const userGuilds = await dFetch("/users/@me/guilds", session.access_token, "Bearer");
  const g = userGuilds.find(x => x.id === guildId);
  if (!g || !canManage(g)) return null;
  return g;
}

module.exports = async (req, res) => {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "non connecte" });
  const guildId = req.query?.id;
  if (!guildId) return res.status(400).json({ error: "id manquant" });

  let g;
  try { g = await assertManage(s, guildId); } catch (e) { return res.status(500).json({ error: e.message }); }
  if (!g) return res.status(403).json({ error: "Tu n'es pas administrateur de ce serveur." });

  // ---- POST : sauvegarder ----
  if (req.method === "POST") {
    let patch = req.body;
    if (typeof patch === "string") { try { patch = JSON.parse(patch || "{}"); } catch { return res.status(400).json({ error: "json invalide" }); } }
    patch = patch || {};
    const cur = await getConfig(guildId);
    const next = mergeDefaults({ ...cur, ...patch });
    try { await saveConfig(guildId, next); } catch (e) { return res.status(500).json({ error: "sauvegarde: " + e.message }); }
    return res.status(200).json({ ok: true });
  }

  // ---- GET : config + salons + roles ----
  try {
    const config = await getConfig(guildId);
    let channels = [], roles = [];
    try {
      const chs = await botFetch(`/guilds/${guildId}/channels`);
      channels = chs.filter(c => c.type === 0 || c.type === 5)
        .sort((a, b) => a.position - b.position)
        .map(c => ({ id: c.id, name: c.name }));
    } catch { /* bot pas dans la guilde */ }
    try {
      const rls = await botFetch(`/guilds/${guildId}/roles`);
      roles = rls.filter(r => r.name !== "@everyone" && !r.managed)
        .sort((a, b) => b.position - a.position)
        .map(r => ({ id: r.id, name: r.name }));
    } catch { }
    res.status(200).json({ name: g.name, config, channels, roles });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
