const jwt = require("jsonwebtoken");
require("dotenv").config();

// =============================================================
// Middleware d'authentification
// =============================================================

const verifyToken = (_req, _res, next) => {
  try {
    const token = _req.cookies.SecureShopJWT_Token;

    if (!token) {
      return _res.redirect("/login");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    _req.user = decoded;

    return next();
  } catch (err) {
    _res.redirect("/login");
  }
  next();
};

module.exports = { verifyToken };
