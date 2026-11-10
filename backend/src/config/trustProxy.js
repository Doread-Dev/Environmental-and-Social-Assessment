// Parses TRUST_PROXY into a value for app.set("trust proxy", …) (D6). Default off: only enable
// it when the API runs behind IIS/nginx, otherwise clients could spoof X-Forwarded-For.
//   unset, "", "false", "0" → false
//   "true"                  → 1 (trust exactly one proxy hop, never every hop)
//   "2", "3", …             → that many hops
//   anything else           → passed through (e.g. "loopback", "10.0.0.0/8, 127.0.0.1")
const parseTrustProxy = (raw) => {
  const value = (raw ?? "").trim();
  if (value === "" || value.toLowerCase() === "false" || value === "0") return false;
  if (value.toLowerCase() === "true") return 1;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};

module.exports = parseTrustProxy;
