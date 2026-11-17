import {slicedPlates} from './sliced-plates.mjs';
import assert from 'node:assert/strict';
import {plateLayout,printerLimits} from '../lib/printers.mjs';

// Measure actual sliced tower extrusion paths, not only the planned rectangle.
export function validateTowerClearance(file,c){
 const layout=plateLayout(c),p=printerLimits(c),reports=[];
 for(const [name,code] of slicedPlates(file)){
  let feature='',x=null,y=null;const points=[];
  for(const line of code.split('\n')){
   if(line.startsWith('; FEATURE: '))feature=line.slice(11);
   if(!/^G[0123] /.test(line))continue;
   const xx=line.match(/\bX(-?[\d.]+)/),yy=line.match(/\bY(-?[\d.]+)/);
   if(xx)x=Number(xx[1]);if(yy)y=Number(yy[1]);
   if(feature==='Prime tower'&&/\bE[\d.]/.test(line)&&(xx||yy)&&x!==null&&y!==null)points.push([x,y]);
  }
  assert.ok(points.length,`${name}: no tower extrusion paths`);
  // Include half of a conservative 1 mm extrusion width around path centers.
  const b={left:Math.min(...points.map(p=>p[0]))-.5,right:Math.max(...points.map(p=>p[0]))+.5,front:Math.min(...points.map(p=>p[1]))-.5,rear:Math.max(...points.map(p=>p[1]))+.5};
  assert.ok(b.left>=p.reach.left&&b.right<=p.reach.right&&b.front>=p.reach.front&&b.rear<=p.reach.rear,`${name}: tower outside common nozzle reach`);
  const gap=Math.max(b.left-(layout.x+c.width),layout.x-b.right,b.front-(layout.y+c.height),layout.y-b.rear);
  assert.ok(gap>=3-1e-4,`${name}: sliced tower gap ${gap} mm is below 3 mm`);
  reports.push({plate:name,gap,bounds:b});
 }
 assert.ok(reports.length,'No sliced plates found');return reports;
}
