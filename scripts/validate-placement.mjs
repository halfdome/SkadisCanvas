import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import assert from 'node:assert/strict';
import path from 'node:path';
import {defaults,tileParts,makeProject3mf} from '../lib/geometry.mjs';
import {plateLayout,printerLimits} from '../lib/printers.mjs';
import {validateSliced} from './validate-sliced.mjs';
const root=path.resolve('outputs/validation-v5/placement');mkdirSync(root,{recursive:true});
const cases=[['x1c',200,200,4],['h3c',200,200,8],['h3c',320,240,8],['h3c',320,270,8],['h3c',120,120,32]];
for(const [printer,width,height,count] of cases){
 const palette=Array.from({length:count},(_,i)=>`#${((i*657931)%16777216).toString(16).padStart(6,'0')}`);
 const c={...defaults,printer,width,height,palette,sourcePalette:palette,backing:palette[0],cols:1,rows:1,colorCount:count,filaments:palette.map(()=>({family:'Bambu PLA Basic'})),backingFilament:{family:'Bambu PLA Basic'}};
 const layout=plateLayout(c),bed=printerLimits(c),name=`${printer}-${width}x${height}-${count}`,input=path.join(root,name+'.3mf'),output=path.join(root,name+'-sliced.3mf');
 writeFileSync(input,makeProject3mf([{name:'R01-C01',row:0,col:0,parts:tileParts(c,Uint8Array.from(palette.map((_,i)=>i)),count,1,0,0)}],c));
 const run=spawnSync('/Applications/BambuStudio.app/Contents/MacOS/BambuStudio',['--debug','2','--slice','0','--export-3mf',output,input],{cwd:root,encoding:'utf8',timeout:240000,maxBuffer:16e6});
 writeFileSync(input+'.log',(run.stdout||'')+(run.stderr||''));assert.equal(run.status,0,`${name}: ${run.error||run.signal||'slicing failed'}`);
 validateSliced(output,{colors:count});
 const gcode=strFromU8(unzipSync(readFileSync(output))['Metadata/plate_1.gcode']);let feature='',bounds=[Infinity,Infinity,-Infinity,-Infinity];
 for(const line of gcode.split('\n')){if(line.startsWith('; FEATURE:'))feature=line;if(!feature.includes('Prime tower')||!/^G1 /.test(line)||!/ E[\d.]/.test(line))continue;const mx=line.match(/ X([-\d.]+)/),my=line.match(/ Y([-\d.]+)/);if(!mx||!my)continue;const x=+mx[1],y=+my[1];bounds=[Math.min(bounds[0],x),Math.min(bounds[1],y),Math.max(bounds[2],x),Math.max(bounds[3],y)];}
 const [x0,y0,x1,y1]=bounds;assert.ok(x0>=0&&y0>=0&&x1<=bed.width&&y1<=bed.depth,`${name}: tower outside bed ${bounds}`);
 assert.ok(x1+2<=layout.x||x0-2>=layout.x+width||y1+2<=layout.y||y0-2>=layout.y+height,`${name}: tower not clear of tile ${bounds}`);
 console.log(JSON.stringify({name,layout,towerBounds:bounds,colors:count,layerCheck:'passed'}));
}
