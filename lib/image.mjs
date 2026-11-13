import {dimensions} from './geometry.mjs';
export function paintImage(ctx,image,c,w,h){
  ctx.fillStyle=c.backing;ctx.fillRect(0,0,w,h);
  const d=dimensions(c);const scale=(c.fit==='cover'?Math.max(d.width/image.width,d.height/image.height):Math.min(d.width/image.width,d.height/image.height))*c.zoom;
  const iw=image.width*scale,ih=image.height*scale;
  ctx.drawImage(image,(d.width-iw)*c.panX/100*w/d.width,(d.height-ih)*c.panY/100*h/d.height,iw*w/d.width,ih*h/d.height);
  return scale;
}
export function quantize(data,palette){const colors=palette.map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))),labels=new Uint8Array(data.length/4);for(let i=0;i<labels.length;i++){let best=Infinity,idx=0;for(let j=0;j<colors.length;j++){const dist=colors[j].reduce((s,v,k)=>s+(data[i*4+k]-v)**2,0);if(dist<best){best=dist;idx=j;}}labels[i]=idx;}return labels;}
export function autoPalette(data,count){
  const hist=new Map();
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]<128)continue;
    const rgb=[data[i],data[i+1],data[i+2]],key=rgb.map(v=>Math.round(v/16)).join(',');
    const p=hist.get(key);
    if(p){p.n++;rgb.forEach((v,k)=>p.sum[k]+=v);}else hist.set(key,{sum:rgb,n:1});
  }
  // Quantize histogram keys only: cluster the original RGB means, not rounded colors.
  const points=[...hist.values()].map(p=>({rgb:p.sum.map(v=>v/p.n),n:p.n})).sort((a,b)=>b.n-a.n);
  if(!points.length)throw Error('Image has no visible pixels.');
  const centers=[points[0].rgb];
  while(centers.length<count){let best=-1,pick=points[0].rgb;for(const p of points){const dist=Math.min(...centers.map(c=>c.reduce((s,v,k)=>s+(v-p.rgb[k])**2,0)))*Math.sqrt(p.n);if(dist>best){best=dist;pick=p.rgb;}}centers.push([...pick]);}
  for(let iter=0;iter<12;iter++){const sums=centers.map(()=>[0,0,0,0]);for(const p of points){let j=0,best=Infinity;centers.forEach((c,k)=>{const d=c.reduce((s,v,a)=>s+(v-p.rgb[a])**2,0);if(d<best){best=d;j=k;}});for(let k=0;k<3;k++)sums[j][k]+=p.rgb[k]*p.n;sums[j][3]+=p.n;}centers.forEach((c,j)=>{if(sums[j][3])centers[j]=sums[j].slice(0,3).map(v=>v/sums[j][3]);});}
  return centers.map(c=>'#'+c.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''));
}
export function originalPalette(image,count){
  const can=document.createElement('canvas'),scale=Math.min(1,256/Math.max(image.width,image.height));
  can.width=Math.max(1,Math.round(image.width*scale));can.height=Math.max(1,Math.round(image.height*scale));
  const ctx=can.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
  ctx.drawImage(image,0,0,can.width,can.height);
  return autoPalette(ctx.getImageData(0,0,can.width,can.height).data,count);
}
export function sampleTile(image,c,col,row){const nx=Math.ceil(c.width/c.pixel),ny=Math.ceil(c.height/c.pixel),can=document.createElement('canvas');can.width=nx;can.height=ny;const ctx=can.getContext('2d',{willReadFrequently:true});const d=dimensions(c);ctx.save();ctx.translate(-col*(c.width+c.gap)*nx/c.width,-row*(c.height+c.gap)*ny/c.height);paintImage(ctx,image,c,d.width*nx/c.width,d.height*ny/c.height);ctx.restore();const data=ctx.getImageData(0,0,nx,ny);return {labels:quantize(data.data,c.palette),nx,ny};}
