// Prints a Vitest json-summary as a Markdown table for the GitHub job summary.
// Usage: node coverage-summary.js <title> <path/to/coverage-summary.json>
const fs = require("fs");

const [title, file] = process.argv.slice(2);
const { total } = JSON.parse(fs.readFileSync(file, "utf8"));

const rows = ["statements", "branches", "functions", "lines"].map(
  (key) => `| ${key} | ${total[key].pct}% | ${total[key].covered} / ${total[key].total} |`
);

console.log(
  [`### ${title} coverage`, "", "| | % | covered |", "|---|---|---|", ...rows, ""].join("\n")
);
