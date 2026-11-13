import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,validate,dimensions,slots,boardShape,extrude,tileParts,make3mf,makeProject3mf,makeStl,inspectStl} from '../lib/geometry.mjs';
import {unzipSync,strFromU8} from 'fflate';
import {quantize,autoPalette} from '../lib/image.mjs';
import {exportWall} from '../lib/project3mf.mjs';
import {partitionWall,inRegion} from '../lib/partitions.mjs';
import {matchOriginalColors} from '../lib/filaments.mjs';
const volume=m=>m.triangles.reduce((s,t)=>{const [a,b,c]=t.map(i=>m.vertices[i]);return s+(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;},0);
function closed(mesh){const edges=new Map();for(const t of mesh.triangles)for(let i=0;i<3;i++){const a=t[i],b=t[(i+1)%3];const key=[Math.min(a,b),Math.max(a,b)].join(',');const v=edges.get(key)||[0,0];v[0]++;v[1]+=a<b?1:-1;edges.set(key,v);}for(const [key,[n,w]]of edges)assert.deepEqual([n,w],[2,0],`edge ${key}`);assert.ok(volume(mesh)>0,'positive volume');}
test('default wall and staggered slot geometry',()=>{validate(defaults);assert.deepEqual(dimensions(defaults),{width:1000,height:1600});const p=slots(defaults);assert.ok(p.some(([x,y])=>x===20&&y===180));assert.ok(p.some(([x,y])=>x===40&&y===160));});
test('whole board is closed with positive volume in both orientations',()=>{for(const faceDown of [false,true]){const c={...defaults,faceDown,cols:1,rows:1};const mesh=extrude(boardShape(c),0,c.thickness,c);closed(mesh);const expected=(c.width*c.height-slots(c).length*(5*10+Math.PI*2.5**2))*c.thickness;assert.ok(Math.abs(volume(mesh)-expected)/expected<0.001);const stl=makeStl(mesh);assert.deepEqual(inspectStl(stl.buffer).size,[200,200,5]);}});
test('colored face and backing partition entire board volume without overlap',()=>{const c={...defaults,width:80,height:80,pixel:4,cols:1,rows:1},nx=20,ny=20,labels=Uint8Array.from({length:nx*ny},(_,i)=>Math.floor(i%nx/5));const parts=tileParts(c,labels,nx,ny);parts.forEach(closed);const whole=extrude(boardShape(c),0,c.thickness,c);assert.ok(Math.abs(parts.reduce((s,m)=>s+volume(m),0)-volume(whole))<0.01);assert.equal(Math.min(...parts[0].vertices.map(v=>v[2])),0.5999999999999996);for(const part of parts.slice(1))assert.ok(Math.max(...part.vertices.map(v=>v[2]))<0.601);});
test('face-down rotation keeps top-left artwork in correct installed position',()=>{const c={...defaults,width:40,height:40,cols:1,rows:1,faceDown:true,palette:['#000000','#ffffff']};const parts=tileParts(c,new Uint8Array([0,1,1,1]),2,2),dark=parts.find(p=>p.name.startsWith('Color 1'));assert.ok(dark.vertices.every(v=>v[0]>=20-1e-8&&v[1]>=20-1e-8&&v[2]<=0.601));});
test('3MF package has relationships, material groups and a single component assembly',()=>{const c={...defaults,width:40,height:40,cols:1,rows:1};const parts=tileParts(c,new Uint8Array([0,1,2,3]),2,2);const zip=unzipSync(make3mf(parts,'test'));assert.ok(zip['[Content_Types].xml']);assert.ok(zip['_rels/.rels']);const xml=strFromU8(zip['3D/3dmodel.model']);assert.equal((xml.match(/<item /g)||[]).length,1);assert.equal((xml.match(/<component /g)||[]).length,parts.length);assert.ok(xml.includes('unit="millimeter"'));});
test('reject invalid and excessively large projects',()=>{for(const change of [{cols:0},{rows:2.5},{width:NaN},{pixel:0.1},{thickness:0.2},{palette:['garbage']},{gap:-1},{cols:10,rows:10,pixel:0.4}])assert.throws(()=>validate({...defaults,...change}));});
test('STL import validates binary and ASCII input',()=>{assert.throws(()=>inspectStl(new TextEncoder().encode('not stl').buffer));const text='solid x\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 1\nendloop\nendfacet\nendsolid x';assert.deepEqual(inspectStl(new TextEncoder().encode(text).buffer).size,[1,1,1]);});
test('palette extraction and mapping preserve flat illustration colors',()=>{const data=new Uint8ClampedArray([255,0,0,255,0,0,255,255,255,0,0,255]);const palette=autoPalette(data,2);assert.deepEqual(new Set(palette),new Set(['#ff0000','#0000ff']));assert.deepEqual([...quantize(data,['#ff0000','#0000ff'])],[0,1,0]);});

test('hole pitch stays continuous across zero-gap board seams',()=>{
  const c={...defaults,width:200,height:200,edgeSlots:false};
  const left=slots(c,0,0).filter(([x,y])=>y===190).map(([x])=>x);
  const right=slots(c,1,0).filter(([x,y])=>y===190).map(([x])=>x+200);
  assert.equal(Math.min(...right)-Math.max(...left),40);
  const upper=slots(c,0,0).map(([x,y])=>200-y);
  const lower=slots(c,0,1).map(([x,y])=>400-y);
  assert.equal(Math.min(...lower)-Math.max(...upper),20);
});
test('arbitrary tile sizes clip seam slots without losing or adding material',()=>{
  const c={...defaults,width:50,height:70,cols:2,rows:2};
  let tiled=0;for(let row=0;row<2;row++)for(let col=0;col<2;col++){const m=extrude(boardShape(c,col,row),0,c.thickness,c);closed(m);tiled+=volume(m);}
  const whole={...c,width:100,height:140,cols:1,rows:1};const m=extrude(boardShape(whole),0,whole.thickness,whole);closed(m);assert.ok(Math.abs(tiled-volume(m))<0.001);
});

test('neighbor boards share exact half-slots while wall perimeter stays closed',()=>{
  const c={...defaults,width:200,height:200,cols:2,rows:2,edgeSlots:true};
  assert.ok(slots(c,0,0).some(([x,y])=>x===200&&y===160));
  assert.ok(slots(c,1,0).some(([x,y])=>x===0&&y===160));
  assert.ok(slots(c,0,0).some(([x,y])=>x===40&&y===0));
  assert.ok(slots(c,0,1).some(([x,y])=>x===40&&y===200));
  assert.ok(slots(c,0,0).every(([x,y])=>x>=c.slotWidth/2&&y<=c.height-c.slotHeight/2));
});

test('generic project 3MF contains all 40 named tile assemblies',()=>{
  const c={...defaults,printer:'custom',width:40,height:40};const tiles=[];
  for(let row=0;row<c.rows;row++)for(let col=0;col<c.cols;col++)tiles.push({name:`R${row+1}-C${col+1}`,row,col,parts:tileParts(c,new Uint8Array([0,1,2,3]),2,2,col,row)});
  const zip=unzipSync(makeProject3mf(tiles,c)),xml=strFromU8(zip['3D/3dmodel.model']);
  assert.equal((xml.match(/<item /g)||[]).length,40);assert.equal((xml.match(/<components>/g)||[]).length,40);
  assert.ok(xml.includes('name="R8-C5"'));assert.ok(zip['Metadata/surface-project.json']);
  const ids=[...xml.matchAll(/<object id="(\d+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
});

test('X1C and H3C limits include margin, tower reserve and cutter allowance',async()=>{
  const {printerLimits}=await import('../lib/printers.mjs');
  const x={...defaults,printer:'x1c'},h={...defaults,printer:'h3c'};
  assert.equal(printerLimits(x).usableWidth,228);assert.equal(printerLimits(x).usableDepth,206);
  assert.equal(printerLimits(h).usableWidth,320);assert.equal(printerLimits(h).usableDepth,270);
  assert.throws(()=>validate({...x,width:240}),/allowance/);validate({...h,width:320,height:240});
  assert.throws(()=>validate({...h,height:280}),/allowance/);assert.throws(()=>validate({...x,bedMargin:-1}));
  validate({...defaults,printer:'custom',bedWidth:180,bedDepth:180,width:120,height:120});
});
test('named filament selections are escaped and retained in exported 3MF',()=>{
  const c={...defaults,width:40,height:40,cols:1,rows:1,filaments:[{family:'Bambu PLA Basic',colorName:'Jade White & test'}]};
  const parts=tileParts(c,new Uint8Array([0]),1,1);const xml=strFromU8(unzipSync(makeProject3mf([{name:'R1-C1',row:0,col:0,parts}],c))['3D/3dmodel.model']);
  assert.ok(xml.includes('Bambu PLA Basic / Jade White &amp; test'));
});

test('Bambu wall export splits into two native rectangular 20-plate projects',()=>{
  const c={...defaults,width:40,height:40,printer:'x1c'};
  const tiles=Array.from({length:40},(_,i)=>({name:`Tile ${i+1}`,col:i%5,row:Math.floor(i/5),parts:tileParts(c,new Uint8Array([0,1,2,3]),2,2,i%5,Math.floor(i/5))}));
  const exported=exportWall(tiles,c);assert.equal(exported.format,'zip');
  const files=unzipSync(exported.data),names=Object.keys(files).filter(n=>n.endsWith('.3mf'));
  assert.equal(names.length,2);assert.ok(files['assembly-map.svg']);
  const seen=new Set();
  for(const [part,name] of names.entries()){
    const zip=unzipSync(files[name]);
    const manifest=JSON.parse(strFromU8(zip['Metadata/surface-project.json']));
    for(const tile of manifest.tiles){assert.ok(!seen.has(tile.name));seen.add(tile.name);assert.ok(tile.row>=part*4+1&&tile.row<=part*4+4);}
    const model=strFromU8(zip['3D/3dmodel.model']),meta=strFromU8(zip['Metadata/model_settings.config']);
    const settings=JSON.parse(strFromU8(zip['Metadata/project_settings.config']));
    assert.equal((model.match(/<item /g)||[]).length,20);
    assert.equal((meta.match(/<plate>/g)||[]).length,20);
    assert.equal((model.match(/printable="1"/g)||[]).length,20);
    assert.ok(!model.includes('QUEUED'));
    assert.deepEqual(settings.filament_colour,c.palette.map(x=>x.toUpperCase()));
    assert.ok(settings.filament_density.every(x=>Number(x)>0));
    assert.equal(settings.filament_self_index.length,settings.filament_extruder_variant.length);
    assert.equal(settings.layer_height,String(c.layerHeight));
    assert.equal(settings.initial_layer_print_height,String(c.layerHeight));
    assert.ok(settings.machine_start_gcode.length>100);
    assert.equal(new Set(settings.filament_self_index).size,4);
    // Plate membership and placement must agree; each complete tile fits its bed.
    const items=[...model.matchAll(/<item objectid="(\d+)" transform="([^"]+)" printable="1"/g)];
    const cols=Math.ceil(Math.sqrt(items.length));
    items.forEach((m,i)=>{const t=m[2].split(' ').map(Number),x=t[9]-(i%cols)*256*1.2,y=t[10]+Math.floor(i/cols)*256*1.2;assert.ok(x>=23-1e-6&&x+c.width<=251);assert.ok(y>=5-1e-6&&y+c.height<=211);assert.ok(meta.includes(`key="object_id" value="${m[1]}"`));});
  }
  assert.equal(seen.size,40);
  assert.throws(()=>makeProject3mf(tiles,c),/36/);
});
test('custom printer retains portable geometry without Bambu machine settings',()=>{
 const c={...defaults,printer:'custom',cols:1,rows:1,width:40,height:40};
 const zip=unzipSync(makeProject3mf([{name:'tile',row:0,col:0,parts:tileParts(c,new Uint8Array([0]),1,1)}],c));
 assert.equal(zip['Metadata/project_settings.config'],undefined);assert.ok(zip['3D/3dmodel.model']);
});

test('rectangular partitions cover every tile once, stay under 36, and balance 5x8',()=>{
 assert.deepEqual(partitionWall(5,8).map(r=>[r.col,r.row,r.cols,r.rows]),[[0,0,5,4],[0,4,5,4]]);
 assert.equal(partitionWall(10,10).length,3);
 for(let cols=1;cols<=20;cols++)for(let rows=1;rows<=20;rows++){
  if(cols*rows>100)continue;
  const regions=partitionWall(cols,rows);assert.equal(regions.length,Math.ceil(cols*rows/36));
  regions.forEach(r=>assert.ok(r.count<=36));
  for(let col=0;col<cols;col++)for(let row=0;row<rows;row++)assert.equal(regions.filter(r=>inRegion({col,row},r)).length,1);
 }
});
test('original color extraction preserves RGB values and ignores transparent pixels',()=>{
 const data=new Uint8ClampedArray([18,107,193,255,18,107,193,255,219,33,72,255,255,255,255,0]);
 assert.deepEqual(new Set(autoPalette(data,2)),new Set(['#126bc1','#db2148']));
});
test('original image colors map to exact known filament swatches',()=>{
 const original=['#00ae42','#c12e1f','#f4ee2a','#0086d6'];
 const matched=matchOriginalColors(original);
 assert.deepEqual(matched.palette,original);assert.deepEqual(matched.sourcePalette,original);
 assert.deepEqual(matched.filaments.map(f=>f.colorName),['Bambu Green','Red','Yellow','Cyan']);
 assert.equal(matched.backing,original[0]);
});

test('selected tile export retains wall coordinates and stays at the portable origin',()=>{
 const c={...defaults,printer:'custom',width:40,height:40},parts=tileParts(c,new Uint8Array([0,1,2,3]),2,2,3,6);
 const zip=unzipSync(make3mf(parts,'R07-C04',c,{col:3,row:6}));
 assert.ok(strFromU8(zip['3D/3dmodel.model']).includes('transform="1 0 0 0 1 0 0 0 1 0 0 0"'));
 assert.deepEqual(JSON.parse(strFromU8(zip['Metadata/surface-project.json'])).tiles,[{name:'R07-C04',row:7,col:4}]);
});
