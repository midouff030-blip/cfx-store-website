const { getSession, dFetch, botFetch, canManage, json } = require("./_lib");

exports.handler = async (event) => {
  const s = getSession(event);
  if (!s) return json(401, { error: "non connecte" });
  try {
    // guildes de l'utilisateur ou il peut gerer
    const userGuilds = await dFetch("/users/@me/guilds", s.access_token, "Bearer");
    const manageable = userGuilds.filter(canManage);

    // guildes ou le bot est present (une liste, comparee par id)
    let botIds = new Set();
    try {
      const botGuilds = await botFetch("/users/@me/guilds");
      botIds = new Set(botGuilds.map(g => g.id));
    } catch { /* token bot absent -> hasBot=false partout */ }

    const guilds = manageable.map(g => ({ id: g.id, name: g.name, icon: g.icon, hasBot: botIds.has(g.id) }))
      .sort((a, b) => (b.hasBot - a.hasBot) || a.name.localeCompare(b.name));

    return json(200, { user: { id: s.id, username: s.username, avatar: s.avatar }, guilds });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
