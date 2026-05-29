const { rateLimit } = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  statusCode: 429,
  message: {
    message: "Trop de tentatives de connexion. Réessayez dans 1 minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
