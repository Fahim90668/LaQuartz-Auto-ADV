#!/usr/bin/env node
/**
 * migrate-ch3.js
 * ──────────────
 * Runs the Chapter 3 migrations in one shot:
 *   1. Type scale migration   (text-h1/h2/h3/body → text-step-*)
 *   2. Rebrand sweep          ("Auto Advertiser" → "LaQuartz AUTO-ADV")
 *
 * Safe to run multiple times — replacements are idempotent.
 * Run from repo root: `node migrate-ch3.js`
 */

const fs = require('fs');
const path = require('path');

// ─── Config ─────────────────────────────────────────────────────────────────
const ROOT = process.cwd();

// Folders to scan (relative to repo root)
const SCAN_DIRS = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/web/hooks',
];

// Files to always skip (already migrated manually, or should never change)
const SKIP_FILES = new Set([
  // Card.tsx already uses text-step-1 — leave it
  path.normalize('apps/web/components/ui/Card.tsx'),
  // Anything inside node_modules (defense in depth — not in scan dirs but be safe)
]);

// Type scale migration — ordered: h1 first so h3 doesn't get subsumed
const TYPE_MAP = [
  ['text-h1', 'text-step-4'],   // Hero / login heading
  ['text-h2', 'text-step-3'],   // Page title
  ['text-h3', 'text-step-2'],   // Section heading (Card.tsx handled separately)
  ['text-body', 'text-step-0'], // Body copy
];

// Rebrand sweep — ordered: longest first to avoid partial matches
const REBRAND_MAP = [
  ['Discord Auto-Advertiser', 'LaQuartz AUTO-ADV'],
  ['Discord Auto Advertiser', 'LaQuartz AUTO-ADV'],
  ['Discord Auto-ADVERTISER', 'LaQuartz AUTO-ADV'],
  ['Auto-Advertiser', 'LaQuartz AUTO-ADV'],
  ['Auto Advertiser', 'LaQuartz AUTO-ADV'],
  ['Auto-ADVERTISER', 'LaQuartz AUTO-ADV'],
  ['Auto ADVERTISER', 'LaQuartz AUTO-ADV'],
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip build/deps dirs
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.turbo') continue;
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function isTargetFile(file) {
  const rel = path.relative(ROOT, file);
  if (SKIP_FILES.has(path.normalize(rel))) return false;
  return /\.(tsx|ts)$/.test(file);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Main ───────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🔍 Scanning for files to migrate...\n');

  const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d))).filter(isTargetFile);

  console.log(`   Found ${files.length} .ts/.tsx files across ${SCAN_DIRS.length} directories\n`);

  let totalFilesChanged = 0;
  let totalReplacements = 0;
  const fileReports = [];

  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    let content = original;
    const fileChanges = [];

    // ── 1. Type scale migration ──────────────────────────────────────────
    for (const [from, to] of TYPE_MAP) {
      const re = new RegExp('\\b' + escapeRegExp(from) + '\\b', 'g');
      const matches = content.match(re);
      if (matches) {
        content = content.replace(re, to);
        fileChanges.push(`  type    ${from}  →  ${to}   (${matches.length}×)`);
        totalReplacements += matches.length;
      }
    }

    // ── 2. Rebrand sweep ─────────────────────────────────────────────────
    for (const [from, to] of REBRAND_MAP) {
      // Use split/join (exact-match, not regex) so special chars are safe
      if (content.includes(from)) {
        const count = content.split(from).length - 1;
        content = content.split(from).join(to);
        fileChanges.push(`  rebrand "${from}"  →  "${to}"   (${count}×)`);
        totalReplacements += count;
      }
    }

    // ── Write back if changed ────────────────────────────────────────────
    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      totalFilesChanged++;
      const rel = path.relative(ROOT, file);
      fileReports.push({ file: rel, changes: fileChanges });
    }
  }

  // ─── Report ─────────────────────────────────────────────────────────────
  console.log('═'.repeat(70));
  console.log(`  MIGRATION REPORT`);
  console.log('═'.repeat(70));

  if (fileReports.length === 0) {
    console.log('\n✓ Nothing to migrate — all files already up to date.\n');
    return;
  }

  for (const { file, changes } of fileReports) {
    console.log(`\n📝 ${file}`);
    for (const c of changes) console.log(c);
  }

  console.log('\n' + '═'.repeat(70));
  console.log(`  Files changed:        ${totalFilesChanged}`);
  console.log(`  Replacements total:   ${totalReplacements}`);
  console.log('═'.repeat(70));

  // ─── Post-migration verification ────────────────────────────────────────
  console.log('\n🔎 Post-migration verification...\n');

  const remainingOldTypes = [];
  const remainingOldBrand = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const rel = path.relative(ROOT, file);
    if (/\btext-h[123]\b|\btext-body\b/.test(content)) {
      remainingOldTypes.push(rel);
    }
    if (/Auto[- ]?[Aa]dvertiser|Auto[- ]?ADVERTISER/.test(content)) {
      remainingOldBrand.push(rel);
    }
  }

  if (remainingOldTypes.length === 0) {
    console.log('  ✓ No text-h1/h2/h3/body classes remain');
  } else {
    console.log('  ⚠  Old type classes still present in:');
    remainingOldTypes.forEach((f) => console.log(`     ${f}`));
  }

  if (remainingOldBrand.length === 0) {
    console.log('  ✓ No "Auto Advertiser" strings remain');
  } else {
    console.log('  ⚠  Old brand strings still present in:');
    remainingOldBrand.forEach((f) => console.log(`     ${f}`));
  }

  // ─── Checklist reminder ─────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(70));
  console.log('  NEXT STEPS');
  console.log('─'.repeat(70));
  console.log('  1. Add tokens to apps/web/styles/tokens.css  (Chapter 3.1)');
  console.log('  2. Update apps/web/tailwind.config.ts         (Chapter 3.2)');
  console.log('  3. Replace components/ui/Card.tsx             (Chapter 3.4)');
  console.log('  4. Replace components/ui/Button.tsx           (Chapter 3.4)');
  console.log('  5. Replace components/ui/EmptyState.tsx       (Chapter 3.4)');
  console.log('  6. Replace components/ui/ErrorState.tsx       (Chapter 3.4)');
  console.log('  7. Update app/layout.tsx metadata             (Chapter 3.5)');
  console.log('  8. Update login page <h1>                     (Chapter 3.5)');
  console.log('  9. Run: pnpm typecheck && pnpm --filter @app/web build');
  console.log(' 10. Commit + push → Vercel auto-redeploys');
  console.log('─'.repeat(70) + '\n');
}

main();
