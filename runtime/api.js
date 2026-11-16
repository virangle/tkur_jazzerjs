// SPDX-License-Identifier: Apache-2.0
'use strict';
const {fuzzer}=require('@jazzer.js/fuzzer');
const addon=require('@jazzer.js/fuzzer/dist/addon').addon;
if(addon.tkurStallAbiVersion!==1||addon.tkurCompatibilityVersion!==1)throw new Error('tkur_jazzerjs requires native stall ABI 1 and compatibility ABI 1');
function failure(reason){return reason instanceof Error?reason:new Error(`Fuzz target rejected/threw: ${String(reason)}`,{cause:reason});}
// All closures passed to JS own heap state. Never capture the native stack input or deferred.
// Native receives a single-argument Promise target and waits until it settles.
function normalizeTarget(target){
 if(typeof target!=='function')throw new TypeError('Target must be a function');
 if(target.length<2)return async function(data){try{return await target(data);}catch(e){throw failure(e);}};
 return function(data){return new Promise((resolve,reject)=>{
  let calls=0,returned=false,settled=false,result,error;
  const finish=()=>{if(!returned||settled||calls===0)return;settled=true;error===undefined?resolve():reject(failure(error));};
  function done(err){
   if(++calls>1){const e=new Error('done callback called more than once');if(!settled){error=e;finish();}else queueMicrotask(()=>{throw e;});return;}
   if(err!==null&&err!==undefined)error=err;
   // Defer settlement until the target returns, to reject done+Promise and sync double done safely.
   finish();
  }
  try{result=target(data,done);}catch(e){error=failure(e);calls=Math.max(calls,1);}
  returned=true;
  if(result&&typeof result.then==='function'){
   Promise.resolve(result).catch(()=>{});error=new Error('A target must use either a Promise or a done callback, not both');calls=Math.max(calls,1);
  }
  finish();
 });};
}
const nativeStartSync=fuzzer.startFuzzing;
fuzzer.startFuzzing=(target,args,signalHandler=()=>{})=>nativeStartSync(function(data){
 try{
  if(target.length>1)throw new Error('done target requires asynchronous mode');
  const result=target(data);
  if(result&&typeof result.then==='function'){
   Promise.resolve(result).catch(()=>{});
   throw new Error('Promise target requires asynchronous mode (remove --sync)');
  }
  return result;
 }catch(error){console.error(error);fuzzer.printAndDumpCrashingInput();throw failure(error);}
},args,signalHandler);
const nativeStartAsync=fuzzer.startFuzzingAsync;
fuzzer.startFuzzingAsync=(target,args)=>{
 const normalized=normalizeTarget(target);
 return nativeStartAsync(async function(data){
  try{return await normalized(data);}catch(error){
   // Adapter contract failures occur outside upstream finding wrapper. Dump the
   // still-active native input before -2 unwinds, preserving failure artifacts.
   console.error(error);
   fuzzer.printAndDumpCrashingInput();
   throw failure(error);
  }
 },args);
};
module.exports={normalizeTarget,fuzzer,stallAbiVersion:addon.tkurStallAbiVersion,compatibilityVersion:addon.tkurCompatibilityVersion};
