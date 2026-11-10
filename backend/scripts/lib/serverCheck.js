// Rules of the server check (scripts/check-server.js, phase 11).

const parseVersion = (text) => {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?/.exec(String(text ?? ""));
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)] : null;
};

const atLeast = (v, min) => {
  for (let i = 0; i < 3; i += 1) {
    if (v[i] !== min[i]) return v[i] > min[i];
  }
  return true;
};

/**
 * MongoDB 8 vs the Linux kernel (found in phase 11's CI work, 2026-11-03): MongoDB 8.x refuses to
 * start on Linux kernels 6.19 to 7.0.13 (tcmalloc/rseq, SERVER-121912); 8.0.30 and 8.3.9 changed
 * the start-up check (SERVER-125742). MongoDB 7.0 is not affected; neither is Windows.
 * @param {string} kernel e.g. "6.8.0-49-generic" (uname -r)
 * @param {string} mongodb e.g. "8.0.31"
 * @returns {{ ok: boolean, reason: string }}
 */
const kernelCompatibility = (kernel, mongodb) => {
  const k = parseVersion(kernel);
  const m = parseVersion(mongodb);
  if (!k || !m) return { ok: false, reason: "Unknown kernel or MongoDB version" };
  if (m[0] < 8) return { ok: true, reason: `MongoDB ${m.join(".")} is not affected` };

  const affectedKernel = atLeast(k, [6, 19, 0]) && !atLeast(k, [7, 0, 14]);
  if (!affectedKernel) return { ok: true, reason: `Kernel ${k.join(".")} is not affected` };

  const fixed =
    (m[0] === 8 && m[1] === 0 && m[2] >= 30) ||
    (m[0] === 8 && m[1] === 3 && m[2] >= 9) ||
    (m[0] === 8 && m[1] >= 4) ||
    m[0] > 8;
  if (fixed) return { ok: true, reason: `MongoDB ${m.join(".")} has the fixed start-up check` };
  return {
    ok: false,
    reason:
      `MongoDB ${m.join(".")} does not start on kernel ${k.join(".")} (6.19 to 7.0.13). Use ` +
      "MongoDB 8.0.30+ / 8.3.9+, a kernel before 6.19 or from 7.0.14, or MongoDB 7.0.",
  };
};

// The Node major of .nvmrc ("26" or "v26.1.0").
const nodeMajor = (text) => parseVersion(`${String(text).trim().replace(/^v/, "")}.0`)?.[0] ?? null;

module.exports = { parseVersion, kernelCompatibility, nodeMajor };
