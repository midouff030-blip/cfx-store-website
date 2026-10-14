const { CLIENT_ID, redirectUri } = require("./_lib");
module.exports = async (req, res) => {
  const u = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri())}&response_type=code&scope=identify%20guilds&prompt=none`;
  res.redirect(302, u);
};
