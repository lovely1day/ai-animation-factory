#!/usr/bin/env node
/**
 * download-arabic-fonts.mjs
 *
 * ينزّل 8 ملفات خط عربي (OFL) من مستودع Google Fonts على GitHub
 * إلى apps/api/assets/fonts/ — تستخدمها subtitleBurnService لحرق الترجمة.
 *
 * الاستخدام:
 *   node apps/api/scripts/download-arabic-fonts.mjs
 *
 * آمن للتشغيل المتكرر — يتخطى الملفات الموجودة.
 */

import { writeFile, mkdir, access, constants } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = resolve(__dirname, '..', 'assets', 'fonts');

const FONTS = [
  {
    // Cairo ships as a variable font (weight 200–1000). FFmpeg treats it as
    // one file; we map both "regular" and "bold" to the same file for
    // simplicity — the subtitle renderer picks weight via the ASS Bold flag.
    file: 'Cairo-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf',
  },
  {
    file: 'Cairo-Bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf',
  },
  {
    file: 'Tajawal-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Regular.ttf',
  },
  {
    file: 'Tajawal-Bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/tajawal/Tajawal-Bold.ttf',
  },
  {
    file: 'Amiri-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf',
  },
  {
    file: 'Amiri-Bold.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf',
  },
  {
    file: 'IBMPlexSansArabic-Regular.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf',
  },
  {
    file: 'IBMPlexSansArabic-Medium.ttf',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf',
  },
];

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function downloadFont({ file, url }) {
  const target = join(FONTS_DIR, file);
  if (await exists(target)) {
    console.log(`  ✓ ${file} (already present — skipped)`);
    return { file, status: 'skipped' };
  }

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`  ✗ ${file} — HTTP ${response.status} at ${url}`);
    return { file, status: 'failed', error: `HTTP ${response.status}` };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(target, buffer);
  const sizeKb = (buffer.length / 1024).toFixed(1);
  console.log(`  ✓ ${file} (${sizeKb} KB)`);
  return { file, status: 'downloaded', sizeKb };
}

async function main() {
  console.log(`\n📚 Downloading Arabic fonts to ${FONTS_DIR}\n`);

  await mkdir(FONTS_DIR, { recursive: true });

  const results = [];
  for (const font of FONTS) {
    try {
      results.push(await downloadFont(font));
    } catch (err) {
      console.error(`  ✗ ${font.file} — ${err.message}`);
      results.push({ file: font.file, status: 'failed', error: err.message });
    }
  }

  const downloaded = results.filter((r) => r.status === 'downloaded').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log(`\n📊 ${downloaded} downloaded | ${skipped} skipped | ${failed} failed\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
