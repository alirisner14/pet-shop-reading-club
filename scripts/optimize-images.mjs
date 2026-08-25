// scripts/optimize-images.mjs
//
// Resizes and converts every PNG in public/images to WebP.
//
//   node scripts/optimize-images.mjs            preview only, changes nothing
//   node scripts/optimize-images.mjs --write    creates the .webp files
//   node scripts/optimize-images.mjs --write --replace   also deletes the PNGs
//
// Safe to run more than once. Originals are untouched unless you
// pass --replace.

import sharp from 'sharp';
import { readdir, stat, unlink } from 'node:fs/promises';
import { join, extname, basename, dirname, relative } from 'node:path';

const ROOT = 'public/images';

const WRITE = process.argv.includes('--write');
const REPLACE = process.argv.includes('--replace');

// Max width per folder. A pet on screen is never 4000px wide, so
// shrinking is where almost all the savings come from — the format
// change is the smaller half of the win.
const MAX_WIDTH = {
  screens: 1920, // full-screen backgrounds
  hosts: 1000, // characters stand about half the screen tall
  pets: 900,
  rewards: 600, // small objects in a room or a row of choices
  default: 900,
};

const QUALITY = 82; // WebP quality — 82 is visually lossless for art like this

function widthFor(path) {
  const parts = relative(ROOT, path).split(/[\\/]/);
  return MAX_WIDTH[parts[0]] ?? MAX_WIDTH.default;
}

async function findPngs(dir) {
  const found = [];
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    console.error(`\nCan't find ${dir} — run this from the project root.\n`);
    process.exit(1);
  }

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findPngs(full)));
    } else if (extname(entry.name).toLowerCase() === '.png') {
      found.push(full);
    }
  }
  return found;
}

function mb(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

async function run() {
  const files = await findPngs(ROOT);

  if (files.length === 0) {
    console.log(`No PNGs found in ${ROOT}.`);
    return;
  }

  console.log(
    `\n${files.length} images found.${WRITE ? '' : '  (preview — nothing will be written)'}\n`
  );

  let before = 0;
  let after = 0;
  let failed = 0;

  for (const file of files) {
    const target = join(dirname(file), basename(file, '.png') + '.webp');
    const original = (await stat(file)).size;
    before += original;

    try {
      const image = sharp(file);
      const meta = await image.metadata();
      const max = widthFor(file);

      const pipeline = image
        .resize({
          width: Math.min(meta.width ?? max, max),
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY });

      let size;

      if (WRITE) {
        const info = await pipeline.toFile(target);
        size = info.size;
        if (REPLACE) await unlink(file);
      } else {
        size = (await pipeline.toBuffer()).length;
      }

      after += size;

      const saved = Math.round((1 - size / original) * 100);
      console.log(
        `  ${relative(ROOT, file).padEnd(46)} ` +
          `${mb(original)}MB -> ${mb(size)}MB  (-${saved}%)`
      );
    } catch (err) {
      failed++;
      console.log(`  ${relative(ROOT, file).padEnd(46)} FAILED: ${err.message}`);
    }
  }

  console.log(
    `\nTotal: ${mb(before)}MB -> ${mb(after)}MB ` +
      `(saved ${mb(before - after)}MB, ${Math.round((1 - after / before) * 100)}%)`
  );

  if (failed) console.log(`${failed} file(s) failed.`);

  if (!WRITE) {
    console.log('\nRun again with --write to create the .webp files.\n');
  } else if (!REPLACE) {
    console.log(
      '\nOriginal PNGs kept. Add --replace once you are happy with the results.\n'
    );
  } else {
    console.log('\nOriginal PNGs deleted.\n');
  }
}

run();
