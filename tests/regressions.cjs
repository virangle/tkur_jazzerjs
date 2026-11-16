// SPDX-License-Identifier: Apache-2.0
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'build/regressions');fs.mkdirSync(out,{recursive:true});
const cli=path.join(root,'build/runtime/runtime/cli.js'),fixture=path.join(root,'tests/fixture.cjs');
const cases=[
 ['new', 'flat', ['--new-stall=1'],0,/stopping after new-stall/],
 ['cov', 'flat', ['--cov-stall','1'],0,/stopping after cov-stall/],
 ['either', 'flat', ['--new-stall=5','--cov-stall=1'],0,/stopping after cov-stall/],
 ['zero', 'flat', ['--new-stall=0','--cov-stall=0','-runs=30'],0,/#30\s+DONE/],
 ['last', 'flat', ['--new-stall=0','-new_stall=1'],0,/stopping after new-stall/],
 ['negative','flat',['--new-stall=-1'],1,/nonnegative int32/],
 ['overflow','flat',['--cov-stall=2147483648'],1,/nonnegative int32/],
 ['fraction','flat',['--new-stall=1.2'],1,/nonnegative int32/],
 ['crash','crash',['--new-stall=5'],77,/intentional JS crash/],
 ['reject','reject',['--new-stall=5'],77,/non-Error rejection/],
 ['await','async',['--cov-stall=1'],0,/stopping after cov-stall/],
 ['timeout','timeout',['--new-stall=1'],70,/ERROR: libFuzzer: timeout/],
];
let failures=0;const results=[];
for(const [name,mode,args,code,pattern]of cases){
 const dir=path.join(out,name);fs.mkdirSync(dir,{recursive:true});
 const run=cp.spawnSync(process.execPath,[cli,fixture,'--timeout=2000','-i',path.join(root,'tests')+'/', '--',...args,`-artifact_prefix=${dir}/`,'-print_final_stats=1'],{cwd:root,env:{...process.env,TKUR_FIXTURE:mode},encoding:'utf8',timeout:60000});
 const text=(run.stdout||'')+(run.stderr||'');fs.writeFileSync(path.join(dir,'output.log'),text);
 const ok=run.status===code&&pattern.test(text);if(!ok)failures++;
 results.push({name,status:run.status,expected:code,ok,error:run.error?.message,artifacts:fs.readdirSync(dir).filter(f=>/^(crash|timeout)-/.test(f))});
 console.log(`${ok?'PASS':'FAIL'} ${name}: ${run.status}`);
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));
if(failures)process.exitCode=1;
