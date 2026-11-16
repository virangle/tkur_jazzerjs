// SPDX-License-Identifier: Apache-2.0
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dest=path.join(root,'build/runtime/node_modules/@jazzer.js/fuzzer/prebuilds/fuzzer-linux-x64.node');
fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,'build/native/tkur_jazzerjs.node'),dest);
for(const name of ['runtime','licenses'])fs.cpSync(path.join(root,name),path.join(root,'build/runtime',name),{recursive:true});
