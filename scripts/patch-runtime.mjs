// SPDX-License-Identifier: Apache-2.0
// Upstream's if(error) silently discards false/null/undefined throws/rejections.
// Treat each error arrival as a finding, retain raw values as Error.cause.
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const filename=path.join(root,'build/runtime/node_modules/@jazzer.js/core/dist/core.js');
let text=fs.readFileSync(filename,'utf8');
if(!text.includes('TKUR_REJECTION_NORMALIZATION')){
 text=text.replace('function asFindingAwareFuzzFn(originalFuzzFn, dumpCrashingInput = true) {',`function asFindingAwareFuzzFn(originalFuzzFn, dumpCrashingInput = true) {\n    // TKUR_REJECTION_NORMALIZATION\n    const normalizeError = (e) => e instanceof Error ? e : new Error('Fuzz target rejected/threw: ' + String(e), {cause: e});`);
 text=text.replaceAll('fuzzTargetError = e;', 'fuzzTargetError = normalizeError(e);').replaceAll('throwIfError(reason);','throwIfError(normalizeError(reason));').replaceAll('throwIfError(e);','throwIfError(normalizeError(e));');
 fs.writeFileSync(filename,text);
}
const optionFile=path.join(root,'build/runtime/node_modules/@jazzer.js/core/dist/options.js');
const opts=fs.readFileSync(optionFile,'utf8');
fs.writeFileSync(optionFile,opts.replace('opts = opts.concat(`-timeout=${inSeconds}`);','opts = [`-timeout=${inSeconds}`, ...opts]; // explicit raw flags retain last-wins precedence'));
