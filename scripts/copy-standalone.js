const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  copyRecursive(".next/static", ".next/standalone/.next/static");
  copyRecursive("public", ".next/standalone/public");
  console.log("✓ Standalone production assets prepared successfully.");
} catch (err) {
  console.warn("Notice: standalone copy skipped or incomplete:", err.message);
}

