const { clearCookie, SITE_URL, redirect } = require("./_lib");
exports.handler = async () => redirect((SITE_URL || "") + "/dashboard.html", clearCookie());
