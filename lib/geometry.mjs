import {hasSpacers,spacerDefaults} from './board-designs.mjs';
import {layerPlan} from './layers.mjs';
import {MAX_COLORS} from './palette.mjs';
import earcut from 'earcut';
import {validatePrinter} from './printers.mjs';
import {filamentName,unavailableFilaments} from './filaments.mjs';
import {labelLayout} from './tile-label.mjs';
import pc from 'polygon-clipping';
export {make3mf,makeProject3mf} from './project3mf.mjs';

export const defaults = {boardDesign:'full-flat-board',cols:8,rows:5,printer:'h3c',colorCount:8,matchFamily:'Bambu PLA Basic + Matte',bedMargin:5,towerReserve:0,bedWidth:256,bedDepth:256,bedHeight:256,width:200,height:200,gap:0,edgeSlots:true,thickness:5,slotWidth:5,slotHeight:15,pitch:40,layerHeight:0.2,colorLayers:3,pixel:2,faceDown:true,fit:'cover',zoom:1,panX:50,panY:50,palette:['#f0e5cf','#e6a041','#a4533b','#304f4a'],backing:'#ffffff',backingFilament:{family:'Bambu PLA Basic',colorName:'Jade White'},backingLocked:true};
export function validate(c) {
  for(const k of ['cols','rows','width','height','gap','thickness','slotWidth','slotHeight','pitch','layerHeight','colorLayers','pixel','zoom','panX','panY']) if(!Number.isFinite(c[k])) throw Error(`Invalid ${k}`);
  if(!Number.isInteger(c.cols)||!Number.isInteger(c.rows)||c.cols<1||c.rows<1||c.cols*c.rows>100) throw Error('Choose between 1 and 100 tiles.');
  if(c.width<40||c.height<40||c.width>500||c.height>500) throw Error('Tile dimensions must be 40–500 mm.');
  if(c.gap<0||c.gap>20||c.thickness<1||c.thickness>20) throw Error('Use a gap of 0–20 mm and thickness of 1–20 mm.');
  if(c.slotWidth<2||c.slotHeight<c.slotWidth||c.slotHeight>c.pitch-4||c.slotWidth>c.pitch/2-4||c.pitch<20||c.pitch>80) throw Error('Slots need clearance within the 20–80 mm hole pitch.');
  const layers=layerPlan(c);
  if(c.layerHeight<0.08||c.layerHeight>0.4)throw Error('Layer height must be 0.08–0.4 mm.');
  if(!layers.valid)throw Error(`Choose 1–${layers.total} colored layers for this board.`);
  if(c.faceDown===false&&!layers.full&&Math.abs(c.thickness/c.layerHeight-Math.round(c.thickness/c.layerHeight))>1e-6)throw Error('For face-up printing, board thickness must be a multiple of layer height.');
  if(c.pixel<0.4||c.pixel>8) throw Error('Surface detail must be 0.4–8 mm per pixel.');
  if(c.zoom<0.25||c.zoom>4||c.panX<0||c.panX>100||c.panY<0||c.panY>100) throw Error('Invalid image placement.');
  if(!Array.isArray(c.palette)||c.palette.length<1||c.palette.length>MAX_COLORS||[...c.palette,c.backing].some(x=>!/^#[0-9a-f]{6}$/i.test(x))) throw Error(`Choose 1–${MAX_COLORS} valid filament colors.`);
  const unavailable=unavailableFilaments(c);
  if(unavailable.length)throw Error(`Choose a different filament for this printer: ${unavailable.join(', ')}.`);
  if(c.backLabel&&layers.backing+1e-8<Math.max(2,Math.ceil(.4/c.layerHeight-1e-8))*c.layerHeight+c.layerHeight)
    throw Error('Increase board thickness or reduce colored layers to leave room for the back label.');
  if(hasSpacers(c)){
    if(Math.abs(c.width-spacerDefaults.width)>1e-6||Math.abs(c.height-spacerDefaults.height)>1e-6||c.thickness!==5)throw Error('The spacer reference keeps its original board dimensions.');
    if(!Number.isFinite(c.spacerHeight)||c.spacerHeight<2||c.spacerHeight>40)throw Error('Spacer height must be 2–40 mm.');
    if(!Number.isFinite(c.spacerDiameter)||c.spacerDiameter<10||c.spacerDiameter>20)throw Error('Spacer diameter must be 10–20 mm.');
    if(c.faceDown===false)throw Error('The spacer board prints face-down, with spacers above the board.');
    if(c.backLabel)throw Error('Back engraving is available on the full flat board.');
  }
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
// Earcut can bridge collinear holes with one long cap edge. Split that
// edge wherever a cavity wall has a vertex so the export has no T-junctions.
function closeCapJunctions(mesh,z){
  const {vertices,triangles}=mesh,edges=new Map();
  const key=(a,b)=>a<b?`${a},${b}`:`${b},${a}`;
  for(const t of triangles)for(let i=0;i<3;i++){
    const a=t[i],b=t[(i+1)%3];
    if(vertices[a][2]===z&&vertices[b][2]===z){
      const k=key(a,b);edges.set(k,(edges.get(k)||0)+1);
    }
  }
  const boundary=[...new Set([...edges].filter(([,n])=>n===1).flatMap(([k])=>k.split(',').map(Number)))];
  return triangles.flatMap(tri=>{
    let faces=[tri];
    for(let i=0;i<3;i++){
      const a=tri[i],b=tri[(i+1)%3];
      if(edges.get(key(a,b))!==1)continue;
      const [x,y]=vertices[a],dx=vertices[b][0]-x,dy=vertices[b][1]-y,den=dx*dx+dy*dy;
      const points=boundary.flatMap(id=>{
        const [px,py]=vertices[id],u=((px-x)*dx+(py-y)*dy)/den;
        return u>1e-8&&u<1-1e-8&&Math.abs((px-x)*dy-(py-y)*dx)<1e-8?[[id,u]]:[];
      }).sort((a,b)=>a[1]-b[1]);
      if(!points.length)continue;
      const ring=[a,...points.map(([id])=>id),b];
      faces=faces.flatMap(f=>{
        const j=f.findIndex((v,k)=>v===a&&f[(k+1)%3]===b);
        return j<0?[f]:ring.slice(1).map((v,k)=>[ring[k],v,f[(j+2)%3]]);
      });
    }
    return faces;
  });
}

function engravedBacking(c,shape,height,col,row){
  const {cells,depth}=labelLayout(c,col,row,slots(c,col,row));
  const cut=unionRuns(cells.map(cell=>rectangle(...cell)));
  const unrotated={...c,faceDown:false},vertices=[],triangles=[],indices=new Map();
  const stitch=({vertices:pts,triangles:faces},keep,invert=false)=>{
    for(const face of faces){
      const corners=face.map(i=>pts[i]);
      if(!keep(corners))continue;
      const ids=corners.map(v=>{
        const key=v.map(x=>x.toFixed(7)).join(',');
        if(!indices.has(key)){indices.set(key,vertices.length);vertices.push(v);}
        return indices.get(key);
      });
      triangles.push(invert?ids.reverse():ids);
    }
  };
  const bottom=pts=>pts.every(v=>v[2]===0);
  stitch(extrude(shape,0,height,unrotated),pts=>!bottom(pts));
  stitch(extrude(pc.difference(shape,cut),0,height,unrotated),bottom);
  stitch(extrude(cut,0,depth,unrotated),pts=>!bottom(pts),true);
  const faces=closeCapJunctions({vertices,triangles},0);
  if(c.faceDown)for(const v of vertices){v[0]=c.width-v[0];v[2]=c.thickness-v[2];}
  return {vertices,triangles:faces};
}
export function tileParts(c,labels,nx,ny,col=0,row=0,extruder=extrude){
  validate(c);const shape=boardShape(c,col,row), {backing}=layerPlan(c);
  const parts=[];
  if(backing>0)parts.push({name:`Backing - ${filamentName(c,-1)}`,color:c.backing,filament:c.backingFilament,...(c.backLabel?engravedBacking(c,shape,backing,col,row):extruder(shape,0,backing,c))});
  for(const {polygons,...metadata} of colorRegions(c,labels,nx,ny)){
    const clipped=pc.intersection(polygons,shape);
    if(clipped.length)parts.push({...metadata,...extruder(clipped,backing,c.thickness,c)});
  }return parts;
}
export function colorRegions(c,labels,nx,ny){
  if(labels.length!==nx*ny)throw Error('Image sample dimensions do not match.');
  const regions=[];
  for(let color=0;color<=c.palette.length;color++){
    const runs=[];
    for(let row=0;row<ny;row++)for(let x=0;x<nx;){if(labels[row*nx+x]!==color){x++;continue;}const start=x;while(x<nx&&labels[row*nx+x]===color)x++;
      runs.push(rectangle(start*c.width/nx,(ny-row-1)*c.height/ny,(x-start)*c.width/nx,c.height/ny));
    }
    if(!runs.length)continue;
    const background=color===c.palette.length,hex=background?c.backing:c.palette[color],filament=background?c.backingFilament:c.filaments?.[color];
    regions.push({polygons:pc.union(unionRuns(runs)),name:background?'Background':`Color ${color+1} - ${filamentName(c,color)} - ${hex}`,color:hex,filament});
  }return regions;
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
