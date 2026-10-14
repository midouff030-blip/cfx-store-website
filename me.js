const { getSession, dFetch, botFetch, canManage } = require("./_lib");

module.exports = async (req, res) => {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "non connecte" });
  try {
    const userGuilds = await dFetch("/users/@me/guilds", s.access_token, "Bearer");
    const manageable = userGuilds.filter(canManage);

    let botIds = new Set();
    try {
      const botGuilds = await botFetch("/users/@me/guilds");
      botIds = new Set(botGuilds.map(g => g.id));
    } catch { /* token bot absent -> hasBot=false partout */ }

    const guilds = manageable.map(g => ({ id: g.id, name: g.name, icon: g.icon, hasBot: botIds.has(g.id) }))
      .sort((a, b) => (b.hasBot - a.hasBot) || a.name.localeCompare(b.name));

    res.status(200).json({ user: { id: s.id, username: s.username, avatar: s.avatar }, guilds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
