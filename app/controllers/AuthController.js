const db = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const path = require("path");
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

        req.session.userId = user.id;
        req.session.userEmail = user.email;

        return res.redirect("/");
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

        res.sendFile(path.join(__dirname, "..", "views", "home.html"));
      });
    });
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
