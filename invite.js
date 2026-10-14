const { CLIENT_ID, PERMS } = require("./_lib");
module.exports = async (req, res) => {
  const guild = req.query?.guild;
  let url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=${PERMS}`;
  if (guild) url += `&guild_id=${guild}&disable_guild_select=true`;
  res.redirect(302, url);
};
