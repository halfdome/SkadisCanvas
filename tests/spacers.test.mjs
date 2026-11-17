import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import Module from 'manifold-3d';
import {defaults,validate} from '../lib/geometry.mjs';
import {chooseBoardDesign,SPACER_BOARD,boardDepth} from '../lib/board-designs.mjs';
import {referenceSolid,spacerSolid,spacerTileParts} from '../lib/spacer-geometry.mjs';
const api=await Module();api.setup();
const bytes=readFileSync(new URL('../public/designs/spacer-reference.bin',import.meta.url));
const reference=referenceSolid(api,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
const c={...chooseBoardDesign(defaults,SPACER_BOARD),cols:1,rows:1};
const solidFromPart=p=>{const mesh=new api.Mesh({numProp:3,vertProperties:Float32Array.from(p.vertices.flat()),triVerts:Uint32Array.from(p.triangles.flat())});mesh.merge();return new api.Manifold(mesh);};

test('spacer defaults preserve the supplied reference solid and its dimensions',()=>{
  const s=spacerSolid(api,reference,c);assert.equal(s.status(),'NoError');
  assert.ok(Math.abs(s.volume()-reference.volume())<1e-6);
  const difference=s.subtract(reference);assert.ok(difference.isEmpty());difference.delete();
  assert.ok(Math.abs(s.boundingBox().max[2]-boardDepth(c))<1e-5);s.delete();validate(c);
});
test('spacer adjustments preserve the entire imported board and mounting bores',()=>{
  const originalBody=reference.trimByPlane([0,0,-1],-5);
  for(const spacerHeight of [2,10,40])for(const spacerDiameter of [10,15,20]){
    const s=spacerSolid(api,reference,{...c,spacerHeight,spacerDiameter});
    assert.equal(s.status(),'NoError');
    assert.ok(Math.abs(s.boundingBox().max[2]-(5+spacerHeight*1.0002))<1e-5);
    const body=s.trimByPlane([0,0,-1],-4.99),expected=originalBody.trimByPlane([0,0,-1],-4.99);
    const missing=expected.subtract(body),extra=body.subtract(expected);
    assert.ok(missing.volume()<.001&&extra.volume()<.001,'board geometry changed');
    const heightOnly=reference.warp(v=>{if(v[2]>5)v[2]=5+(v[2]-5)*spacerHeight/10;});
    for(const x of [12.5,187.5])for(const y of [12.540001,187.540001]){
      const bore=api.Manifold.cylinder(spacerHeight+6,3.8,3.8,32).translate([x,y,0]);
      const original=heightOnly.intersect(bore),changed=s.intersect(bore);
      const lost=original.subtract(changed),added=changed.subtract(original);
      assert.ok(lost.volume()<.002&&added.volume()<.002,'mounting-bore profile changed');
      [bore,original,changed,lost,added].forEach(x=>x.delete());
    }
    heightOnly.delete();
    [s,body,expected,missing,extra].forEach(x=>x.delete());
  }
  originalBody.delete();
});
test('artwork parts and backing partition the spacer solid without overlap',()=>{
  const parts=spacerTileParts(api,reference,c,new Uint8Array([0,1,2,3]),2,2);
  assert.equal(parts.length,5);const solids=parts.map(solidFromPart);
  for(const s of solids)assert.equal(s.status(),'NoError');
  const total=solids.reduce((n,s)=>n+s.volume(),0);assert.ok(Math.abs(total-reference.volume())<.1);
  for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){const overlap=solids[i].intersect(solids[j]);assert.ok(overlap.volume()<.001);overlap.delete();}
  for(const p of parts.slice(1))assert.ok(p.vertices.every(v=>v[2]<=.60001));
  // Source top-left stays at print-space top-right after face-down rotation.
  assert.ok(parts[1].vertices.every(v=>v[0]>=100-1e-4&&v[1]>=c.height/2-1e-4));
  solids.forEach(s=>s.delete());
});
test('spacer selection rejects unsupported edits and checks the full build height',()=>{
  for(const patch of [{spacerHeight:0},{spacerDiameter:25},{width:210},{faceDown:false},{backLabel:true}])assert.throws(()=>validate({...c,...patch}));
  assert.throws(()=>validate({...c,printer:'custom',bedHeight:10}),/allowance/);
});
