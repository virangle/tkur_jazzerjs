// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const stage=path.join(root,'build/runtime');
fs.mkdirSync(stage,{recursive:true});
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
fs.writeFileSync(path.join(stage,'package.json'),JSON.stringify(pkg,null,2)+'\n');
const lock=path.join(root,'runtime-lock.json');
if(fs.existsSync(lock))fs.copyFileSync(lock,path.join(stage,'package-lock.json'));
const npm=spawnSync('npm',[fs.existsSync(lock)?'ci':'install','--ignore-scripts','--no-audit','--no-fund'],{cwd:stage,stdio:'inherit'});
if(npm.status!==0) process.exit(npm.status??1);
const headers=spawnSync('npm',['install','--prefix',path.join(root,'build/headers'),'--ignore-scripts','--no-audit','--no-fund','node-addon-api@8.7.0'],{stdio:'inherit'});
if(headers.status!==0)process.exit(headers.status??1);
const patch=spawnSync(process.execPath,[path.join(root,'scripts/patch-runtime.mjs')],{stdio:'inherit'});
if(patch.status!==0)process.exit(patch.status??1);
console.log('Runtime dependency staging complete; build addon next.');
