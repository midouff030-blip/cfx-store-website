const { CLIENT_ID, redirectUri, redirect } = require("./_lib");
exports.handler = async () => {
  const u = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri())}&response_type=code&scope=identify%20guilds&prompt=none`;
  return redirect(u);
};
