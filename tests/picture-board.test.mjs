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
