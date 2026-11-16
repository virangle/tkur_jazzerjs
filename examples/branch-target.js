// SPDX-License-Identifier: Apache-2.0
'use strict';
// Stable exported ABI for both fuzzing and independent corpus coverage replay.
function classify(data) {
  if(data.length===0)return 'empty';
  if(data[0]===0x41){
    if(data.length>1&&data[1]===0x42)return 'AB';
    return 'A';
  }
  if(data[0]===0x42)return 'B';
  return 'other';
}
function fuzz(data){classify(data);}
module.exports={fuzz,classify};
