#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
'use strict';
require('./api');
// The outer CLI's '--' introduces raw engine arguments. Stall aliases are parsed
// natively by the linked engine; no timer, stdout parser or subprocess exists here.
const head=process.argv.slice(0,2),args=process.argv.slice(2),pass=[];
const separator=args.indexOf('--'),outer=separator<0?args:args.slice(0,separator),raw=separator<0?[]:args.slice(separator+1);
const remaining=[];
for(let i=0;i<outer.length;i++){
 const arg=outer[i];
 if(/^--(?:new|cov)-stall(?:=|$)/.test(arg)){
  pass.push(arg);
  if(!arg.includes('=')&&i+1<outer.length)pass.push(outer[++i]);
 }else remaining.push(arg);
}
process.argv=[...head,...remaining,...(pass.length||separator>=0?['--',...pass,...raw]:[])];
require('@jazzer.js/core/dist/cli');
