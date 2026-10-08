#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('usage: node scripts/prepare-pages-site.mjs <staging-root>');
if (siteRoot === repoRoot) throw new Error('refusing to rewrite canonical repository assets; use a staging root');

const assetsRoot = path.join(siteRoot, '__assets');
if (!fs.existsSync(path.join(siteRoot, '.nojekyll'))) throw new Error('staging root is missing .nojekyll');
if (!fs.existsSync(assetsRoot)) throw new Error('staging root is missing __assets');

const CSS_REF = /\/__assets\/([0-9a-f]{64}\.[A-Za-z0-9]+)/gi;
let cssFiles = 0;
let changedCssFiles = 0;
let rewrittenRefs = 0;

for (const name of fs.readdirSync(assetsRoot).sort()) {
  if (!name.toLowerCase().endsWith('.css')) continue;
  cssFiles += 1;
  const file = path.join(assetsRoot, name);
  const before = fs.readFileSync(file, 'utf8');
  const refs = [...before.matchAll(CSS_REF)];
  for (const match of refs) {
    const target = path.join(assetsRoot, match[1].toLowerCase());
    if (!fs.existsSync(target)) throw new Error(`${name}: missing nested asset ${match[1]}`);
  }
  if (!refs.length) continue;
  const after = before.replace(CSS_REF, (_match, target) => `./${target.toLowerCase()}`);
  if (/\/__assets\//i.test(after)) throw new Error(`${name}: root-relative asset reference remains after rewrite`);
  fs.writeFileSync(file, after, 'utf8');
  changedCssFiles += 1;
  rewrittenRefs += refs.length;
}

process.stdout.write(JSON.stringify({
  schemaVersion: 'vextreme-assets.pages-projection/v1',
  canonicalSourceMutated: false,
  cssFiles,
  changedCssFiles,
  rewrittenRefs
}, null, 2) + '\n');

// [VXG RealForever]
