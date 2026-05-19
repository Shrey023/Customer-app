const fs = require("fs");
const path = require("path");

const targetPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native",
  "node_modules",
  "@react-native",
  "gradle-plugin",
  "gradle",
  "libs.versions.toml"
);

if (!fs.existsSync(targetPath)) {
  console.warn(
    "[patch-rn-gradle-plugin] Skipped: libs.versions.toml not found at",
    targetPath
  );
  process.exit(0);
}

const original = fs.readFileSync(targetPath, "utf8");
const updated = original.replace('agp = "8.11.0"', 'agp = "8.7.3"');

if (original === updated) {
  console.log(
    "[patch-rn-gradle-plugin] No change needed (agp already 8.7.3)."
  );
  process.exit(0);
}

fs.writeFileSync(targetPath, updated);
console.log(
  "[patch-rn-gradle-plugin] Updated AGP version to 8.7.3 in",
  targetPath
);
