#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 'vextreme-assets.screenshot-evidence/v1';
const PNG_SIGNATURE = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
const SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;
const LOCALE = /^[a-z0-9][a-z0-9-]*$/;
const COMMIT = /^[0-9a-f]{40}$/i;

function parseArgs(argv) {
  const args = { check:false, root:null };
  for (let i=0; i<argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--check') args.check = true;
    else if (arg === '--root') args.root = argv[++i];
    else if (arg === '--file') args.file = argv[++i];
    else if (arg === '--namespace') args.namespace = argv[++i];
    else if (arg === '--slug') args.slug = argv[++i];
    else if (arg === '--locale') args.locale = argv[++i];
    else if (arg === '--theme') args.theme = argv[++i];
    else if (arg === '--viewport') args.viewport = Number(argv[++i]);
    else if (arg === '--source-repo') args.sourceRepository = argv[++i];
    else if (arg === '--source-commit') args.sourceCommit = argv[++i];
    else if (arg === '--source-path') args.sourcePath = argv[++i];
    else if (arg === '--capture-kind') args.captureKind = argv[++i];
    else throw new Error('unknown argument: ' + arg);
  }
  return args;
}

function digest(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function assertPng(bytes, label) {
  if (bytes.length < PNG_SIGNATURE.length || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(label + ': not a PNG byte stream');
  }
}

function assertSegment(value, label, pattern = SEGMENT) {
  if (typeof value !== 'string' || !pattern.test(value)) {
    throw new Error(label + ': invalid value ' + JSON.stringify(value));
  }
}

function evidenceRoot(root) {
  return path.join(root, 'evidence', 'screenshots');
}

function manifestPath(root) {
  return path.join(evidenceRoot(root), 'manifest.json');
}

function emptyManifest() {
  return {
    schemaVersion: SCHEMA_VERSION,
    repository: 'vgong24/Vextreme-Assets',
    records: {}
  };
}

function readManifest(root) {
  const file = manifestPath(root);
  if (!fs.existsSync(file)) return emptyManifest();
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!value || value.schemaVersion !== SCHEMA_VERSION || value.repository !== 'vgong24/Vextreme-Assets' || !value.records || Array.isArray(value.records)) {
    throw new Error('invalid screenshot evidence manifest');
  }
  return value;
}

function coordinate(record) {
  return [record.namespace, record.slug, record.locale, record.theme, String(record.viewport)].join('/');
}

function canonicalRelativePath(record) {
  return path.posix.join(
    'evidence', 'screenshots',
    record.namespace, record.slug, record.locale, record.theme, String(record.viewport),
    record.sha256 + '.png'
  );
}

function walkPngs(root) {
  const start = evidenceRoot(root);
  if (!fs.existsSync(start)) return [];
  const out = [];
  const visit = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes:true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.png')) {
        out.push(path.relative(root, full).split(path.sep).join('/'));
      }
    }
  };
  visit(start);
  return out.sort();
}

function validateRecord(root, key, record) {
  if (!record || typeof record !== 'object') throw new Error(key + ': record must be an object');
  assertSegment(record.namespace, key + ': namespace');
  assertSegment(record.slug, key + ': slug');
  assertSegment(record.locale, key + ': locale', LOCALE);
  assertSegment(record.theme, key + ': theme');
  if (!Number.isInteger(record.viewport) || record.viewport <= 0) throw new Error(key + ': viewport must be a positive integer');
  if (!/^[0-9a-f]{64}$/.test(record.sha256 || '')) throw new Error(key + ': invalid sha256');
  if (key !== coordinate(record)) throw new Error(key + ': coordinate does not match record fields');
  if (record.path !== canonicalRelativePath(record)) throw new Error(key + ': path is not canonical');
  if (!record.source || typeof record.source !== 'object') throw new Error(key + ': missing source provenance');
  if (typeof record.source.repository !== 'string' || !record.source.repository.includes('/')) throw new Error(key + ': invalid source repository');
  if (!COMMIT.test(record.source.commit || '')) throw new Error(key + ': source commit must be an exact 40-hex commit');
  if (typeof record.source.path !== 'string' || !record.source.path) throw new Error(key + ': source path is required');
  if (typeof record.captureKind !== 'string' || !record.captureKind) throw new Error(key + ': captureKind is required');

  const file = path.join(root, ...record.path.split('/'));
  if (!fs.existsSync(file)) throw new Error(key + ': evidence file is missing: ' + record.path);
  const bytes = fs.readFileSync(file);
  assertPng(bytes, record.path);
  const observed = digest(bytes);
  if (observed !== record.sha256) throw new Error(key + ': sha256 mismatch: ' + observed);
}

