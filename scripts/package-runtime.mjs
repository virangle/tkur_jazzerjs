// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),stage=path.join(root,'build/runtime');
const fuzzer=path.join(stage,'node_modules/@jazzer.js/fuzzer');
fs.rmSync(path.join(fuzzer,'prebuilds'),{recursive:true,force:true});
fs.mkdirSync(path.join(fuzzer,'prebuilds'));
fs.copyFileSync(path.join(root,'build/native/tkur_jazzerjs.node'),path.join(fuzzer,'prebuilds/fuzzer-linux-x64.node'));
for(const name of ['runtime','licenses']) fs.cpSync(path.join(root,name),path.join(stage,name),{recursive:true});
for(const name of ['README.md','UPSTREAM.md']) if(fs.existsSync(path.join(root,name)))fs.copyFileSync(path.join(root,name),path.join(stage,name));
// Upstream lists developer-only CMake/header tooling as runtime dependencies.
// The compiled loader requires none of them; drop from this binary-only manifest
// and compute the actual transitive runtime closure without running npm scripts.
const fuzzerPackage=path.join(fuzzer,'package.json');
const fp=JSON.parse(fs.readFileSync(fuzzerPackage,'utf8'));delete fp.dependencies;fs.writeFileSync(fuzzerPackage,JSON.stringify(fp,null,2)+'\n');
const moduleRoot=path.join(stage,'node_modules'),seen=new Set();
function locate(name,from){let at=from;while(at.startsWith(stage)){const candidate=path.join(at,'node_modules',name);if(fs.existsSync(path.join(candidate,'package.json')))return candidate;const parent=path.dirname(at);if(parent===at)break;at=parent;}throw new Error(`Missing runtime dependency ${name}`);}
function mark(name,from){const at=locate(name,from);if(seen.has(at))return;seen.add(at);const p=JSON.parse(fs.readFileSync(path.join(at,'package.json'),'utf8'));for(const dep of Object.keys({...p.dependencies,...p.optionalDependencies})){try{mark(dep,at);}catch(error){if(!p.optionalDependencies?.[dep])throw error;}}}
mark('@jazzer.js/core',stage);
function prune(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(!e.isDirectory())continue;const at=path.join(dir,e.name);if(e.name.startsWith('@')){prune(at);continue;}if(!seen.has(at))fs.rmSync(at,{recursive:true,force:true});else if(fs.existsSync(path.join(at,'node_modules')))prune(path.join(at,'node_modules'));}}
prune(moduleRoot);
// No source files, sourcemaps containing upstream TS, native build files or build scripts.
function clean(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name);
 if(entry.isDirectory()){if(['test','tests','scripts','.github'].includes(entry.name))fs.rmSync(full,{recursive:true,force:true});else clean(full);}
 else if(/\.(ts|tsx|cpp|cc|c|h|hpp|map)$/.test(entry.name)||entry.name==='CMakeLists.txt')fs.rmSync(full);
 else if(entry.name==='package.json'){
 const pkg=JSON.parse(fs.readFileSync(full,'utf8'));delete pkg.scripts;delete pkg.devDependencies;fs.writeFileSync(full,JSON.stringify(pkg,null,2)+'\n');
 }
}}
clean(path.join(stage,'node_modules'));
const out=path.join(root,'artifacts');fs.mkdirSync(out,{recursive:true});
const proc=spawnSync('npm',['pack','--ignore-scripts','--pack-destination',out],{cwd:stage,stdio:'inherit'});
process.exit(proc.status??1);
