/**
 * One-time image compression script.
 * Install sharp first:  npm install --save-dev sharp
 * Then run:            node scripts/compress-images.js
 *
 * What it does:
 *   - Walks public/images/ recursively
 *   - Compresses JPEG/JPG → 80% quality, max 1920px wide
 *   - Compresses PNG → lossy, max 1920px wide
 *   - Overwrites originals in place (backs up nothing — run on a git-clean tree)
 */

import sharp from "sharp";
import { readdirSync, statSync } from "fs";
import { join, extname } from "path";

const ROOT = new URL("../public/images", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const MAX_WIDTH = 1920;

let total = 0;
let saved = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    const ext = extname(full).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) continue;
    compress(full, ext);
  }
}

async function compress(filePath, ext) {
  try {
    const before = statSync(filePath).size;
    const img = sharp(filePath).resize({ width: MAX_WIDTH, withoutEnlargement: true });

    let buf;
    if (ext === ".png") {
      buf = await img.png({ compressionLevel: 9, effort: 10 }).toBuffer();
    } else {
      buf = await img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    }

    const after = buf.length;
    const reduction = ((1 - after / before) * 100).toFixed(1);

    if (after < before) {
      const { writeFileSync } = await import("fs");
      writeFileSync(filePath, buf);
      saved += before - after;
      console.log(`✓ ${filePath.split("public")[1]}  ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB  (-${reduction}%)`);
    } else {
      console.log(`– ${filePath.split("public")[1]}  already optimal`);
    }
    total++;
  } catch (err) {
    console.error(`✗ ${filePath}: ${err.message}`);
  }
}

walk(ROOT);
setTimeout(() => {
  console.log(`\nDone: ${total} images processed, ${(saved / 1024 / 1024).toFixed(2)} MB saved`);
}, 500);
