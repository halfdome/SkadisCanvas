import {slicedPlates} from './sliced-plates.mjs';
import assert from 'node:assert/strict';
// Inspect actual Bambu-generated G-code, excluding tower/custom extrusion.
export function inspectLayers(gcode){
 let z=0,tool=null,feature='Custom';const layers=new Map();
 for(const command of gcode.split('\n')){
  const line=command.trimStart();
  let m;if((m=line.match(/^; Z_HEIGHT: ([\d.]+)/))){z=Number(m[1]);layers.set(z,new Set());}
  if((m=line.match(/^M620 S(\d+)A/))&&Number(m[1])<255)tool=Number(m[1]);
  if((m=line.match(/^T(\d+)(?:\s|$)/))&&Number(m[1])<255)tool=Number(m[1]);
  if((m=line.match(/^; FEATURE: (.*)/)))feature=m[1];
  if(z&&layers.has(z)&&/^(?:G1|G2|G3)\s/.test(line)&&/\s[XY]-?[\d.]+/.test(line)&&/\sE[\d.]+/.test(line)&&!['Custom','Prime tower'].includes(feature))layers.get(z).add(tool);
 }
 return layers;
}
export function validateSliced(file,{colors=4,colorLayers=3,layerHeight=.2,thickness=5}={}){
 const plates=slicedPlates(file);assert.ok(plates.length,'Slicer produced G-code');
 for(const [name,code] of plates){const layers=inspectLayers(code);assert.equal(layers.size,Math.ceil(thickness/layerHeight));
  for(const [z,tools] of layers){assert.ok(!tools.has(null),`${name}: unknown filament at ${z}`);if(z<=colorLayers*layerHeight+1e-5)assert.equal(tools.size,colors,`${name}: colors at ${z}`);else assert.deepEqual([...tools],[0],`${name}: only backing above color face at ${z}`);}
  const weights=code.match(/; total filament weight \[g\] : (.+)/)?.[1].split(',').map(Number);assert.ok(weights?.every(x=>x>0),'Every color has nonzero material use');
 }
 return {file,plates:plates.length,layers:Math.ceil(thickness/layerHeight),coloredLayers:colorLayers};
}
if(process.argv[1]?.endsWith('validate-sliced.mjs'))for(const f of process.argv.slice(2))console.log(validateSliced(f));
