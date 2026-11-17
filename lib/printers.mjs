import {boardDepth} from './board-designs.mjs';
import profiles from './bambu-profiles.mjs';
const coordinates = area => area.flatMap(p => p.trim().split(',').map(pair => pair.split('x').map(Number)));
const bounds = area => {
  const pts=coordinates(area),xs=pts.map(([x])=>x),ys=pts.map(([,y])=>y);
  return {left:Math.min(...xs),right:Math.max(...xs),front:Math.min(...ys),rear:Math.max(...ys)};
};
const openFrame=new Set(['a1','a1mini','a2l','p1p']);
function describe(key,{machine}) {
  const bed=bounds(machine.printable_area);
  // Keep the tile and prime tower inside every nozzle's reach, since Studio
  // can assign materials to either nozzle during slicing.
  const tools=(machine.extruder_printable_area||[]).map(area=>bounds([area]));
  const reach=tools.reduce((a,t)=>({left:Math.max(a.left,t.left),right:Math.min(a.right,t.right),
    front:Math.max(a.front,t.front),rear:Math.min(a.rear,t.rear)}),bed);
  const excludeLeft=machine.bed_exclude_area?.length?bounds(machine.bed_exclude_area).right:0;
  return {
    name:key==='x1c'?'Bambu X1C':machine.printer_model.replace(' Lab',''),
    width:bed.right,depth:bed.rear,height:key==='x1c'||key==='x1e'||key==='x1'||key==='p1p'||key==='p1s'?256:Number(machine.printable_height),
    excludeLeft,reach,openFrame:openFrame.has(key),colorCount:['h3c','x1c'].includes(key)?8:4
  };
}
export const printers={
  ...Object.fromEntries(Object.entries(profiles).map(([key,profile])=>[key,describe(key,profile)])),
  custom:{name:'Custom printer',width:256,depth:256,height:256,excludeLeft:0}
};
export function printerLimits(c){
  const key=c.printer||'custom',base=printers[key];if(!base)throw Error('Choose a valid printer.');
  const p=key==='custom'?{...base,width:c.bedWidth??256,depth:c.bedDepth??256,height:c.bedHeight??256}:base;
  const margin=c.bedMargin??5,requestedReserve=c.towerReserve??40;
  const reach=p.reach??{left:0,right:p.width,front:0,rear:p.depth};
  const towers=towerOptions(c,{...p,reach},margin),tower=towers?.standard,compactTower=towers?.compact,reserve=Math.max(requestedReserve,compactTower?.reserve??0);
  for(const [label,v]of Object.entries({bedWidth:p.width,bedDepth:p.depth,bedHeight:p.height,bedMargin:margin,towerReserve:reserve}))if(!Number.isFinite(v)||v<0)throw Error(`Invalid ${label}.`);
  if(p.width<40||p.depth<40||p.height<1||p.width>1000||p.depth>1000||p.height>1000||margin>50||reserve>150)throw Error('Check printer dimensions and clearance.');
  // Conservative rectangle to the right of X1C's front-left 18 × 28 mm exclusion.
  return {...p,reach,usableWidth:reach.right-Math.max(reach.left,p.excludeLeft)-2*margin,usableDepth:reach.rear-reach.front-2*margin-reserve,margin,reserve,tower,compactTower,towerRequired:!!towers};
}
export function validatePrinter(c){if(!c.printer)return;const p=printerLimits(c);if(c.width>p.usableWidth||c.height>p.usableDepth||boardDepth(c)>p.height)throw Error(`${p.name}: board exceeds the configured ${p.usableWidth} × ${p.usableDepth} × ${p.height} mm allowance. Reduce board size or adjust clearances.`);}

