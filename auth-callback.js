const { CLIENT_ID, CLIENT_SECRET, redirectUri, sign, setCookie, SITE_URL, API } = require("./_lib");

module.exports = async (req, res) => {
  const code = req.query?.code;
  if (!code) return res.status(400).json({ error: "code manquant" });
  try {
    // 1) echange code -> token
    const tokRes = await fetch(API + "/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID, client_secret: CLIENT_SECRET,
        grant_type: "authorization_code", code, redirect_uri: redirectUri()
      })
    });
    if (!tokRes.ok) return res.status(400).json({ error: "echec OAuth" });
    const tok = await tokRes.json();

    // 2) recupere l'utilisateur
    const uRes = await fetch(API + "/users/@me", { headers: { Authorization: `Bearer ${tok.access_token}` } });
    const user = await uRes.json();

    // 3) cookie de session signe
    const session = sign({
      id: user.id, username: user.global_name || user.username, avatar: user.avatar,
      access_token: tok.access_token, exp: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    setCookie(res, session);
    res.redirect(302, (SITE_URL || "") + "/dashboard.html");
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
