import test from 'node:test';import assert from 'node:assert/strict';
import Module from 'manifold-3d';
import {defaults,validate,boardShape,tileParts,slots,extrude} from '../lib/geometry.mjs';
import {PICTURE_BOARD,chooseBoardDesign,pictureMountHoles,boardDepth} from '../lib/board-designs.mjs';
import {usageConfigKey} from '../lib/usage-calculation.mjs';
const api=await Module();api.setup();
const base={...chooseBoardDesign(defaults,PICTURE_BOARD),cols:2,rows:1,width:120,height:80};
function solid(part){const mesh=new api.Mesh({numProp:3,vertProperties:Float32Array.from(part.vertices.flat()),triVerts:Uint32Array.from(part.triangles.flat())});mesh.merge();return new api.Manifold(mesh);}
test('solid picture style defaults to an uninterrupted slab and retains dimensions',()=>{
 assert.equal(defaults.boardDesign,'full-flat-board');assert.equal(base.mountHoles,false);
 assert.deepEqual(slots(base),[]);assert.deepEqual(pictureMountHoles(base),[]);assert.equal(boardDepth(base),5);
 const mesh=solid(extrude(boardShape(base),0,base.thickness,base));assert.equal(mesh.status(),'NoError');assert.ok(Math.abs(mesh.volume()-120*80*5)<.01);mesh.delete();
 const switched=chooseBoardDesign({...base,width:240,height:160},'full-flat-board');assert.equal(switched.width,240);assert.equal(switched.height,160);
});
test('optional corner holes cut every tile and all artwork layers without adding spacers',()=>{
 for(const faceDown of [true,false])for(const mountHoles of [false,true]){
  const c={...base,faceDown,mountHoles,mountHoleDiameter:6,mountHoleInset:12};validate(c);
  assert.equal(pictureMountHoles(c).length,mountHoles?4:0);
  const body=solid(extrude(boardShape(c),0,c.thickness,c));
  const parts=tileParts(c,new Uint8Array([0,1,2,3]),2,2,1,0).map(solid);
  assert.ok(parts.every(p=>p.status()==='NoError'));assert.equal(parts.length,5);
  assert.ok(Math.abs(parts.reduce((n,p)=>n+p.volume(),0)-body.volume())<.01);
  assert.equal(body.boundingBox().max[2],5);
  if(mountHoles){assert.ok(Math.abs(body.volume()-(120*80*5-4*Math.PI*9*5))<7);
   for(const [x,y] of pictureMountHoles(c)){
    const bore=api.Manifold.cylinder(5,2.9,2.9,24).translate([x,y,0]),overlap=body.intersect(bore);
    assert.ok(overlap.isEmpty());bore.delete();overlap.delete();
   }
  }
  parts.forEach(p=>p.delete());body.delete();
 }
});
test('mounting controls validate edge clearance and invalidate usage; irrelevant slots do not block picture boards',()=>{
 assert.doesNotThrow(()=>validate({...base,slotWidth:0,pitch:0}));
 for(const patch of [{mountHoleDiameter:0},{mountHoleInset:1},{mountHoleInset:39},{mountHoleDiameter:NaN}])assert.throws(()=>validate({...base,mountHoles:true,...patch}));
 for(const patch of [{mountHoles:true},{mountHoleDiameter:6},{mountHoleInset:12}])assert.notEqual(usageConfigKey(base),usageConfigKey({...base,...patch}));
});
test('picture boards can retain back labels without intersecting corner holes',()=>{
 const c={...base,backLabel:true,mountHoles:true};const parts=tileParts(c,new Uint8Array([0]),1,1).map(solid);
 assert.ok(parts.every(p=>p.status()==='NoError'));parts.forEach(p=>p.delete());
});

test('picture spacers reuse four hollow reference legs without introducing hook slots',async()=>{
 const {readFileSync}=await import('node:fs');
 const {choosePictureSpacers,hasSpacers}=await import('../lib/board-designs.mjs');
 const {referenceSolid,spacerSolid,spacerTileParts}=await import('../lib/spacer-geometry.mjs');
 const {spacerFeet}=await import('../lib/spacer-layout.mjs');
 const bytes=readFileSync(new URL('../public/designs/spacer-reference.bin',import.meta.url));
 const reference=referenceSolid(api,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 for(const [width,height,spacerHeight,spacerDiameter] of [[120,80,10,15],[200,200.0800018310547,2,10],[280,160,20,20]])for(const mountHoles of [false,true]){
  const c={...choosePictureSpacers({...base,faceDown:false,backLabel:true},true),width,height,spacerHeight,spacerDiameter,mountHoles};
  validate(c);assert.ok(hasSpacers(c));assert.equal(c.faceDown,true);assert.equal(c.backLabel,false);assert.equal(c.thickness,5);
  const board=spacerSolid(api,reference,c);assert.equal(board.status(),'NoError');
  assert.equal(board.decompose().length,1);assert.ok(Math.abs(board.boundingBox().max[2]-(5+spacerHeight))<.01);
  const legs=board.trimByPlane([0,0,1],5.1);const components=legs.decompose();assert.equal(components.length,4);components.forEach(p=>p.delete());legs.delete();
  const central=api.Manifold.cube([width-40,height-40,5]).translate([20,20,0]);const missing=central.subtract(board);assert.ok(missing.isEmpty(),'No hook holes in the picture surface');central.delete();missing.delete();
  for(const [x,y] of spacerFeet(c)){
   const probe=api.Manifold.cylinder(4.8,1,1,24).translate([x,y,.1]);const cut=probe.intersect(board);
   assert.equal(cut.isEmpty(),mountHoles,'Through holes are optional and align with each leg');probe.delete();cut.delete();
   const hollow=api.Manifold.cylinder(spacerHeight-.2,1,1,24).translate([x,y,5.1]);const inside=board.intersect(hollow);assert.ok(inside.isEmpty());hollow.delete();inside.delete();
  }
  const parts=spacerTileParts(api,board,c,new Uint8Array([0,1,2,3]),2,2).map(solid);
  assert.ok(parts.every(p=>p.status()==='NoError'));
  assert.ok(Math.abs(parts.reduce((sum,p)=>sum+p.volume(),0)-board.volume())<.1);
  parts.forEach(p=>p.delete());board.delete();
 }
 reference.delete();
 const on=choosePictureSpacers(base,true),off=choosePictureSpacers(on,false);
 assert.notEqual(usageConfigKey(base),usageConfigKey(on));assert.equal(hasSpacers(off),false);assert.equal(boardDepth(off),5);
 assert.equal(chooseBoardDesign(on,'full-flat-board').boardDesign,'full-flat-board');assert.equal(hasSpacers(chooseBoardDesign(on,'full-flat-board')),false);
});
