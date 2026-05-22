const crypto = require("crypto");
require("dotenv").config();

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY manquante dans le fichier .env");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(text) {
  if (!text) return null;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
      // Donnée non chiffrée (texte brut), retourner telle quelle
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    if (iv.length !== IV_LENGTH) {
      // Format invalide, retourner tel quel (probablement du texte brut)
      return encryptedText;
    }

    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    // En cas d'erreur de déchiffrement, retourner la valeur brute
    // (peut arriver si la donnée n'était pas chiffrée)
    return encryptedText;
  }
}

module.exports = { encrypt, decrypt };
