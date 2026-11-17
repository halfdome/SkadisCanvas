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
export function spacerSolid(api,reference,c){
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
