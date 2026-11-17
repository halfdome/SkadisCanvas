import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import Module from 'manifold-3d';
import {defaults,tileParts} from '../lib/geometry.mjs';
import {solidExtruder} from '../lib/solid-extrusion.mjs';
import {estimateUsage} from '../lib/filament-usage.mjs';
import {chooseBoardDesign,SPACER_BOARD} from '../lib/board-designs.mjs';
import {referenceSolid,spacerSolid,spacerTileParts} from '../lib/spacer-geometry.mjs';
const api=await Module();api.setup();
function noisy(n){let seed=42;return Uint8Array.from({length:n*n},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>24)%4;});}
function volume(parts){const solids=[];try{for(const part of parts){const mesh=new api.Mesh({numProp:3,vertProperties:Float32Array.from(part.vertices.flat()),triVerts:Uint32Array.from(part.triangles.flat())});mesh.merge();const solid=new api.Manifold(mesh);solids.push(solid);assert.equal(solid.status(),'NoError');}return solids.reduce((sum,s)=>sum+s.volume(),0);}finally{solids.forEach(s=>s.delete());}}
test('detailed flat artwork remains closed, preserves volume and produces usage',()=>{
 const c={...defaults,cols:1,rows:1};
 for(const faceDown of [true,false]){
  const cfg={...c,faceDown},parts=tileParts(cfg,noisy(50),50,50,0,0,solidExtruder(api));
  const plain=tileParts(cfg,new Uint8Array([0]),1,1,0,0,solidExtruder(api));
  assert.ok(Math.abs(volume(parts)-volume(plain))<.1);
  const usage=estimateUsage(api,parts,cfg);assert.ok(usage.grams>0);assert.equal(usage.materials.length,5);
 }
});
test('detailed spacer artwork preserves the reference and estimates every filament',()=>{
 const c={...chooseBoardDesign(defaults,SPACER_BOARD),cols:1,rows:1},bytes=readFileSync('public/designs/spacer-reference.bin');
 const reference=referenceSolid(api,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));const solid=spacerSolid(api,reference,c);
 try{const parts=spacerTileParts(api,solid,c,noisy(50),50,50);assert.ok(Math.abs(volume(parts)-solid.volume())<.1);const usage=estimateUsage(api,parts,c);assert.ok(usage.grams>0);assert.equal(usage.materials.length,5);}finally{solid.delete();reference.delete();}
});
