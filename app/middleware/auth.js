const jwt = require("jsonwebtoken");

// =============================================================
// Middleware d'authentification
// =============================================================

module.exports = (_req, _res, next) => {
  const authHeader = _req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return _res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    _req.user = decoded;

    next();
  } catch (err) {
    _res.status(403).json({ error: "Token invalide ou expiré." });
  }
  next();
};
