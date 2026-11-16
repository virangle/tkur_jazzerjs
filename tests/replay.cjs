// SPDX-License-Identifier: Apache-2.0
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'build/replay');fs.mkdirSync(dir,{recursive:true});
const input=path.join(dir,'binary');fs.writeFileSync(input,Buffer.from([0,255,0,13,10]));
const fixture=path.join(root,'tests/fixture.cjs');
const cli=path.join(root,'build/runtime/runtime/cli.js');
let fail=0;const results=[];
for(const sync of [false,true])for(const [entry,expected]of [['binaryError',77],['flat',0]]){
 const name=`${sync?'sync':'async'}-${entry}`;
 const args=[cli,fixture,input,'--fuzz_entry_point',entry,...(sync?['--sync']:[]),'--','-runs=2'];
 const run=cp.spawnSync(process.execPath,args,{cwd:root,encoding:'utf8',timeout:60000});
 const text=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(path.join(dir,`${name}.log`),text);
 const ok=run.status===expected;if(!ok)fail++;
 console.log(`${ok?'PASS':'FAIL'} ${name}: ${run.status}`);results.push({name,status:run.status,expected,ok});
}
fs.writeFileSync(path.join(dir,'results.json'),JSON.stringify(results,null,2));if(fail)process.exitCode=1;
