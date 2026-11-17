import {isPictureBoard} from './board-designs.mjs';
import {referenceSize,referenceFeet,spacerFeet,spacerSlots,resizeCoordinate} from './spacer-layout.mjs';
import {polygonSolid} from './solid-extrusion.mjs';
import {layerPlan} from './layers.mjs';
import {filamentName} from './filaments.mjs';
import {colorRegions,validate} from './geometry.mjs';

export function decodeReference(buffer){
  const d=new DataView(buffer),nv=d.getUint32(0,true),nt=d.getUint32(4,true);
  if(buffer.byteLength!==8+nv*12+nt*12)throw Error('Invalid board reference geometry.');
  return {numProp:3,vertProperties:new Float32Array(buffer.slice(8,8+nv*12)),triVerts:new Uint32Array(buffer.slice(8+nv*12))};
}
export function referenceSolid(api,buffer){
  const mesh=new api.Mesh(decodeReference(buffer));mesh.merge();
  const solid=new api.Manifold(mesh);
  if(solid.status()!=='NoError')throw Error('The reference board is not a closed solid.');
  return solid;
}
function originalSpacerSolid(api,reference,c){
  if(c.spacerHeight===10&&c.spacerDiameter===15)return reference.translate([0,0,0]);
  const [feet,body]=reference.splitByPlane([0,0,1],5);
  // Warp only the spacer section; the complete imported board stays unchanged.
  // Keep the complete mounting-bore profile fixed while changing the outer diameter.
  const changed=feet.warp(v=>{
    const cx=v[0]<100?12.5:187.5,cy=v[1]<100.04?12.540001:187.540001;
    const dx=v[0]-cx,dy=v[1]-cy,r=Math.hypot(dx,dy);
    const u=Math.max(0,Math.min(1,(r-4)/(7.5-4)));
    const nr=r+(c.spacerDiameter/2-7.5)*u;
    if(r){v[0]=cx+dx*nr/r;v[1]=cy+dy*nr/r;}
    v[2]=5+(v[2]-5)*c.spacerHeight/10;
  });
  const result=body.add(changed);
  feet.delete();body.delete();changed.delete();
  if(result.status()!=='NoError'){result.delete();throw Error('Could not build the requested spacers.');}
  return result;
}
export function spacerSolid(api,reference,c){
 const source=originalSpacerSolid(api,reference,c);
 if(!isPictureBoard(c)&&Math.abs(c.width-referenceSize.width)<1e-6&&Math.abs(c.height-referenceSize.height)<1e-6)return source;
 const owned=[source];
 const keep=value=>(owned.push(value),value);
 try{
  // Fill the imported board's holes, retaining its beveled, rounded perimeter.
  const body=keep(reference.trimByPlane([0,0,-1],-5));
  const shell=keep(body.hull());
  let result=keep(shell.warp(v=>{
   v[0]=resizeCoordinate(v[0],referenceSize.width,c.width);
   v[1]=resizeCoordinate(v[1],referenceSize.height,c.height);
  }));
  // Reuse an actual source slot's full 3D profile (including its chamfers).
  const slotBox=keep(api.Manifold.cube([12,24,5]).translate([74,88.04,0]));
  const slotCutter=keep(slotBox.subtract(reference));
  const holes=(isPictureBoard(c)?[]:spacerSlots(c)).map(([x,y])=>keep(slotCutter.translate([x-80,y-100.04,0])));
  const feet=spacerFeet(c);
  const legs=[];
  for(let i=0;i<referenceFeet.length;i++){
   const [x,y]=referenceFeet[i],delta=[feet[i][0]-x,feet[i][1]-y,0];
   const boreBox=keep(api.Manifold.cylinder(5,4.75,4.75,64).translate([x,y,0]));
   const bore=keep(boreBox.subtract(reference));
   if(!isPictureBoard(c)||c.mountHoles)holes.push(keep(bore.translate(delta)));
   const legBox=keep(api.Manifold.cylinder(c.spacerHeight*1.001,c.spacerDiameter/2+.1,c.spacerDiameter/2+.1,64).translate([x,y,5]));
   const leg=keep(source.intersect(legBox));
   legs.push(keep(leg.translate(delta)));
  }
  if(holes.length){const cutters=keep(api.Manifold.union(holes));result=keep(result.subtract(cutters));}
  const resized=api.Manifold.union([result,...legs]);
  if(resized.status()!=='NoError'){resized.delete();throw Error('Could not resize the spacer board.');}
  return resized;
 }finally{owned.reverse().forEach(s=>s.delete());}
}
export function solidMesh(solid){
  const m=solid.getMesh(),vertices=[],triangles=[];
  for(let i=0;i<m.vertProperties.length;i+=m.numProp)vertices.push(Array.from(m.vertProperties.slice(i,i+3)));
  for(let i=0;i<m.triVerts.length;i+=3)triangles.push(Array.from(m.triVerts.slice(i,i+3)));
  return {vertices,triangles};
}
export function spacerTileParts(api,solid,c,labels,nx,ny){
  validate(c);const {depth}=layerPlan(c),parts=[];
  const backing=solid.trimByPlane([0,0,1],depth);
  if(!backing.isEmpty())parts.push({name:`Backing - ${filamentName(c,-1)}`,color:c.backing,filament:c.backingFilament,...solidMesh(backing)});
  backing.delete();
  for(const {polygons,...metadata} of colorRegions(c,labels,nx,ny)){
    const cutter=polygonSolid(api,polygons,c.thickness-depth,c.thickness,{...c,faceDown:true});
    let part;
    try{
      part=solid.intersect(cutter);
      if(part.status()!=='NoError')throw Error('Could not apply the artwork to this board.');
      if(!part.isEmpty())parts.push({...metadata,...solidMesh(part)});
    }finally{cutter.delete();part?.delete();}
  }
  return parts;
}
