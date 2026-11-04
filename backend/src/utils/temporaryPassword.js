const crypto = require("crypto");

// No look-alike characters (0/O, 1/l/I): the admin reads the password out to the user.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const LENGTH = 12;

// A random one-time password for a new account or an admin reset (D22).
const generateTemporaryPassword = () =>
  Array.from({ length: LENGTH }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");

module.exports = { generateTemporaryPassword };