// Bambu Studio PartPlate::estimate_wipe_tower_size uses a square rib tower
// derived from prime volume, layer height and filament count. Keep its stock
// geometry; reserve clearance instead of stretching it into a thin rectangle.
function towerOptions(c,p,margin){
  const profile=profiles[c.printer];if(!profile)return null;
  const materials=new Map();
  [...(c.palette||[]),c.backing].forEach((color,i)=>{if(!color)return;const family=(i<(c.palette||[]).length?c.filaments?.[i]:c.backingFilament)?.family||'Generic PLA';materials.set(`${family}|${color.toLowerCase()}`,profile.filaments[family]||profile.filaments['Generic PLA']);});
  if(materials.size<2)return null;
  const prime=Math.max(...[...materials.values()].flatMap(f=>[...(f.filament_prime_volume||['30']),...(f.filament_prime_volume_nc||[])].map(Number)));
  const change=Math.max(...[...materials.values()].flatMap(f=>(f.filament_change_length||['0']).map(Number)))*Math.PI*1.75**2/4;
  const volume=(prime+change)*(materials.size-1);
  const layer=Number(c.layerHeight)||0.2;
  const body=Math.ceil(Math.max(20,Math.sqrt(volume/layer*1.5))+8/Math.sqrt(2)+12);
  const gap=5,edge=Math.max(margin,5);
  const [nx,ny]=profile.machine.default_wipe_tower_pos.split('x').map(Number);
  const side=ny<0.5?'front':'rear';
  const position=(width,height,brim,compact)=>{
    const towerSide=compact?'rear':side;
    const x=Math.max(p.reach.left+edge+brim,Math.min(Math.max(15,nx*p.width),p.reach.right-edge-brim-width));
    const y=Math.max(p.reach.front+edge+brim,Math.min(Math.max(15,(compact?1:ny)*p.depth),p.reach.rear-edge-brim-height));
    if(x+width+brim>p.reach.right-edge+1e-6||y+height+brim>p.reach.rear-edge+1e-6)return null;
    const reserve=Math.ceil(towerSide==='front'?y+height+brim+gap-margin:p.depth-margin-(y-brim-gap));
    return {x,y,width,height,body:width,brim,gap,side:towerSide,reserve,compact};
  };
  const width=Math.min(p.reach.right-Math.max(p.reach.left,p.excludeLeft)-2*edge-10,materials.size>4?240:120),height=Math.ceil(Math.max(20,volume/layer/width*1.5)+8);
  return {standard:position(body,body,Number(profile.process.prime_tower_brim_width),false),compact:position(width,height,0,true)};
}

export function plateLayout(c){
  const p=printerLimits(c),minX=Math.max(p.excludeLeft,p.reach.left)+p.margin,maxX=p.reach.right-p.margin-c.width,minY=p.reach.front+p.margin,maxY=p.reach.rear-p.margin-c.height;
  const center={x:Math.max(minX,Math.min((p.width-c.width)/2,maxX)),y:(p.depth-c.height)/2};
  if(!p.tower&&!p.compactTower){if(p.towerRequired) throw Error('The selected colors leave no room for a prime tower. Reduce the number of filaments.');return {...center,tower:null};}
  for(const t of [p.tower,p.compactTower].filter(Boolean)){
  const left=t.x-t.brim-t.gap,right=t.x+t.width+t.brim+t.gap,bottom=t.y-t.brim-t.gap,top=t.y+t.height+t.brim+t.gap;
  const clear=({x,y})=>x+c.width<=left||x>=right||y+c.height<=bottom||y>=top;
  const fits=({x,y})=>x>=minX-1e-6&&x<=maxX+1e-6&&y>=minY-1e-6&&y<=maxY+1e-6&&clear({x,y});
  const choices=[center,{...center,x:left-c.width},{...center,x:right},{...center,y:bottom-c.height},{...center,y:top}].filter(fits);
  choices.sort((a,b)=>(a.x-center.x)**2+(a.y-center.y)**2-((b.x-center.x)**2+(b.y-center.y)**2));
  if(choices.length)return {...choices[0],tower:t};
  }
  throw Error('This board leaves no room for a prime tower. Reduce board width or height.');
}
