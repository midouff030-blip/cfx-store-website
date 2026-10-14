const { CLIENT_ID, PERMS, redirect } = require("./_lib");
exports.handler = async (event) => {
  const guild = event.queryStringParameters?.guild;
  let url = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=${PERMS}`;
  if (guild) url += `&guild_id=${guild}&disable_guild_select=true`;
  return redirect(url);
};
