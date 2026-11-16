// SPDX-License-Identifier: Apache-2.0
'use strict';
const mode=process.env.TKUR_FIXTURE||'flat';
exports.flat=function(data){void data;};
exports.binaryError=function(data){if(data.length===5&&data[0]===0&&data[1]===255&&data[2]===0&&data[3]===13&&data[4]===10)throw new Error('QA_BINARY_EXACT');};
let calls=0;
exports.fuzz=async function(data){
 calls++;
 if(mode==='crash'&&calls>4)throw new Error('intentional JS crash');
 if(mode==='reject'&&calls>4)throw 'non-Error rejection';
 if(mode==='timeout')await new Promise(()=>{});
 if(mode==='slow-init'&&calls<=3)await new Promise(r=>setTimeout(r,700));
 if(mode==='async')await new Promise(r=>setTimeout(r,3));
 if(mode==='branch'){if(data[0]===65){if(data[1]===66)return 3;return 2;}return 1;}
};
