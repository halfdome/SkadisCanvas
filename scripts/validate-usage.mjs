// Compare model-only filament length against actual Bambu Studio extrusion paths.
// Usage totals in G-code also include the tower, so compare model features only.
import {readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import assert from 'node:assert/strict';
import Module from 'manifold-3d';
import {defaults,tileParts} from '../lib/geometry.mjs';
import {estimateUsage} from '../lib/filament-usage.mjs';
const api=await Module();api.setup();
for(const file of process.argv.slice(2)){
 const zip=unzipSync(readFileSync(file));
 const settings=JSON.parse(strFromU8(zip['Metadata/project_settings.config']));
 const printer=settings.printer_settings_id.includes('H3C')?'h3c':'x1c';
 const c={...defaults,printer,width:80,height:80,cols:2,rows:1,backLabel:true,filaments:defaults.palette.map(()=>({family:'Bambu PLA Basic',colorName:'Custom color'})),backingFilament:{family:'Bambu PLA Basic',colorName:'Custom color'}};
 for(const col of [0,1]){
  const code=strFromU8(zip[`Metadata/plate_${col+1}.gcode`]);let feature='Custom',relative=true,tool=0;const actual=new Map();
  for(const raw of code.split('\n')){const line=raw.trim();let m;
   if(line.startsWith('; FEATURE: '))feature=line.slice(11);
   if(/^M82\b/.test(line))relative=false;if(/^M83\b/.test(line))relative=true;
   if((m=line.match(/^M620 S(\d+)A/))&&Number(m[1])<255)tool=Number(m[1]);
   if((m=line.match(/^T(\d+)(?:\s|$)/))&&Number(m[1])<255)tool=Number(m[1]);
   if(!/^(?:G1|G2|G3)\s/.test(line)||!/[XY]-?[\d.]+/.test(line)||['Custom','Prime tower'].includes(feature))continue;
   if((m=line.match(/\bE([\d.]+)/))){assert.ok(relative,'Expected relative E values');actual.set(tool,(actual.get(tool)||0)+Number(m[1])/1000);}
  }
  const report=estimateUsage(api,tileParts(c,new Uint8Array([0,1,2,3]),2,2,col,0),c);
  const comparisons=report.materials.map(m=>{
   const tool=settings.filament_colour.findIndex(color=>color.toUpperCase()===m.color),sliced=actual.get(tool);
   assert.ok(sliced>0,`No model extrusion for ${m.color}`);
   const error=Math.abs(m.meters/sliced-1);assert.ok(error<.2,`${file} ${m.color}: estimate differs ${(error*100).toFixed(1)}% from sliced model`);
   return {color:m.color,estimateMeters:+m.meters.toFixed(3),slicedMeters:+sliced.toFixed(3),differencePercent:+(error*100).toFixed(1)};
  });
  console.log(JSON.stringify({file,plate:col+1,comparisons}));
 }
}
