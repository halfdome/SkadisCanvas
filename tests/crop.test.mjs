import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,validate} from '../lib/geometry.mjs';
import {imagePlacement,panArtwork,paintImage,quantize} from '../lib/image.mjs';
test('landscape artwork crops predictably across a portrait wall',()=>{
 const image={width:1600,height:900},c={...defaults,cols:5,rows:8,width:200,height:200};
 const p=imagePlacement(image,c);assert.equal(p.height,1600);assert.ok(p.width>p.wallWidth);assert.equal(p.x,(1000-p.width)/2);
 const pan=panArtwork(image,c,100,0),moved=imagePlacement(image,{...c,...pan});assert.ok(Math.abs(moved.x-p.x-100)<1e-6);assert.equal(moved.y,0);
 for(const zoom of [.25,1,4])validate({...c,zoom});
 assert.throws(()=>validate({...c,zoom:4.1}),/placement/);
});
test('crop position clamps to image edges and is shared by preview and export rendering',()=>{
 const image={width:900,height:1600},c={...defaults,cols:1,rows:1,zoom:2,panX:35,panY:70};
 const p=imagePlacement(image,c),calls=[],ctx={fillRect(){},drawImage(...args){calls.push(args)}};
 paintImage(ctx,image,c,1000,1000);paintImage(ctx,image,c,100,100);
 for(let i=1;i<5;i++)assert.ok(Math.abs(calls[0][i]/10-calls[1][i])<1e-6);
 assert.deepEqual(panArtwork(image,c,100000,-100000),{panX:0,panY:100});
 assert.ok(p.x<0&&p.y<0);
});


test('uncovered crop areas use the chosen backing without consuming a source-color slot',async()=>{
 const {tileParts}=await import('../lib/geometry.mjs');
 const c={...defaults,width:80,height:80,cols:1,rows:1,palette:['#ff0000'],backing:'#00ff00',backingFilament:{family:'Bambu PLA Basic'}};
 const labels=quantize(new Uint8Array([255,0,0,255,0,0,0,0]),c.palette,c.palette.length);assert.deepEqual([...labels],[0,1]);
 const parts=tileParts(c,labels,2,1);assert.equal(parts.length,3);const background=parts.find(p=>p.name==='Background');assert.equal(background.color,c.backing);assert.deepEqual(background.filament,c.backingFilament);assert.ok(background.vertices.every(v=>v[2]<=.600001));
});
