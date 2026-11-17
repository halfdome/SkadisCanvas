// CrossSection resolves touching pixel corners before extrusion, avoiding
// non-manifold cap/side junctions in detailed artwork.
export function polygonSolid(api,polygons,z0,z1,c){
 const contours=polygons.flatMap(poly=>poly.map(ring=>ring.slice(0,-1).map(([x,y])=>[c.faceDown?c.width-x:x,y])));
 const section=new api.CrossSection(contours,'EvenOdd');
 let raw;
 try{raw=section.extrude(z1-z0);return raw.translate([0,0,c.faceDown?c.thickness-z1:z0]);}
 finally{raw?.delete();section.delete();}
}
export function meshFromSolid(solid){
 const m=solid.getMesh(),vertices=[],triangles=[];
 for(let i=0;i<m.vertProperties.length;i+=m.numProp)vertices.push(Array.from(m.vertProperties.slice(i,i+3)));
 for(let i=0;i<m.triVerts.length;i+=3)triangles.push(Array.from(m.triVerts.slice(i,i+3)));
 return {vertices,triangles};
}
export function solidExtruder(api){return (polygons,z0,z1,c)=>{
 const solid=polygonSolid(api,polygons,z0,z1,c);
 try{return meshFromSolid(solid);}finally{solid.delete();}
};}
