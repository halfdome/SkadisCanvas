import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {defaults,tileParts,makeProject3mf} from '../lib/geometry.mjs';
import {validateSliced} from './validate-sliced.mjs';
// Requires a local Bambu Studio installation. Exits nonzero on import, slicing,
// normative G-code validation, or incorrect colored/backing layers.
const studio=process.env.BAMBU_STUDIO||'/Applications/BambuStudio.app/Contents/MacOS/BambuStudio';
const root=path.resolve('outputs/validation');mkdirSync(root,{recursive:true});
for(const printer of ['x1c','h3c']){
 const c={...defaults,printer,cols:2,rows:1,width:80,height:80,filaments:defaults.palette.map(()=>({family:'Bambu PLA Basic',colorName:'Custom color'})),backingFilament:{family:'Bambu PLA Basic',colorName:'Custom color'}};
 const tiles=Array.from({length:2},(_,col)=>({name:`R01-C0${col+1}`,row:0,col,parts:tileParts(c,new Uint8Array([0,1,2,3]),2,2,col,0)}));
 const dir=path.join(root,printer);mkdirSync(dir,{recursive:true});
 const input=path.join(dir,'fixture.3mf'),output=path.join(dir,'sliced.3mf');writeFileSync(input,makeProject3mf(tiles,c));
 const run=spawnSync(studio,['--debug','2','--slice','0','--export-3mf',output,input],{cwd:dir,encoding:'utf8',timeout:180000,maxBuffer:8e6});
 writeFileSync(path.join(dir,'bambu.log'),(run.stdout||'')+(run.stderr||''));
 if(run.error||run.status!==0)throw Error(`${printer}: slicer failed (${run.status??run.signal}). See ${dir}/bambu.log. ${run.error||''}`);
 console.log(printer,validateSliced(output));
}
