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

    const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    const credentials = [email, password];
    db.query(query, (err, results) => {
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
  },

  // ----------------------------------------------------------
  // POST /api/auth/register
  // ----------------------------------------------------------
  register: (_req, res) => {
    const { password, username, email, adress, photo } = _req.body;

    const test = bcrypt.hash(password, saltRounds, function (err, hash) {
      const sqlQuery =
        "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
      const credentials = [username, email, hash];

      db.query(sqlQuery, credentials, (err, results) => {
        if (err) throw err;
        console.log("Rows affected:", results.affectedRows);
      });
    });

    res.sendFile(path.join(__dirname, "..", "views", "home.html"));
  },
};
