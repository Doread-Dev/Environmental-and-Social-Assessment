// Copies the v2.5 design tokens (and the embedded IBM Plex fonts) from foundations.html, their single
// source, into the other design playgrounds, so every playground uses the same values.
// Usage (from the repo root): node plan/design/sync-tokens.js plan/design/components-inputs.html [...]
// A target holds either the placeholders /*@@FONTS@@*/ and /*@@TOKENS@@*/ (first sync) or the marked
// blocks a previous sync left (later syncs).
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.join(__dirname, 'foundations.html'), 'utf8');
const block = (start, end) => {
  const i = source.indexOf(start);
  const j = source.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error(`foundations.html: markers ${start} … ${end} not found`);
  return source.slice(i, j + end.length);
};
const fonts = block('/*@fonts:start*/', '/*@fonts:end*/');
const tokens = block('/*@tokens:css', '/*@tokens:end*/');

const replace = (text, placeholder, start, end, value) => {
  if (text.includes(placeholder)) return text.replace(placeholder, () => value);
  const i = text.indexOf(start);
  const j = text.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error(`no ${placeholder} and no ${start} block`);
  return text.slice(0, i) + value + text.slice(j + end.length);
};

const targets = process.argv.slice(2);
if (!targets.length) throw new Error('name at least one playground to sync');
for (const file of targets) {
  let text = fs.readFileSync(file, 'utf8');
  text = replace(text, '/*@@FONTS@@*/', '/*@fonts:start*/', '/*@fonts:end*/', fonts);
  text = replace(text, '/*@@TOKENS@@*/', '/*@tokens:css', '/*@tokens:end*/', tokens);
  fs.writeFileSync(file, text);
  console.log(`synced ${file}`);
}
