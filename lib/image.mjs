import {lab} from './filaments.mjs';
import {dimensions} from './geometry.mjs';
export function paintImage(ctx,image,c,w,h){
  ctx.fillStyle=c.backing;ctx.fillRect(0,0,w,h);
  const d=dimensions(c);const scale=(c.fit==='cover'?Math.max(d.width/image.width,d.height/image.height):Math.min(d.width/image.width,d.height/image.height))*c.zoom;
  const iw=image.width*scale,ih=image.height*scale;
  ctx.drawImage(image,(d.width-iw)*c.panX/100*w/d.width,(d.height-ih)*c.panY/100*h/d.height,iw*w/d.width,ih*h/d.height);
  return scale;
}
const distance=(a,b)=>a.reduce((sum,v,k)=>sum+(v-b[k])**2,0);
export function quantize(data,palette){
  const colors=palette.map(lab),labels=new Uint8Array(data.length/4),cache=new Map();
  for(let i=0;i<labels.length;i++){
    const key=(data[i*4]<<16)|(data[i*4+1]<<8)|data[i*4+2];
    let idx=cache.get(key);
    if(idx===undefined){const target=lab('#'+key.toString(16).padStart(6,'0'));let best=Infinity;idx=0;for(let j=0;j<colors.length;j++){const d=distance(colors[j],target);if(d<best){best=d;idx=j;}}cache.set(key,idx);}
    labels[i]=idx;
  }
  return labels;
}
// Labels always follow the source palette. Changing a suggested filament must
// recolor that region, not reclassify the original artwork against the filament.
export const mappingPalette=c=>c.sourcePalette?.length===c.palette.length?c.sourcePalette:c.palette;
export function autoPalette(data,count){
  if(!Number.isInteger(count)||count<1||count>8)throw Error('Choose 1–8 surface colors.');
  const hist=new Map();
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<128)continue;
    const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];hist.set(key,(hist.get(key)||0)+1);
  }
  const points=[...hist].map(([key,n])=>({hex:'#'+key.toString(16).padStart(6,'0'),n})).sort((a,b)=>b.n-a.n||a.hex.localeCompare(b.hex));
  if(!points.length)throw Error('Image has no visible pixels.');
  if(points.length<=count)return points.map(p=>p.hex);
  // Keep exact RGB values. Dominant, well-separated source colors seed Lab
  // clusters; tiny antialias shades close to a seed do not create extra colors.
  for(const p of points)p.lab=lab(p.hex);
  const total=points.reduce((sum,p)=>sum+p.n,0),solid=points.filter(p=>p.n>=Math.max(2,total*.0005));
  const candidates=solid.reduce((sum,p)=>sum+p.n,0)>=total*.9?solid:points;
  const centers=[points[0].lab];
  while(centers.length<count){let best=0,pick=null;for(const p of candidates){const d=Math.min(...centers.map(c=>distance(c,p.lab)));if(d<36)continue;const score=d*Math.sqrt(p.n);if(score>best){best=score;pick=p;}}if(!pick)break;centers.push(pick.lab);}
  let groups;
  for(let iter=0;iter<10;iter++){
    groups=centers.map(()=>[]);
    for(const p of points){let best=Infinity,j=0;centers.forEach((c,k)=>{const d=distance(c,p.lab);if(d<best){best=d;j=k;}});groups[j].push(p);}
    groups.forEach((group,j)=>{const n=group.reduce((s,p)=>s+p.n,0);if(n)centers[j]=[0,1,2].map(k=>group.reduce((s,p)=>s+p.lab[k]*p.n,0)/n);});
  }
  // Use a dominant actual source pixel, never an averaged/invented RGB value.
  return groups.map((group,j)=>({n:group.reduce((s,p)=>s+p.n,0),p:group.reduce((best,p)=>!best||p.n/(1+distance(p.lab,centers[j])/25)>best.n/(1+distance(best.lab,centers[j])/25)?p:best,null)})).filter(g=>g.p).sort((a,b)=>b.n-a.n||a.p.hex.localeCompare(b.p.hex)).map(g=>g.p.hex);
}
export function originalPalette(image,count){
  const can=document.createElement('canvas'),scale=Math.min(1,768/Math.max(image.width,image.height));
  can.width=Math.max(1,Math.round(image.width*scale));can.height=Math.max(1,Math.round(image.height*scale));
  const ctx=can.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,0,0,can.width,can.height);
  return autoPalette(ctx.getImageData(0,0,can.width,can.height).data,count);
}
export function sampleTile(image,c,col,row){const nx=Math.ceil(c.width/c.pixel),ny=Math.ceil(c.height/c.pixel),can=document.createElement('canvas');can.width=nx;can.height=ny;const ctx=can.getContext('2d',{willReadFrequently:true});const d=dimensions(c);ctx.save();ctx.translate(-col*(c.width+c.gap)*nx/c.width,-row*(c.height+c.gap)*ny/c.height);paintImage(ctx,image,c,d.width*nx/c.width,d.height*ny/c.height);ctx.restore();const data=ctx.getImageData(0,0,nx,ny);return {labels:quantize(data.data,mappingPalette(c)),nx,ny};}
