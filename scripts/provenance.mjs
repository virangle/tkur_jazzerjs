// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..'),canonical=path.resolve(root,'../../artifacts/github-publish/tkur_libfuzzer');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const lines=[];for(const dir of ['native/engine','native/addon','native/addon/shared'])for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true}))if(entry.isFile()){
 const relative=`${dir}/${entry.name}`;lines.push(`${hash(path.join(root,relative))}  ${relative}`);
}
fs.writeFileSync(path.join(root,'native-sources.sha256'),lines.sort().join('\n')+'\n');
const timer='TkurStallTimer.h';if(hash(path.join(root,'native/engine',timer))!==hash(path.join(canonical,'src',timer)))throw new Error('Stall timer differs from canonical backend');
fs.copyFileSync(path.join(canonical,'UPSTREAM.md'),path.join(root,'licenses/UPSTREAM.LIBFUZZER.md'));
fs.copyFileSync(path.join(root,'build/runtime/package-lock.json'),path.join(root,'runtime-lock.json'));
const deps=[];const modules=path.join(root,'build/runtime/node_modules');
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(!e.isDirectory())continue;const full=path.join(dir,e.name);
 if(e.name.startsWith('@')){visit(full);continue;}const pkgFile=path.join(full,'package.json');if(fs.existsSync(pkgFile)){
 const p=JSON.parse(fs.readFileSync(pkgFile,'utf8'));deps.push({name:p.name,version:p.version,license:p.license??p.licenses??'SEE PACKAGE LICENSE',repository:p.repository??null});}
 if(fs.existsSync(path.join(full,'node_modules')))visit(path.join(full,'node_modules'));
}}
visit(modules);fs.writeFileSync(path.join(root,'licenses/DEPENDENCIES.json'),JSON.stringify(deps.sort((a,b)=>a.name.localeCompare(b.name)),null,2)+'\n');
// Diff via git with inherited stdio, redirected by parent process to file descriptor (no captured pipe).
const fd=fs.openSync(path.join(root,'native-compatibility.diff'),'w');
const diff=spawnSync('git',['diff','--no-index','--no-prefix',path.join(canonical,'src'),path.join(root,'native/engine')],{stdio:['ignore',fd,'inherit']});fs.closeSync(fd);
if(diff.status!==0&&diff.status!==1)throw new Error(`diff failed ${diff.status}`);
console.log(`Verified canonical timer ${hash(path.join(root,'native/engine',timer))}; recorded ${deps.length} runtime dependencies`);
