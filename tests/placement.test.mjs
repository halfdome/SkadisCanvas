import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,tileParts} from '../lib/geometry.mjs';
import {plateLayout,printerLimits} from '../lib/printers.mjs';
import {makeProject3mf} from '../lib/project3mf.mjs';
import {unzipSync,strFromU8} from 'fflate';

test('small tiles are exactly centered on every native build plate',()=>{
 for(const printer of ['x1c','h3c']){
  const c={...defaults,printer,width:80,height:80},p=printerLimits(c);
  const tiles=Array.from({length:20},(_,i)=>({name:`Tile ${i}`,row:Math.floor(i/5),col:i%5,parts:tileParts(c,new Uint8Array([0,1,2,3]),2,2,i%5,Math.floor(i/5))}));
  const z=unzipSync(makeProject3mf(tiles,c)),model=strFromU8(z['3D/3dmodel.model']);
  const items=[...model.matchAll(/<item[^>]*transform="([^"]+)"/g)];assert.equal(items.length,20);
  items.forEach(([_,transform],i)=>{const a=transform.split(' ').map(Number);assert.ok(Math.abs(a[9]-(i%5)*p.width*1.2+c.width/2-p.width/2)<1e-5);assert.ok(Math.abs(a[10]+Math.floor(i/5)*p.depth*1.2+c.height/2-p.depth/2)<1e-5);});
 }
});

test('large boards stay centered horizontally and clear the selected tower',()=>{
 for(const [printer,width,height,count] of [['x1c',200,200,4],['h3c',320,240,8]]){
  const c={...defaults,printer,width,height,palette:Array.from({length:count},(_,i)=>`#${i.toString(16).padStart(6,'0')}`)};
  c.backing=c.palette[0];c.filaments=c.palette.map(()=>({family:'Bambu PLA Basic'}));c.backingFilament=c.filaments[0];
  const p=printerLimits(c),l=plateLayout(c),t=l.tower;
  assert.equal(l.x+c.width/2,p.width/2);
  assert.ok(l.y>=p.margin&&l.y+c.height<=p.depth-p.margin);
  assert.ok(l.x+c.width<=t.x-t.brim-t.gap||l.x>=t.x+t.body+t.brim+t.gap||l.y+c.height<=t.y-t.brim-t.gap||l.y>=t.y+t.height+t.brim+t.gap);
  assert.equal(t.side,t.compact?'rear':printer==='h3c'?'front':'rear');
 }
});

test('tower clearance grows with colors and thinner layers, retaining stock geometry',()=>{
 const c={...defaults,printer:'h3c',palette:['#000000','#ffffff'],backing:'#000000'};
 const a=printerLimits(c),b=printerLimits({...c,palette:Array.from({length:16},(_,i)=>'#'+i.toString(16).padStart(6,'0')),backing:'#000000',layerHeight:.1});
 assert.ok(b.reserve>a.reserve);assert.ok(b.usableDepth<a.usableDepth);
});


test('maximum-height H3C boards use compact towers without reducing tile size',()=>{
 const c={...defaults,printer:'h3c',width:320,height:270};
 const p=printerLimits(c),l=plateLayout(c);assert.equal(p.usableDepth,270);assert.ok(l.tower.compact);
 assert.equal(l.x,5);assert.ok(l.y+c.height<=l.tower.y-l.tower.gap);assert.ok(l.y+c.height<=p.depth-p.margin);
});

test('explicit tower styles survive 3MF export and do not silently fall back',()=>{
 for(const primeTowerStyle of ['standard','wall']){
  const c={...defaults,printer:'h3c',width:80,height:80,primeTowerStyle};
  const layout=plateLayout(c);assert.equal(layout.tower.compact,primeTowerStyle==='wall');
  const parts=tileParts(c,new Uint8Array([0,1,2,3]),2,2,0,0);
  const zip=unzipSync(makeProject3mf([{parts,name:'R01-C01',row:0,col:0}],c));
  const settings=JSON.parse(strFromU8(zip['Metadata/project_settings.config']));
  assert.equal(settings.enable_prime_tower,'1');
  assert.equal(settings.prime_tower_rib_wall==='0',primeTowerStyle==='wall');
  if(primeTowerStyle==='wall')assert.equal(Number(settings.prime_tower_width),layout.tower.width);
 }
 const large={...defaults,printer:'h3c',width:320,height:270};
 assert.equal(plateLayout({...large,primeTowerStyle:'wall'}).tower.compact,true);
 assert.throws(()=>plateLayout({...large,primeTowerStyle:'standard'}),/standard prime tower/);
 assert.throws(()=>printerLimits({...large,primeTowerStyle:'invalid'}),/valid prime tower style/);
});
