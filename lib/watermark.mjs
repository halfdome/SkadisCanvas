import {meshFromSolid} from './solid-extrusion.mjs';
const font={0:['111','101','101','101','111'],1:['010','110','010','010','111'],2:['111','001','111','100','111'],3:['111','001','111','001','111'],4:['101','101','111','001','001'],5:['111','100','111','001','111'],6:['111','100','111','101','111'],7:['111','001','010','010','010'],8:['111','101','111','101','111'],9:['111','101','111','001','111'],a:['010','101','111','101','101'],b:['110','101','110','101','110'],c:['111','100','100','100','111'],d:['110','101','101','101','110'],e:['111','100','110','100','111'],f:['111','100','110','100','100']};
export function solidFromMesh(api,part){
 const mesh=new api.Mesh({numProp:3,vertProperties:Float32Array.from(part.vertices.flat()),triVerts:Uint32Array.from(part.triangles.flat())});mesh.merge();
 const solid=new api.Manifold(mesh);if(solid.status()!=='NoError'){solid.delete();throw Error('Cannot identify a model with invalid geometry.');}return solid;
}
// Work in exported print coordinates. All cavities are boolean differences, never floating shells.
export function identifyParts(api,parts,c){
 const id=c.provenance?.exportId;if(!/^[0-9a-f]{16}$/.test(id||''))throw Error('Missing export identifier.');
 const owned=[],keep=x=>(owned.push(x),x),cube=(x,y,z,w,h,d)=>{const raw=keep(api.Manifold.cube([w,h,d]));return keep(raw.translate([x,y,z]));};
 try{
  const layer=c.layerHeight,skin=Math.max(.6,2*layer),depth=Math.max(.4,2*layer),body=c.thickness;
  if(body<2*skin+depth-1e-6)throw Error(`Export identifiers need a tile thickness of at least ${(2*skin+depth).toFixed(2)} mm at this layer height.`);
  const solids=parts.map(p=>keep(solidFromMesh(api,p))),whole=keep(api.Manifold.union(solids)),used=[];
  function place(w,h,rear=false){
   for(let y=2;y+h<=c.height-2;y+=2)for(let x=2;x+w<=c.width-2;x+=2){
    if(used.some(r=>x<r.x+r.w+1&&x+w>r.x-1&&y<r.y+r.h+1&&y+h>r.y-1))continue;
    const box=cube(x-.4,y-.4,.01,w+.8,h+.8,body-.02),intersection=box.intersect(whole);
    const contained=Math.abs(intersection.volume()-box.volume())<.0001;intersection.delete();
    if(!contained)continue;
    if(rear){const clearance=cube(x-.4,y-.4,c.faceDown?body+.01:-.11,w+.8,h+.8,.1),covered=clearance.intersect(whole),blocked=covered.volume()>.0001;covered.delete();if(blocked)continue;}
    const result={x,y,w,h};used.push(result);return result;
   }
   throw Error('No clear space for export identification. Increase the tile size or reduce slot size.');
  }
  const rear=place(18.6,6.6,true),internal=place(11.6,11.6),cutters=[];
  const rearZ=c.faceDown?body-depth:-.02;
  [...id].forEach((char,i)=>font[char].forEach((line,row)=>[...line].forEach((on,col)=>{
   if(on!=='1')return;
   const gx=(i%8*4+col)*.6,gy=(1-Math.floor(i/8))*3.6+(4-row)*.6;
   cutters.push(cube(rear.x+(c.faceDown?gx:rear.w-gx-.6)-.02,rear.y+gy-.02,rearZ,.64,.64,depth+.02));
  })));
  // A solid L-shaped framing void establishes orientation; 64 isolated data cells hold the ID.
  const pitch=1.2,cell=.8,z=c.faceDown?Math.floor((body-skin-depth)/layer+1e-6)*layer:Math.ceil(skin/layer-1e-6)*layer;
  cutters.push(cube(internal.x,internal.y,z,.8,11.6,depth),cube(internal.x,internal.y,z,11.6,.8,depth));
  const bits=BigInt('0x'+id);
  for(let i=0;i<64;i++)if((bits>>BigInt(63-i))&1n)cutters.push(cube(internal.x+2+ i%8*pitch,internal.y+2+Math.floor(i/8)*pitch,z,cell,cell,depth));
  const tool=keep(api.Manifold.union(cutters));
  const marked=parts.map((p,i)=>{const result=keep(solids[i].subtract(tool));if(result.status()!=='NoError')throw Error('Export identification could not be applied.');return {...p,...meshFromSolid(result)};});
  return {parts:marked,mark:{exportId:id,coordinates:'print orientation, millimeters',rear:{...rear,z:rearZ,depth},internal:{...internal,z,depth,pitch,cell,encoding:'64 bits, MSB first, rows increasing Y; L frame at minimum X/Y'}}};
 }finally{owned.reverse().forEach(x=>x.delete());}
}
