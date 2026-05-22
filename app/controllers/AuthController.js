const db = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const path = require("path");
const jwt = require("jsonwebtoken");
const { encrypt } = require("../utils/crypto");
require("dotenv").config();

module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    const showLoginError = (errorMessage) => {
      console.log("Erreur de login :", errorMessage);
      return res.redirect("/login");
    };

    if (!email || !password) {
      return showLoginError("Email et mot de passe requis");
    }

    if (!emailValid(email)) {
      return showLoginError("Format d'email invalide");
    }

    const pepper = process.env.PEPPER_SECRET;
    //return res.status(400).json({ error: pepper });
    const passwordWithPepper = password + pepper;

    db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
      if (err) {
        console.error(err);
        return showLoginError("Une erreur est survenue côté serveur");
      }

      if (results.length === 0) {
        return showLoginError("Email ou mot de passe incorrect");
      }

      const user = results[0];

      bcrypt.compare(passwordWithPepper, user.password, (err, isMatch) => {
        if (err || !isMatch) {
          return showLoginError("Email ou mot de passe incorrect");
        }

        const payload = {
          userId: user.id,
          role: user.role,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "15m",
        });

        const refreshPayload = {
          userId: user.id,
        };

        const refreshToken = jwt.sign(
          refreshPayload,
          process.env.REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
          {
            expiresIn: "7d",
          },
        );

        db.query(
          "UPDATE users SET refresh_token = ? WHERE id = ?",
          [refreshToken, user.id],
          (dbErr) => {
            if (dbErr) {
              console.error("Erreur de stockage du refresh token:", dbErr);
              return showLoginError("Une erreur est survenue côté serveur");
            }

            res.cookie("SecureShopJWT_Token", accessToken, {
              maxAge: 15 * 60 * 1000,
            });
            res.cookie("SecureShopJWT_RefreshToken", refreshToken, {
              httpOnly: true,
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            return res.redirect("/");
          },
        );
      });
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (req, res) => {
    let { password, username, email, address, photo_path } = req.body;

    if (!passwordValid(password)) {
      return res.redirect("/register");
    }

    if (!username) {
      return res.redirect("/register");
    }

    if (!emailValid(email)) {
      return res.redirect("/register");
    }

    if (photo_path) {
      if (!photoProfilLinkValid(photo_path)) {
        return res.redirect("/register");
      }
    } else {
      photo_path = null;
    }

    if (!address) {
      address = null;
    } else {
      address = encrypt(address);
    }

    const pepper = process.env.PEPPER_SECRET;
    const passwordWithPepper = password + pepper;

    bcrypt.hash(passwordWithPepper, saltRounds, function (err, hash) {
      if (err) {
        return res.redirect("/register");
      }

      const sqlQuery =
        "INSERT INTO users (username, email, password, address, photo_path) VALUES (?, ?, ?, ?, ?)";
      const credentials = [username, email, hash, address, photo_path];

      db.query(sqlQuery, credentials, (err, results) => {
        if (err) {
          console.error(err);
          if (err.code === "ER_DUP_ENTRY") {
            return res.redirect("/register");
          }
          return res.redirect("/register");
        }
        const newUserId = results.insertId;

        const payload = {
          userId: newUserId,
          role: "user",
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "15m",
        });

        const refreshPayload = {
          userId: newUserId,
        };

        const refreshToken = jwt.sign(
          refreshPayload,
          process.env.REFRESH_SECRET || process.env.JWT_SECRET + "_refresh",
          {
            expiresIn: "7d",
          },
        );

        db.query(
          "UPDATE users SET refresh_token = ? WHERE id = ?",
          [refreshToken, newUserId],
          (dbErr) => {
            if (dbErr) {
              console.error(
                "Erreur de stockage du refresh token lors de l'enregistrement:",
                dbErr,
              );
              return res.redirect("/register");
            }

            res.cookie("SecureShopJWT_Token", accessToken, {
              maxAge: 15 * 60 * 1000,
            });
            res.cookie("SecureShopJWT_RefreshToken", refreshToken, {
              httpOnly: true,
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.redirect("/");
          },
        );
      });
    });
  },
  logout: (req, res) => {
    let userId = req.user?.userId;

    const clearCookiesAndRedirect = () => {
      res.clearCookie("SecureShopJWT_Token");
      res.clearCookie("SecureShopJWT_RefreshToken");
      return res.redirect("/");
    };

    if (!userId) {
      let token = null;
      if (req.cookies && req.cookies.SecureShopJWT_Token) {
        token = req.cookies.SecureShopJWT_Token;
      } else if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
          const parts = cookie.trim().split("=");
          const key = parts[0];
          const value = parts.slice(1).join("=");
          if (key) acc[key] = value;
          return acc;
        }, {});
        token = cookies.SecureShopJWT_Token;
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (e) {
          // Ignorer l'erreur
        }
      }
    }

    if (userId) {
      db.query(
        "UPDATE users SET refresh_token = NULL WHERE id = ?",
        [userId],
        (err) => {
          if (err) {
            console.error(
              "Erreur de suppression du refresh token lors du logout:",
              err,
            );
          }
          clearCookiesAndRedirect();
        },
      );
    } else {
      clearCookiesAndRedirect();
    }
  },
};

// ----------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------

function passwordValid(password) {
  if (!password || password.length < 8) return false;

  const rules = [
    { pattern: /[A-Z]/, target: "UpperCase" },
    { pattern: /[a-z]/, target: "LowerCase" },
    { pattern: /[0-9]/, target: "Numbers" },
    { pattern: /[!@#$%^&*]/, target: "Symbols" },
  ];
  return rules.every((rule) => rule.pattern.test(password));
}

function emailValid(email) {
  const rules = [{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }];
  return rules.every((rule) => rule.pattern.test(email));
}

function photoProfilLinkValid(photo_path) {
  const pattern = /^https:\/\/.+\.(jpg|png|webp)$/i;
  return pattern.test(photo_path);
}
