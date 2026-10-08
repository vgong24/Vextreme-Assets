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

const referrers=new Map();
const addRef=(name,source)=>{
  name=name.toLowerCase();
  if(!referrers.has(name)) referrers.set(name,new Set());
  referrers.get(name).add(source);
};

for(const file of walk(vextremeRoot,new Set(['.git','node_modules']))){
  const ext=path.extname(file).toLowerCase();
  if(!TEXT_EXT.has(ext)) continue;
  let stat; try{stat=fs.statSync(file);}catch{continue;}
  if(stat.size>MAX_TEXT_BYTES) continue;
  let text; try{text=fs.readFileSync(file,'utf8');}catch{continue;}
  for(const name of extractRefs(text)) addRef(name,path.relative(vextremeRoot,file).split(path.sep).join('/'));
}

// Follow dependencies from referenced text assets (for example CSS -> fonts/images).
const queue=[...referrers.keys()];
const scannedTextAssets=new Set();
for(let i=0;i<queue.length;i++){
  const name=queue[i], file=byName.get(name);
  if(!file || scannedTextAssets.has(name) || !TEXT_EXT.has(path.extname(name).toLowerCase())) continue;
  scannedTextAssets.add(name);
  let text; try{text=fs.readFileSync(file,'utf8');}catch{continue;}
  for(const nested of extractRefs(text)){
    const isNew=!referrers.has(nested);
    addRef(nested,'asset:'+name);
    if(isNew) queue.push(nested);
  }
}

const refs=[...referrers.keys()].sort();
const matched=refs.filter(x=>byName.has(x));
const missing=refs.filter(x=>!byName.has(x));
const mismatches=[];
if(args.verifyHashes){
  for(const name of matched){
    const expected=name.slice(0,64), observed=digest(byName.get(name));
    if(observed!==expected) mismatches.push({name,expected,observed});
  }
}
const report={
  schemaVersion:'vextreme-assets.audit-report/v1',
  canonicalAssets:byName.size,
  uniqueReferencedAssets:refs.length,
  matchedReferencedAssets:matched.length,
  missingReferencedAssets:missing.length,
  coveragePercent:refs.length?Number((matched.length*100/refs.length).toFixed(2)):100,
  textAssetDependenciesScanned:scannedTextAssets.size,
  contentHashesVerified:args.verifyHashes,
  checksumMismatchCount:mismatches.length,
  checksumMismatches:mismatches,
  missing:missing.map(name=>({name,referencedBy:[...referrers.get(name)].sort()})),
  matched:matched.map(name=>({name,referencedBy:[...referrers.get(name)].sort()})),
  unreferencedCanonicalAssets:[...byName.keys()].filter(x=>!referrers.has(x)).sort()
};
const json=JSON.stringify(report,null,2)+'\n';
if(args.json) fs.writeFileSync(path.resolve(args.json),json);
process.stdout.write(json);
// Missing consumer references are reported for integration/recovery; they do not make the asset store structurally invalid.\nif(mismatches.length) process.exitCode=1;
