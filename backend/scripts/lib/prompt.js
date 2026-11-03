// Small helpers for the server CLI scripts: read a value from env, or ask on an interactive
// terminal. Secrets are typed without echo and are never printed.
const readline = require("node:readline");

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Print the question once, then swallow everything readline would echo.
      rl._writeToOutput = (text) => {
        if (text.startsWith(question)) rl.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });

// Returns process.env[envName] if set; otherwise prompts when stdin is a TTY; otherwise throws.
const valueFrom = async (envName, question, options) => {
  const fromEnv = process.env[envName];
  if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
  if (!process.stdin.isTTY) throw new Error(`${envName} is not set`);
  return ask(question, options);
};

module.exports = { ask, valueFrom };
