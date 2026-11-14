import {defaults,tileParts,makeProject3mf} from '../lib/geometry.mjs';
import {writeFileSync} from 'node:fs';
const printer=process.argv[2]||'x1c',count=Number(process.argv[3]||2);
const c={...defaults,printer,cols:count,rows:1,width:80,height:80,filaments:defaults.palette.map(()=>({family:'Bambu PLA Basic',colorName:'Custom color'})),backingFilament:{family:'Bambu PLA Basic',colorName:'Custom color'}};
const tiles=Array.from({length:count},(_,col)=>({name:`R01-C${String(col+1).padStart(2,'0')}`,row:0,col,parts:tileParts(c,new Uint8Array([0,1,2,3]),2,2,col,0)}));
writeFileSync(`/private/tmp/skadis-${printer}-fixture.3mf`,makeProject3mf(tiles,c));
