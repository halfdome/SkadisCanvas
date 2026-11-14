import earcut from 'earcut';
import {validatePrinter} from './printers.mjs';
import {filamentName} from './filaments.mjs';
import pc from 'polygon-clipping';
export {make3mf,makeProject3mf} from './project3mf.mjs';

export const defaults = {cols:5,rows:8,printer:'h3c',colorCount:8,matchFamily:'Bambu PLA Basic + Matte',bedMargin:5,towerReserve:40,bedWidth:256,bedDepth:256,bedHeight:256,width:200,height:200,gap:0,edgeSlots:true,thickness:5,slotWidth:5,slotHeight:15,pitch:40,layerHeight:0.2,colorLayers:3,pixel:2,faceDown:true,fit:'cover',zoom:1,panX:50,panY:50,palette:['#f0e5cf','#e6a041','#a4533b','#304f4a'],backing:'#f0e5cf'};
export function validate(c) {
  for(const k of ['cols','rows','width','height','gap','thickness','slotWidth','slotHeight','pitch','layerHeight','colorLayers','pixel','zoom','panX','panY']) if(!Number.isFinite(c[k])) throw Error(`Invalid ${k}`);
  if(!Number.isInteger(c.cols)||!Number.isInteger(c.rows)||c.cols<1||c.rows<1||c.cols*c.rows>100) throw Error('Choose between 1 and 100 tiles.');
  if(c.width<40||c.height<40||c.width>500||c.height>500) throw Error('Tile dimensions must be 40–500 mm.');
  if(c.gap<0||c.gap>20||c.thickness<1||c.thickness>20) throw Error('Use a gap of 0–20 mm and thickness of 1–20 mm.');
  if(c.slotWidth<2||c.slotHeight<c.slotWidth||c.slotHeight>c.pitch-4||c.slotWidth>c.pitch/2-4||c.pitch<20||c.pitch>80) throw Error('Slots need clearance within the 20–80 mm hole pitch.');
  if(c.layerHeight<0.08||c.layerHeight>0.4||!Number.isInteger(c.colorLayers)||c.colorLayers<1||c.colorLayers>10||c.colorLayers*c.layerHeight>=c.thickness) throw Error('Colored layers must be thinner than the board.');
  if(c.pixel<0.4||c.pixel>8) throw Error('Surface detail must be 0.4–8 mm per pixel.');
  if(c.zoom<1||c.zoom>3||c.panX<0||c.panX>100||c.panY<0||c.panY>100) throw Error('Invalid image placement.');
  if(!Array.isArray(c.palette)||c.palette.length<1||c.palette.length>8||[...c.palette,c.backing].some(x=>!/^#[0-9a-f]{6}$/i.test(x))) throw Error('Choose 1–8 valid filament colors.');
  validatePrinter(c);
  const n=Math.ceil(c.width/c.pixel)*Math.ceil(c.height/c.pixel);
  if(n>160000||n*c.cols*c.rows>1500000) throw Error('This detail level is too large for browser export. Increase mm/pixel or reduce the tile count.');
}
export function dimensions(c){return {width:c.cols*c.width+(c.cols-1)*c.gap,height:c.rows*c.height+(c.rows-1)*c.gap};}
// A single lattice in installed-wall coordinates. Individual tiles clip it.
export function slots(c,col=0,row=0){
  const result=[],ox=col*(c.width+c.gap),oy=row*(c.height+c.gap),step=c.pitch/2,origin=c.edgeSlots===false?c.pitch/4:0;
  const wall=dimensions(c);
  const firstRow=Math.max(0,Math.floor((oy-c.slotHeight/2-origin)/step));
  for(let r=firstRow;origin+r*step<oy+c.height+c.slotHeight/2;r++){
    const worldY=origin+r*step,xOrigin=origin+(r%2)*step;
    const firstCol=Math.max(0,Math.floor((ox-c.slotWidth/2-xOrigin)/c.pitch));
    for(let k=firstCol;xOrigin+k*c.pitch<ox+c.width+c.slotWidth/2;k++){
      const worldX=xOrigin+k*c.pitch;
      // Keep the outside perimeter closed; only internal seams share slots.
      if(worldX-c.slotWidth/2<0||worldX+c.slotWidth/2>wall.width||worldY-c.slotHeight/2<0||worldY+c.slotHeight/2>wall.height)continue;
      const x=worldX-ox,y=c.height-(worldY-oy);
      if(x+c.slotWidth/2<=0||x-c.slotWidth/2>=c.width||y+c.slotHeight/2<=0||y-c.slotHeight/2>=c.height)continue;
      result.push([x,y]);
    }
  }return result;
}
export function seamSlots(c){
  let count=0;for(let r=0;r<c.rows;r++)for(let col=0;col<c.cols;col++)for(const [x,y]of slots(c,col,r))
    if((col>0&&x-c.slotWidth/2<0)||(col<c.cols-1&&x+c.slotWidth/2>c.width)||(r>0&&y+c.slotHeight/2>c.height)||(r<c.rows-1&&y-c.slotHeight/2<0))count++;
  return count;
}
function rectangle(x,y,w,h){return [[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]];}
function capsule(x,y,w,h){const r=w/2,dy=(h-w)/2,pts=[];for(let i=0;i<=12;i++){let a=i*Math.PI/12;pts.push([x+Math.cos(a)*r,y+dy+Math.sin(a)*r]);}for(let i=0;i<=12;i++){let a=Math.PI+i*Math.PI/12;pts.push([x+Math.cos(a)*r,y-dy+Math.sin(a)*r]);}pts.push(pts[0]);return [pts];}
export function boardShape(c,col=0,row=0){const holes=slots(c,col,row).map(([x,y])=>capsule(x,y,c.slotWidth,c.slotHeight));return holes.length?pc.difference(rectangle(0,0,c.width,c.height),...holes):[rectangle(0,0,c.width,c.height)];}
const area=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
export function extrude(polygons,z0,z1,c){
  const vertices=[],triangles=[];
  for(const poly of polygons){
    const rings=poly.map((r,i)=>{let a=r.slice(0,-1);if((area(a)>0)!==(i===0))a.reverse();return a;});
    const flat=[],holes=[];for(let i=0;i<rings.length;i++){if(i)holes.push(flat.length/2);flat.push(...rings[i].flat());}
    const offset=vertices.length, n=flat.length/2;
    for(const z of [z0,z1])for(let i=0;i<n;i++)vertices.push([flat[i*2],flat[i*2+1],z]);
    const cap=earcut(flat,holes,2);
    for(let i=0;i<cap.length;i+=3){let [a,b,d]=cap.slice(i,i+3);const cross=(flat[b*2]-flat[a*2])*(flat[d*2+1]-flat[a*2+1])-(flat[b*2+1]-flat[a*2+1])*(flat[d*2]-flat[a*2]);if(cross<0)[b,d]=[d,b];triangles.push([offset+d,offset+b,offset+a],[offset+n+a,offset+n+b,offset+n+d]);}
    let start=0;for(const ring of rings){for(let i=0;i<ring.length;i++){const a=offset+start+i,b=offset+start+(i+1)%ring.length;triangles.push([a,b,b+n],[a,b+n,a+n]);}start+=ring.length;}
  }
  // Rotate 180 degrees about Y, keeping a right-handed coordinate system.
  if(c.faceDown)for(const v of vertices){v[0]=c.width-v[0];v[2]=c.thickness-v[2];}
  return {vertices,triangles};
}
function unionRuns(rects){let list=rects;while(list.length>1){const next=[];for(let i=0;i<list.length;i+=64)next.push(pc.union(...list.slice(i,i+64)));list=next;}return list[0]||[];}
export function tileParts(c,labels,nx,ny,col=0,row=0){
  validate(c);const shape=boardShape(c,col,row), depth=c.layerHeight*c.colorLayers;
  const parts=[{name:`Backing - ${filamentName(c,-1)}`,color:c.backing,filament:c.backingFilament,...extrude(shape,0,c.thickness-depth,c)}];
  if(labels.length!==nx*ny)throw Error('Image sample dimensions do not match.');
  for(let color=0;color<c.palette.length;color++){
    const runs=[];
    for(let row=0;row<ny;row++)for(let x=0;x<nx;){if(labels[row*nx+x]!==color){x++;continue;}const start=x;while(x<nx&&labels[row*nx+x]===color)x++;
      // Artwork rows run top to bottom; CAD Y runs bottom to top.
      runs.push(rectangle(start*c.width/nx,(ny-row-1)*c.height/ny,(x-start)*c.width/nx,c.height/ny));
    }
    if(!runs.length)continue;
    const clipped=pc.intersection(unionRuns(runs),shape);if(clipped.length)parts.push({name:`Color ${color+1} - ${filamentName(c,color)} - ${c.palette[color]}`,color:c.palette[color],filament:c.filaments?.[color],...extrude(clipped,c.thickness-depth,c.thickness,c)});
  }return parts;
}
export function makeStl(mesh){const buffer=new ArrayBuffer(84+mesh.triangles.length*50),v=new DataView(buffer);v.setUint32(80,mesh.triangles.length,true);let at=84;for(const tri of mesh.triangles){const pts=tri.map(i=>mesh.vertices[i]);const u=pts[1].map((n,i)=>n-pts[0][i]),w=pts[2].map((n,i)=>n-pts[0][i]);let normal=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];const len=Math.hypot(...normal)||1;normal=normal.map(x=>x/len);for(const n of [...normal,...pts.flat()]){v.setFloat32(at,n,true);at+=4;}at+=2;}return new Uint8Array(buffer);}
export function inspectStl(buffer){
  if(buffer.byteLength>50000000)throw Error('STL limit is 50 MB.');
  const view=new DataView(buffer),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let count=0;
  const add=p=>{if(!p.every(Number.isFinite))throw Error('STL has invalid coordinates.');p.forEach((v,i)=>{min[i]=Math.min(min[i],v);max[i]=Math.max(max[i],v);});count++;};
  if(buffer.byteLength>=84&&84+view.getUint32(80,true)*50===buffer.byteLength){for(let i=0;i<view.getUint32(80,true);i++)for(let j=0;j<3;j++)add([0,1,2].map(k=>view.getFloat32(84+i*50+12+j*12+k*4,true)));}
  else{const text=new TextDecoder().decode(buffer);if(!/^\s*solid\b/i.test(text)||!text.includes('endsolid'))throw Error('Not a recognized STL file.');for(const match of text.matchAll(/vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g))add(match.slice(1).map(Number));}
  if(!count||count%3)throw Error('STL contains no complete triangles.');const size=max.map((x,i)=>x-min[i]);if(size.some(x=>x<=0))throw Error('STL must have three-dimensional bounds.');return {size,triangles:count/3};
}
