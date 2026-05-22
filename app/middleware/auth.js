const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../config/db");

// =============================================================
// Middleware d'authentification
// =============================================================

const verifyToken = (_req, _res, next) => {
  // Extract access token from cookies or header
  let token = null;
  if (_req.cookies && _req.cookies.SecureShopJWT_Token) {
    token = _req.cookies.SecureShopJWT_Token;
  } else if (_req.headers.cookie) {
    const cookies = _req.headers.cookie.split(";").reduce((acc, cookie) => {
      const parts = cookie.trim().split("=");
      const key = parts[0];
      const value = parts.slice(1).join("=");
      if (key) acc[key] = value;
      return acc;
    }, {});
    token = cookies.SecureShopJWT_Token;
  }

  if (!token) {
    return _res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    _req.user = decoded;
    return next();
  } catch (err) {
    // If token expired, attempt refresh flow
    if (err.name !== "TokenExpiredError") {
      return _res.redirect("/login");
    }
    // Extract refresh token
    let refreshToken = null;
    if (_req.cookies && _req.cookies.SecureShopJWT_RefreshToken) {
      refreshToken = _req.cookies.SecureShopJWT_RefreshToken;
    } else if (_req.headers.cookie) {
      const cookies = _req.headers.cookie.split(";").reduce((acc, cookie) => {
        const parts = cookie.trim().split("=");
        const key = parts[0];
        const value = parts.slice(1).join("=");
        if (key) acc[key] = value;
        return acc;
      }, {});
      refreshToken = cookies.SecureShopJWT_RefreshToken;
    }
    if (!refreshToken) {
      return _res.redirect("/login");
    }
    try {
      const refreshDecoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh")
      );
      // Verify stored refresh token matches the one presented and retrieve role
      db.query(
        "SELECT role, refresh_token FROM users WHERE id = ?",
        [refreshDecoded.userId],
        (dbErr, results) => {
          if (dbErr || results.length === 0 || results[0].refresh_token !== refreshToken) {
            return _res.redirect("/login");
          }
          const newPayload = { userId: refreshDecoded.userId, role: results[0].role };
          const newAccessToken = jwt.sign(newPayload, process.env.JWT_SECRET, { expiresIn: "15m" });
          // Set new access token cookie
          _res.cookie("SecureShopJWT_Token", newAccessToken, { maxAge: 15 * 60 * 1000 });
          _req.user = newPayload;
          return next();
        }
      );
    } catch (e) {
      return _res.redirect("/login");
    }
  }
};

const verifyAdmin = (_req, _res, next) => {
  if (!_req.user) {
    return _res.redirect("/login");
  }

  if (_req.user.role !== "admin") {
    if (_req.originalUrl.startsWith("/api/")) {
      return _res.status(403).json({ error: "Accès interdit : rôle administrateur requis" });
    } else {
      return _res.status(403).send("Accès interdit : rôle administrateur requis");
    }
  }

  return next();
};

const redirectIfAuthenticated = (_req, _res, next) => {
  try {
    let token = null;
    if (_req.cookies && _req.cookies.SecureShopJWT_Token) {
      token = _req.cookies.SecureShopJWT_Token;
    } else if (_req.headers.cookie) {
      const cookies = _req.headers.cookie.split(";").reduce((acc, cookie) => {
        const parts = cookie.trim().split("=");
        const key = parts[0];
        const value = parts.slice(1).join("=");
        if (key) acc[key] = value;
        return acc;
      }, {});
      token = cookies.SecureShopJWT_Token;
    }

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET);
      return _res.redirect("/");
    }
  } catch (err) {
    // Jeton invalide ou expiré, continuer
  }
  return next();
};

module.exports = { verifyToken, verifyAdmin, redirectIfAuthenticated };


