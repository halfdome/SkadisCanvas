import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'manifold-3d';
import {defaults,extrude,tileParts} from '../lib/geometry.mjs';
import {estimateUsage,combineUsage,materialUsage} from '../lib/filament-usage.mjs';
import {chooseBoardDesign,SPACER_BOARD} from '../lib/board-designs.mjs';
import {referenceSolid,spacerSolid,spacerTileParts} from '../lib/spacer-geometry.mjs';
import {readFileSync} from 'node:fs';
const api=await Module();api.setup();
const c={...defaults,width:40,height:40,cols:1,rows:1,printer:'h3c'};
const rect=(x,w)=>[[[[x,0],[x+w,0],[x+w,40],[x,40],[x,0]]]];
const part=(shape,color='#ffffff',cfg=c)=>({name:'Color',color,filament:{family:'Bambu PLA Basic',colorName:'Custom color'},...extrude(shape,0,5,cfg)});
test('usage integrates shells, two walls and 15% infill instead of counting a solid block',()=>{
 const report=estimateUsage(api,[part(rect(0,40))],c);
 // 8 solid layers; remaining interior is 15% filled with 0.42 + 0.45 mm walls.
 const expected=40*40*5-(40-1.74)**2*(5-1.6)*.85;
 assert.ok(Math.abs(report.materials[0].volume-expected)<1);
 assert.ok(report.grams>0&&report.meters>0);
 assert.ok(report.materials[0].volume<40*40*5*.6);
});
test('color boundaries do not invent extra walls; orientation preserves model usage',()=>{
 const one=estimateUsage(api,[part(rect(0,40))],c);
 const two=estimateUsage(api,[part(rect(0,20),'#ff0000'),part(rect(20,20),'#00ff00')],c);
 assert.ok(Math.abs(one.grams-two.grams)<.01);assert.equal(two.materials.length,2);
 assert.ok(Math.abs(two.materials[0].grams-two.materials[1].grams)<.01);
 const up=estimateUsage(api,[part(rect(0,40),'#ffffff',{...c,faceDown:false})],{...c,faceDown:false});
 assert.ok(Math.abs(up.grams-one.grams)<.01);
});
test('named materials use preset densities; custom materials disclose the PLA assumption',()=>{
 const pla=materialUsage(1000,{family:'Bambu PLA Basic',color:'#fffFFF',name:'white'},'h3c');
 const petg=materialUsage(1000,{family:'Bambu PETG HF',color:'#ffffff',name:'white'},'h3c');
 const custom=materialUsage(1000,{family:'Custom / other brand',color:'#ffffff',name:'white'},'custom');
 assert.equal(pla.grams,pla.density);assert.notEqual(pla.grams,petg.grams);assert.equal(custom.assumedDensity,true);
 const sum=combineUsage([{materials:[pla]},{materials:[pla,petg]}]);assert.equal(sum.materials.length,2);assert.equal(sum.grams,2*pla.grams+petg.grams);
});
test('generated pegboard holes reduce usage and selected tile amounts sum to the canvas',()=>{
 const parts=tileParts(c,new Uint8Array([0,1,2,3]),2,2);
 const r=estimateUsage(api,parts,c),solid=estimateUsage(api,[part(rect(0,40))],c);
 assert.ok(r.grams<solid.grams);
 assert.equal(r.materials.length,5);
 const sum=combineUsage([r,r]);assert.equal(sum.grams,2*r.grams);assert.equal(sum.meters,2*r.meters);
});
test('spacer usage includes each leg and increases with leg height',()=>{
 const base=chooseBoardDesign(defaults,SPACER_BOARD),bytes=readFileSync('public/designs/spacer-reference.bin');
 const ref=referenceSolid(api,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 const values=[];
 try{for(const spacerHeight of [10,20]){const cfg={...base,cols:1,rows:1,spacerHeight},solid=spacerSolid(api,ref,cfg);try{values.push(estimateUsage(api,spacerTileParts(api,solid,cfg,new Uint8Array([0]),1,1),cfg));}finally{solid.delete();}}}finally{ref.delete();}
 assert.ok(values[1].grams>values[0].grams);assert.equal(values[0].materials.length,2);
});

test('thin layers retain the exported minimum 1 mm top skin',()=>{
 const cfg={...c,layerHeight:.1};
 const r=estimateUsage(api,[part(rect(0,40))],cfg);
 const expected=40*40*5-(40-1.74)**2*(5-1.3)*.85;
 assert.ok(Math.abs(r.materials[0].volume-expected)<1);
});
