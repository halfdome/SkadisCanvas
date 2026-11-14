import profiles from './bambu-profiles.mjs';
// Verified against Bambu's published specifications and BambuStudio profiles, 2026-11-06.
export const printers={
  x1c:{name:'Bambu X1C',width:256,depth:256,height:256,excludeLeft:18,source:'https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20X1%20Carbon%200.4%20nozzle.json'},
  h3c:{name:'Bambu H3C',width:330,depth:320,height:325,excludeLeft:0,source:'https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20H3C%200.4%20nozzle.json'},
  custom:{name:'Custom printer',width:256,depth:256,height:256,excludeLeft:0}
};
export function printerLimits(c){
  const key=c.printer||'custom',base=printers[key];if(!base)throw Error('Choose a valid printer.');
  const p=key==='custom'?{...base,width:c.bedWidth??256,depth:c.bedDepth??256,height:c.bedHeight??256}:base;
  const margin=c.bedMargin??5,requestedReserve=c.towerReserve??40;
  const towers=towerOptions(c,p,margin),tower=towers?.standard,compactTower=towers?.compact,reserve=Math.max(requestedReserve,compactTower?.reserve??0);
  for(const [label,v]of Object.entries({bedWidth:p.width,bedDepth:p.depth,bedHeight:p.height,bedMargin:margin,towerReserve:reserve}))if(!Number.isFinite(v)||v<0)throw Error(`Invalid ${label}.`);
  if(p.width<40||p.depth<40||p.height<1||p.width>1000||p.depth>1000||p.height>1000||margin>50||reserve>150)throw Error('Check printer dimensions and clearance.');
  // Conservative rectangle to the right of X1C's front-left 18 × 28 mm exclusion.
  return {...p,usableWidth:p.width-p.excludeLeft-2*margin,usableDepth:p.depth-2*margin-reserve,margin,reserve,tower,compactTower};
}
export function validatePrinter(c){if(!c.printer)return;const p=printerLimits(c);if(c.width>p.usableWidth||c.height>p.usableDepth||c.thickness>p.height)throw Error(`${p.name}: board exceeds the configured ${p.usableWidth} × ${p.usableDepth} × ${p.height} mm allowance. Reduce board size or adjust clearances.`);}

// Bambu Studio PartPlate::estimate_wipe_tower_size uses a square rib tower
// derived from prime volume, layer height and filament count. Keep its stock
// geometry; reserve clearance instead of stretching it into a thin rectangle.
function towerOptions(c,p,margin){
  const profile=profiles[c.printer];if(!profile)return null;
  const materials=new Map();
  [...(c.palette||[]),c.backing].forEach((color,i)=>{if(!color)return;const family=(i<(c.palette||[]).length?c.filaments?.[i]:c.backingFilament)?.family||'Generic PLA';materials.set(`${family}|${color.toLowerCase()}`,profile.filaments[family]||profile.filaments['Generic PLA']);});
  if(materials.size<2)return null;
  const prime=Math.max(...[...materials.values()].flatMap(f=>[...f.filament_prime_volume,...(c.printer==='h3c'?f.filament_prime_volume_nc||[]:[])].map(Number)));
  const change=Math.max(...[...materials.values()].flatMap(f=>(f.filament_change_length||['0']).map(Number)))*Math.PI*1.75**2/4;
  const volume=(prime+change)*(materials.size-1);
  const layer=Number(c.layerHeight)||0.2;
  const body=Math.ceil(Math.max(20,Math.sqrt(volume/layer*1.5))+8/Math.sqrt(2)+12);
  const gap=5,edge=Math.max(margin,5);
  const [nx,ny]=profile.machine.default_wipe_tower_pos.split('x').map(Number);
  const side=ny<0.5?'front':'rear';
  const position=(width,height,brim,compact)=>{
    const towerSide=compact?'rear':side;
    const x=Math.max(15,Math.min(nx*p.width,p.width-edge-brim-width));
    const y=Math.max(15,Math.min((compact?1:ny)*p.depth,p.depth-edge-brim-height));
    const reserve=Math.ceil(towerSide==='front'?y+height+brim+gap-margin:p.depth-margin-(y-brim-gap));
    return {x,y,width,height,body:width,brim,gap,side:towerSide,reserve,compact};
  };
  const width=Math.min(p.width-p.excludeLeft-2*edge-10,materials.size>4?240:120),height=Math.ceil(Math.max(20,volume/layer/width*1.5)+8);
  return {standard:position(body,body,Number(profile.process.prime_tower_brim_width),false),compact:position(width,height,0,true)};
}

export function plateLayout(c){
  const p=printerLimits(c),minX=p.excludeLeft+p.margin,maxX=p.width-p.margin-c.width,minY=p.margin,maxY=p.depth-p.margin-c.height;
  const center={x:Math.max(minX,Math.min((p.width-c.width)/2,maxX)),y:(p.depth-c.height)/2};
  if(!p.tower)return {...center,tower:null};
  for(const t of [p.tower,p.compactTower]){
  const left=t.x-t.brim-t.gap,right=t.x+t.width+t.brim+t.gap,bottom=t.y-t.brim-t.gap,top=t.y+t.height+t.brim+t.gap;
  const clear=({x,y})=>x+c.width<=left||x>=right||y+c.height<=bottom||y>=top;
  const fits=({x,y})=>x>=minX-1e-6&&x<=maxX+1e-6&&y>=minY-1e-6&&y<=maxY+1e-6&&clear({x,y});
  const choices=[center,{...center,x:left-c.width},{...center,x:right},{...center,y:bottom-c.height},{...center,y:top}].filter(fits);
  choices.sort((a,b)=>(a.x-center.x)**2+(a.y-center.y)**2-((b.x-center.x)**2+(b.y-center.y)**2));
  if(choices.length)return {...choices[0],tower:t};
  }
  throw Error('This board leaves no room for a prime tower. Reduce board width or height.');
}
