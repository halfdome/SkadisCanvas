import test from 'node:test';
import assert from 'node:assert/strict';
import {autoPalette,quantize,mappingPalette} from '../lib/image.mjs';
import {matchOriginalColors} from '../lib/filaments.mjs';
import {exportWall} from '../lib/project3mf.mjs';
import {defaults} from '../lib/geometry.mjs';
const rgba=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).concat(255);
const original=['#ffffff','#000000','#00ae42','#c12e1f','#f4ee2a','#0086d6','#ec008c','#ff6a13'];
test('4 → 8 → 3 colors are rebuilt from original pixels, keeping exact source colors',()=>{
 const pixels=Uint8ClampedArray.from(original.flatMap((h,i)=>Array.from({length:50+i},()=>rgba(h)).flat()));
 for(const count of [4,8,3,8]){const source=autoPalette(pixels,count);assert.equal(source.length,count);assert.ok(source.every(x=>original.includes(x)));const mapping=matchOriginalColors(source,'Bambu PLA Basic + Matte');assert.deepEqual(mapping.palette,source);}
 assert.deepEqual(new Set(autoPalette(pixels,8)),new Set(original));
});
test('similar flat colors are not merged into invented rounded averages',()=>{
 const colors=['#304f4a','#314f4b','#a4533b','#f0e5cf'];
 const pixels=Uint8ClampedArray.from(colors.flatMap(h=>Array.from({length:100},()=>rgba(h)).flat()));
 assert.deepEqual(new Set(autoPalette(pixels,8)),new Set(colors));
});
test('a larger requested budget does not duplicate colors in a simple illustration',()=>{
 const pixels=Uint8ClampedArray.from(Array.from({length:100},()=>rgba('#304f4a')).flat());
 assert.deepEqual(autoPalette(pixels,8),['#304f4a']);
});
test('dominant flat fills survive antialias edge shades without RGB averaging',()=>{
 const flat=['#f0e5cf','#e6a041','#a4533b','#304f4a'];
 const pixels=flat.flatMap(h=>Array.from({length:500},()=>rgba(h)).flat());
 for(let i=1;i<50;i++)pixels.push(i+100,80+i,50+i,255);
 for(const count of [4,8]){const source=autoPalette(Uint8ClampedArray.from(pixels),count);assert.deepEqual(new Set(source),new Set(flat));}
});
test('filament edits recolor a source region without changing pixel membership',()=>{
 const c={sourcePalette:['#ff0000','#0000ff'],palette:['#0000ff','#ff0000']};
 const pixels=Uint8ClampedArray.from([rgba('#ff0000'),rgba('#0000ff')].flat());
 assert.deepEqual([...quantize(pixels,mappingPalette(c))],[0,1]);
 assert.deepEqual([...quantize(pixels,c.palette)],[1,0]);
});
test('whole-wall exporter rejects a selected R07/C04 tile or duplicate/missing tiles',()=>{
 assert.throws(()=>exportWall([{col:3,row:6,parts:[],name:'R07-C04'}],defaults),/all 40 tiles/);
 const tiles=Array.from({length:40},(_,i)=>({col:i%5,row:Math.floor(i/5),parts:[]}));tiles[39]=tiles[0];
 assert.throws(()=>exportWall(tiles,defaults),/exactly once/);
});

test('Bambu GUI preserves surface settings while inheriting standard prime towers',async()=>{
 const {makeProject3mf}=await import('../lib/project3mf.mjs');const {unzipSync,strFromU8}=await import('fflate');
 for(const count of [4,8]){
  const c={...defaults,palette:original.slice(0,count),backing:original[0],cols:1,rows:1};
  const parts=c.palette.map((color,i)=>({name:`Color ${i}`,color,vertices:[[0,0,0],[1,0,0],[0,1,0]],triangles:[[0,1,2]]}));
  const z=unzipSync(makeProject3mf([{name:'R01-C01',row:0,col:0,parts}],c));const settings=JSON.parse(strFromU8(z['Metadata/project_settings.config']));
  assert.equal(settings.different_settings_to_system.length,count+2);
  const overrides=new Set(settings.different_settings_to_system[0].split(';'));
  for(const key of ['layer_height','initial_layer_print_height','bottom_shell_layers'])assert.ok(overrides.has(key));
  assert.equal(settings.prime_tower_width,'60');assert.equal(settings.prime_tower_brim_width,'3');assert.notEqual(settings.prime_tower_rib_wall,'0');assert.notEqual(settings.prime_tower_fillet_wall,'0');for(const key of ['prime_tower_width','prime_tower_rib_wall','prime_tower_brim_width','prime_tower_fillet_wall'])assert.ok(!overrides.has(key));
 }
});


test('32 source colors survive palette extraction, labeling and native export',async()=>{
 const {tileParts,validate}=await import('../lib/geometry.mjs');
 const {makeProject3mf}=await import('../lib/project3mf.mjs');
 const {unzipSync,strFromU8}=await import('fflate');
 const colors=Array.from({length:32},(_,i)=>`#${(i*527483).toString(16).padStart(6,'0')}`);
 const pixels=Uint8ClampedArray.from(colors.flatMap(rgba));
 for(const count of [4,16,32,8,32]){const source=autoPalette(pixels,count);assert.equal(source.length,count);assert.ok(source.every(x=>colors.includes(x)));}
 const c={...defaults,printer:'h3c',width:80,height:80,palette:colors,sourcePalette:colors,backing:colors[0],backingFilament:undefined,colorCount:32,cols:1,rows:1};
 validate(c);const labels=quantize(pixels,mappingPalette(c));assert.equal(new Set(labels).size,32);
 const z=unzipSync(makeProject3mf([{name:'R01-C01',row:0,col:0,parts:tileParts(c,labels,32,1,0,0)}],c));
 const settings=JSON.parse(strFromU8(z['Metadata/project_settings.config']));assert.equal(settings.filament_colour.length,32);
 assert.equal(settings.different_settings_to_system.length,34);
 const xml=strFromU8(z['Metadata/model_settings.config']);for(let i=1;i<=32;i++)assert.ok(xml.includes(`key="extruder" value="${i}"`));
 assert.throws(()=>autoPalette(pixels,33),/1–32/);assert.throws(()=>validate({...c,palette:[...colors,'#ff0000']}),/1–32/);
});


test('a chosen backing survives palette regeneration, new artwork and printer defaults',()=>{
 const previous={backing:'#ff6a13',backingFilament:{family:'Bambu PLA Basic',colorName:'Orange'},backingLocked:true};
 for(const source of [original.slice(0,4),original,[original[0]]]){const mapped=matchOriginalColors(source,'Bambu PLA Basic + Matte',previous);assert.equal(mapped.backing,previous.backing);assert.deepEqual(mapped.backingFilament,previous.backingFilament);}
 assert.equal(matchOriginalColors(['#ffffff'],'Bambu PLA Basic',{...previous,backingLocked:false}).backing,'#ffffff');
});
