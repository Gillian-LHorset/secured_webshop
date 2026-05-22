const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: "Trop de tentatives de connexion. Réessayez dans 1 minute.",
  keyGenerator: ipKeyGenerator,
  skip: (req) => !req.path.startsWith("/api/auth/login"),
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
