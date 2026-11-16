// SPDX-License-Identifier: Apache-2.0
const assert=require('node:assert/strict');
const {normalizeTarget}=require('../build/runtime/runtime/api.js');
(async()=>{
 await normalizeTarget((data,done)=>done())(Buffer.alloc(0));
 await normalizeTarget((data,done)=>setImmediate(done))(Buffer.alloc(0));
 await assert.rejects(normalizeTarget((data,done)=>{done();done();})(Buffer.alloc(0)),/more than once/);
 await assert.rejects(normalizeTarget((data,done)=>{done();return Promise.resolve();})(Buffer.alloc(0)),/either a Promise or a done/);
 for(const reason of [false,null,undefined,0,'str'])await assert.rejects(normalizeTarget(async()=>{throw reason;})(Buffer.alloc(0)),Error);
 console.log('PASS done success, done deferred, duplicate, mixed contract, falsy rejections');
})().catch(error=>{console.error(error);process.exitCode=1;});
