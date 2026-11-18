import test from 'node:test';
import assert from 'node:assert/strict';
import Module from 'manifold-3d';
import {readFileSync} from 'node:fs';
import {defaults,tileParts,makeProject3mf,makeStl} from '../lib/geometry.mjs';
import {identifyParts,solidFromMesh} from '../lib/watermark.mjs';
import {createProvenance,TERMS_VERSION} from '../lib/provenance.mjs';
import {solidExtruder} from '../lib/solid-extrusion.mjs';
import {referenceSolid,spacerSolid,spacerTileParts} from '../lib/spacer-geometry.mjs';
import {unzipSync,strFromU8} from 'fflate';
const api=await Module();api.setup();
const base={...defaults,printer:'custom',width:80,height:80,cols:1,rows:1,provenance:{...createProvenance(new Date().toISOString()),exportId:'a50f1234f00d9876'}};
function parts(c){return tileParts(c,new Uint8Array([0,1,2,3]),2,2,0,0,solidExtruder(api));}
function inspect(c,original){
 const result=identifyParts(api,original,c),solids=result.parts.map(p=>solidFromMesh(api,p)),whole=api.Manifold.union(solids);
 try{
  assert.ok(solids.every(s=>s.status()==='NoError'));
  const oldSolids=original.map(p=>solidFromMesh(api,p)),before=api.Manifold.union(oldSolids);
  assert.ok(before.volume()>whole.volume());assert.ok(before.volume()-whole.volume()<250);
  const frontZ=c.faceDown?.1:c.thickness-.1,front=whole.slice(frontZ),oldFront=before.slice(frontZ);
  assert.ok(Math.abs(front.area()-oldFront.area())<1e-4);front.delete();oldFront.delete();before.delete();oldSolids.forEach(s=>s.delete());
  // Recover the ID independently by testing each bit's actual mesh occupancy.
  const m=result.mark.internal;let decoded='';
  for(let i=0;i<64;i++){
   const raw=api.Manifold.cube([.2,.2,.1]),probe=raw.translate([m.x+2+i%8*1.2+.3,m.y+2+Math.floor(i/8)*1.2+.3,m.z+.1]),hit=whole.intersect(probe);
   decoded+=hit.volume()<1e-6?'1':'0';hit.delete();probe.delete();raw.delete();
  }
  assert.equal(BigInt('0b'+decoded).toString(16).padStart(16,'0'),c.provenance.exportId);
  // Both skins around the internal pattern remain solid.
  for(const z of [m.z-.1,m.z+m.depth+.05]){
   const raw=api.Manifold.cube([m.w,m.h,.03]),probe=raw.translate([m.x,m.y,z]),hit=whole.intersect(probe);
   assert.ok(Math.abs(hit.volume()-probe.volume())<1e-4);hit.delete();probe.delete();raw.delete();
  }
 }finally{whole.delete();solids.forEach(s=>s.delete());}
 return result;
}
test('opaque IDs are fresh and do not contain personal information',()=>{
 const a=createProvenance(new Date().toISOString()),b=createProvenance(new Date().toISOString());
 assert.match(a.exportId,/^[a-f0-9]{16}$/);assert.notEqual(a.exportId,b.exportId);assert.equal(a.termsVersion,TERMS_VERSION);
 assert.throws(()=>createProvenance(),/Accept/);
});
test('rear and enclosed IDs preserve front geometry in both orientations and full-depth color',()=>{
 for(const faceDown of [true,false])for(const colorLayers of [3,25]){const c={...base,faceDown,colorLayers};inspect(c,parts(c));}
});
test('IDs avoid picture mounting holes, existing row labels and spacer feet',()=>{
 const c={...base,boardDesign:'solid-picture-board',mountHoles:true,mountHoleDiameter:4.5,mountHoleInset:10,backLabel:true};inspect(c,parts(c));
 const bytes=readFileSync(new URL('../public/designs/spacer-reference.bin',import.meta.url));const ref=referenceSolid(api,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),spacerConfig={...base,boardDesign:'board-with-spacers',spacerHeight:10,spacerDiameter:15},solid=spacerSolid(api,ref,spacerConfig);
 try{inspect(spacerConfig,spacerTileParts(api,solid,spacerConfig,new Uint8Array([0,1,2,3]),2,2));}finally{solid.delete();ref.delete();}
});
test('thin tiles fail explicitly, and metadata and STL header retain the same ID',()=>{
 const thin={...base,thickness:1};assert.throws(()=>identifyParts(api,parts(thin),thin),/at least/);
 const result=identifyParts(api,parts(base),base),file=unzipSync(makeProject3mf([{parts:result.parts,mark:result.mark,name:'R01-C01',col:0,row:0}],base));
 const manifest=JSON.parse(strFromU8(file['Metadata/export-identification.json']));
 assert.equal(manifest.provenance.exportId,base.provenance.exportId);assert.equal(manifest.tiles[0].mark.exportId,base.provenance.exportId);
 assert.match(strFromU8(file['Metadata/service-terms.txt']),/third-party|Third-party/);
 assert.ok(new TextDecoder().decode(makeStl(result.parts[0],base.provenance).slice(0,80)).includes(base.provenance.exportId));
});
