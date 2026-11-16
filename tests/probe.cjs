const a=require('../build/native/tkur_jazzerjs.node');
console.log(JSON.stringify({stall:a.tkurStallAbiVersion,compatibility:a.tkurCompatibilityVersion}));
if(a.tkurStallAbiVersion!==1||a.tkurCompatibilityVersion!==1)process.exitCode=1;
