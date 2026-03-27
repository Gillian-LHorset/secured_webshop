const db = require("../config/db");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const path = require("path");
module.exports = {
  // ----------------------------------------------------------
  // POST /api/auth/login
  // ----------------------------------------------------------
  login: (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    // valid the email
    if (!emailValid(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }

    //TODO : compar password : https://www.npmjs.com/package/bcrypt
    bcrypt.hash(password, saltRounds, function (err, hash) {
      const query = "SELECT * FROM users WHERE email = ? AND password = ?";
      const credentials = [email, password];
      db.query(query, credentials, (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message, query: query });
        }

        if (results.length === 0) {
          return res
            .status(401)
            .json({ error: "Email ou mot de passe incorrect" });
        }

        res.json({ message: "Connexion réussie", user: results[0] });
      });
    });
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (_req, res) => {
    let { password, username, email, address, photo_path } = _req.body;

    // valid the password
    if (!passwordValid(password)) {
      return res.status(400).json({ error: "Mot de passe invalide." });
    }

    //check if the username is null
    if (!username) {
      return res.status(400).json({ error: "Nom d'utilisateur invalide." });
    }

    // valid the email
    if (!emailValid(email)) {
      return res.status(400).json({ error: "Email invalide." });
    }

    if (photo_path) {
      if (!photoProfilLinkValid) {
        return res
          .status(400)
          .json({ error: "Lien de la photo de profil invalide." });
      }
    } else {
      photo_path = null;
    }

    if (!address) {
      address = null;
    }

    bcrypt.hash(password, saltRounds, function (err, hash) {
      const sqlQuery =
        "INSERT INTO users (username, email, password, address, photo_path) VALUES (?, ?, ?, ?, ?)";
      const credentials = [username, email, hash, address, photo_path];

      db.query(sqlQuery, credentials, (err, results) => {
        if (err) throw err;
        console.log("Rows affected:", results.affectedRows);
      });
    });

    res.sendFile(path.join(__dirname, "..", "views", "home.html"));
  },
};

function dd(...args) {
  console.log("dd start :");
  console.log(...args);
  console.log("dd end :");
  process.exit(1);
}

function passwordValid(password) {
  const rules = [
    { pattern: /[A-Z]/, target: "UpperCase" },
    { pattern: /[a-z]/, target: "LowerCase" },
    { pattern: /[0-9]/, target: "Numbers" },
    { pattern: /[!@#$%^&*]/, target: "Symbols" },
  ];
  const isPasswordValid = rules.every((rule) => rule.pattern.test(password));

  return isPasswordValid;
}

function emailValid(email) {
  const rules = [
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  ];
  const isValid = rules.every((rule) => rule.pattern.test(email));

  return isValid;
}

function photoProfilLinkValid(photo_path) {
  const rules = [
    {
      pattern: /^https:\/\/.+\.(jpg|png|webp)$/i,
    },
  ];
  const isValid = rules.every((rule) => rule.pattern.test(email));

  return isValid;
}
