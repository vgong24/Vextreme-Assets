#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ASSET_NAME=/^[0-9a-f]{64}\.[A-Za-z0-9]+$/;
const ASSET_REF=/\/__assets\/([0-9a-f]{64}\.[A-Za-z0-9]+)/gi;
const TEXT_EXT=new Set(['.html','.htm','.css','.js','.mjs','.cjs','.json','.md','.xml','.txt','.yml','.yaml','.svg']);
const MAX_TEXT_BYTES=10*1024*1024;

function walk(root,skip=new Set()){
  const out=[];
  const visit=dir=>{
    for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
      if(skip.has(ent.name)) continue;
      const full=path.join(dir,ent.name);
      if(ent.isDirectory()) visit(full);
      else if(ent.isFile()) out.push(full);
    }
  };
  visit(root);
  return out;
}
function extractRefs(text){ return [...text.matchAll(ASSET_REF)].map(m=>m[1].toLowerCase()); }
function parseArgs(argv){
  const out={vextreme:null,json:null,verifyHashes:false};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--vextreme') out.vextreme=argv[++i];
    else if(argv[i]==='--json') out.json=argv[++i];
    else if(argv[i]==='--verify-hashes') out.verifyHashes=true;
    else throw new Error('unknown argument: '+argv[i]);
  }
  if(!out.vextreme) throw new Error('--vextreme <path> is required');
  return out;
}
function digest(file){
  const h=crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}
function publicSurface(rel){
  return rel==='index.html'
    || rel==='sw.js'
    || rel.startsWith('pages/')
    || rel.startsWith('styles/')
    || rel.startsWith('widgets/')
    || rel.startsWith('dist/')
    || rel.startsWith('data/');
}
function addRef(map,name,source){
  name=name.toLowerCase();
  if(!map.has(name)) map.set(name,new Set());
  map.get(name).add(source);
}
function summarize(map,byName){
  const refs=[...map.keys()].sort();
  const matched=refs.filter(x=>byName.has(x));
  const missing=refs.filter(x=>!byName.has(x));
  return {
    uniqueReferencedAssets:refs.length,
    matchedReferencedAssets:matched.length,
    missingReferencedAssets:missing.length,
    coveragePercent:refs.length?Number((matched.length*100/refs.length).toFixed(2)):100,
    missing:missing.map(name=>({name,referencedBy:[...map.get(name)].sort()})),
    matched
  };
}

const args=parseArgs(process.argv.slice(2));
const here=path.dirname(fileURLToPath(import.meta.url));
const repoRoot=path.resolve(here,'..');
const assetRoot=path.join(repoRoot,'__assets');
const vextremeRoot=path.resolve(args.vextreme);

const byName=new Map();
for(const file of walk(assetRoot)){
  const name=path.basename(file).toLowerCase();
  if(!ASSET_NAME.test(name)) continue;
  if(byName.has(name)) throw new Error('duplicate canonical asset filename: '+name);
  byName.set(name,file);
}

const allReferrers=new Map();
const publicReferrers=new Map();

for(const file of walk(vextremeRoot,new Set(['.git','node_modules']))){
  const ext=path.extname(file).toLowerCase();
  if(!TEXT_EXT.has(ext)) continue;
  let stat; try{stat=fs.statSync(file);}catch{continue;}
  if(stat.size>MAX_TEXT_BYTES) continue;
  let text; try{text=fs.readFileSync(file,'utf8');}catch{continue;}
  const rel=path.relative(vextremeRoot,file).split(path.sep).join('/');
  const isPublic=publicSurface(rel);
  for(const name of extractRefs(text)){
    addRef(allReferrers,name,rel);
    if(isPublic) addRef(publicReferrers,name,rel);
  }
}

// Follow dependencies from referenced text assets (for example CSS -> fonts/images).
const scanDependencies=(map,label)=>{
  const queue=[...map.keys()];
  const scanned=new Set();
  for(let i=0;i<queue.length;i++){
    const name=queue[i], file=byName.get(name);
    if(!file || scanned.has(name) || !TEXT_EXT.has(path.extname(name).toLowerCase())) continue;
    scanned.add(name);
    let text; try{text=fs.readFileSync(file,'utf8');}catch{continue;}
    for(const nested of extractRefs(text)){
      const isNew=!map.has(nested);
      addRef(map,nested,label+name);
      if(isNew) queue.push(nested);
    }
  }
  return scanned;
};
const allTextDeps=scanDependencies(allReferrers,'asset:');
const publicTextDeps=scanDependencies(publicReferrers,'asset-public:');

const allSummary=summarize(allReferrers,byName);
const publicSummary=summarize(publicReferrers,byName);

const checksumMismatches=[];
if(args.verifyHashes){
  for(const name of allSummary.matched){
    const expected=name.slice(0,64), observed=digest(byName.get(name));
    if(observed!==expected) checksumMismatches.push({name,expected,observed});
  }
}

const report={
  schemaVersion:'vextreme-assets.audit-report/v2',
  canonicalAssets:byName.size,
  publicSurface:{
    uniqueReferencedAssets:publicSummary.uniqueReferencedAssets,
    matchedReferencedAssets:publicSummary.matchedReferencedAssets,
    missingReferencedAssets:publicSummary.missingReferencedAssets,
    coveragePercent:publicSummary.coveragePercent,
    textAssetDependenciesScanned:publicTextDeps.size,
    missing:publicSummary.missing
  },
  fullPreservedCorpus:{
    uniqueReferencedAssets:allSummary.uniqueReferencedAssets,
    matchedReferencedAssets:allSummary.matchedReferencedAssets,
    missingReferencedAssets:allSummary.missingReferencedAssets,
    coveragePercent:allSummary.coveragePercent,
    textAssetDependenciesScanned:allTextDeps.size,
    missing:allSummary.missing
  },
  contentHashesVerified:args.verifyHashes,
  checksumMismatchCount:checksumMismatches.length,
  checksumMismatches,
  unreferencedCanonicalAssets:[...byName.keys()].filter(x=>!allReferrers.has(x)).sort()
};
const json=JSON.stringify(report,null,2)+'\n';
if(args.json) fs.writeFileSync(path.resolve(args.json),json);
process.stdout.write(json);

// The public/runtime surface is the blocking preservation contract.
// Archival-only misses remain visible findings without blocking the store.
if(publicSummary.missingReferencedAssets||checksumMismatches.length) process.exitCode=1;