function validateManifest(root, manifest) {
  const keys = Object.keys(manifest.records).sort();
  const referenced = new Set();
  for (const key of keys) {
    const record = manifest.records[key];
    validateRecord(root, key, record);
    if (referenced.has(record.path)) throw new Error('duplicate evidence path: ' + record.path);
    referenced.add(record.path);
  }

  const files = walkPngs(root);
  for (const file of files) {
    if (!referenced.has(file)) throw new Error('unmanifested screenshot evidence: ' + file);
  }
  for (const file of referenced) {
    if (!files.includes(file)) throw new Error('manifest references missing screenshot evidence: ' + file);
  }

  return { records:keys.length, files:files.length };
}

function writeManifest(root, manifest) {
  const ordered = {};
  for (const key of Object.keys(manifest.records).sort()) ordered[key] = manifest.records[key];
  manifest.records = ordered;
  fs.mkdirSync(evidenceRoot(root), { recursive:true });
  fs.writeFileSync(manifestPath(root), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

function pruneEmptyDirs(root, start) {
  let current = path.dirname(start);
  const stop = evidenceRoot(root);
  while (current.startsWith(stop) && current !== stop) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length) break;
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function ingest(root, args) {
  for (const [field, value] of [
    ['namespace', args.namespace], ['slug', args.slug], ['locale', args.locale], ['theme', args.theme]
  ]) assertSegment(value, field, field === 'locale' ? LOCALE : SEGMENT);
  if (!Number.isInteger(args.viewport) || args.viewport <= 0) throw new Error('viewport must be a positive integer');
  if (typeof args.sourceRepository !== 'string' || !args.sourceRepository.includes('/')) throw new Error('source-repo must be owner/repository');
  if (!COMMIT.test(args.sourceCommit || '')) throw new Error('source-commit must be an exact 40-hex commit');
  if (!args.file) throw new Error('--file is required');

  const input = path.resolve(args.file);
  const bytes = fs.readFileSync(input);
  assertPng(bytes, input);
  const sha256 = digest(bytes);
  const record = {
    namespace: args.namespace,
    slug: args.slug,
    locale: args.locale,
    theme: args.theme,
    viewport: args.viewport,
    sha256,
    path: '',
    source: {
      repository: args.sourceRepository,
      commit: args.sourceCommit.toLowerCase(),
      path: args.sourcePath || ('pages/' + args.slug + '.html')
    },
    captureKind: args.captureKind || 'localization'
  };
  record.path = canonicalRelativePath(record);

  const manifest = readManifest(root);
  const key = coordinate(record);
  const prior = manifest.records[key];
  if (prior && prior.path !== record.path) {
    const priorFile = path.join(root, ...prior.path.split('/'));
    if (fs.existsSync(priorFile)) {
      fs.unlinkSync(priorFile);
      pruneEmptyDirs(root, priorFile);
    }
  }

  const target = path.join(root, ...record.path.split('/'));
  fs.mkdirSync(path.dirname(target), { recursive:true });
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) fs.writeFileSync(target, bytes);

  manifest.records[key] = record;
  writeManifest(root, manifest);
  const validation = validateManifest(root, manifest);
  return { key, record, validation };
}

const args = parseArgs(process.argv.slice(2));
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(args.root || path.join(here, '..'));

if (args.check) {
  const manifest = readManifest(repoRoot);
  const result = validateManifest(repoRoot, manifest);
  process.stdout.write(JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    mode: 'check',
    ...result
  }, null, 2) + '\n');
} else {
  const result = ingest(repoRoot, args);
  process.stdout.write(JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    mode: 'ingest',
    coordinate: result.key,
    path: result.record.path,
    sha256: result.record.sha256,
    records: result.validation.records
  }, null, 2) + '\n');
}

// [VXG RealForever]
