// SPDX-License-Identifier: Apache-2.0
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),stage=path.join(root,'build/runtime');
let count=0,native=0;const failures=[];
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name),relative=path.relative(stage,full);if(e.isDirectory()){visit(full);continue;}count++;
 if(/\.(?:ts|tsx|cpp|cc|c|h|hpp|map|py)$/.test(e.name)||e.name==='CMakeLists.txt')failures.push(relative);
 if(e.name.endsWith('.node'))native++;
 if(e.name==='package.json'){const p=JSON.parse(fs.readFileSync(full,'utf8'));if(p.scripts&&Object.keys(p.scripts).length)failures.push(`scripts: ${relative}`);}
}}
visit(path.join(stage,'node_modules'));assert.equal(native,1);assert.deepEqual(failures,[]);console.log(JSON.stringify({files:count,native,prohibited:failures},null,2));
