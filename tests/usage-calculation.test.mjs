import test from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
import {startUsageCalculation,usageConfigKey} from '../lib/usage-calculation.mjs';
import {defaults} from '../lib/geometry.mjs';

test('model inputs invalidate estimates; print-bed allowances do not',()=>{
 const baseline=usageConfigKey(defaults);
 for(const [field,value] of Object.entries({width:240,rows:4,gap:2,thickness:6,slotWidth:6,slotHeight:16,pitch:50,edgeSlots:false,boardDesign:'board-with-spacers',spacerHeight:20,spacerDiameter:18,backLabel:true,layerHeight:.1,colorLayers:4,pixel:1,faceDown:false,fit:'contain',zoom:2,panX:25,panY:25,printer:'x1c',palette:['#000000'],sourcePalette:['#123456'],filaments:[{family:'Bambu PETG HF'}],backing:'#000000',backingFilament:{family:'Bambu PETG HF'}}))assert.notEqual(usageConfigKey({...defaults,[field]:value}),baseline,field);
 assert.equal(usageConfigKey({...defaults,towerReserve:30,primeTowerStyle:'wall',bedMargin:8,bedWidth:300,matchFamily:'All PLA',backingLocked:false}),baseline);
});

function fixture(options={}){
 const states=[],workers=[],sampled=[];
 const stop=startUsageCalculation({config:{cols:2,rows:1},image:{id:'sample'},delay:0,
   sampleTile:(image,c,col,row)=>{sampled.push([col,row]);return {labels:new Uint8Array([col]),nx:1,ny:1};},
   createWorker:()=>{const worker={terminate(){this.terminated=true;},postMessage(message){this.message=message;}};workers.push(worker);return worker;},
   onChange:state=>states.push(state),...options});
 return {states,workers,sampled,stop};
}
async function ready(f){for(let i=0;i<100&&!f.workers.length;i++)await sleep(2);assert.equal(f.workers.length,1);return f.workers[0];}

test('automatically samples the entire wall and reports progress then completion',async()=>{
 const f=fixture(),w=await ready(f);
 assert.equal(f.states[0].phase,'pending');assert.deepEqual(f.sampled,[[0,0],[1,0]]);
 assert.equal(w.message.mode,'usage');assert.equal(w.message.samples.length,2);
 w.onmessage({data:{usageProgress:1,total:2}});assert.match(f.states.at(-1).text,/tile 1 of 2/);
 const usage={grams:20,meters:6,materials:[]};w.onmessage({data:{usage}});
 assert.equal(f.states.at(-1).phase,'calculated');assert.equal(f.states.at(-1).usage,usage);assert.equal(w.terminated,true);
 // Queued late failures cannot replace a completed result.
 w.onerror();assert.equal(f.states.at(-1).phase,'calculated');f.stop();
});
test('rapid changes cancel the debounce before any expensive sampling',async()=>{
 const f=fixture({delay:15});f.stop();await sleep(25);
 assert.equal(f.sampled.length,0);assert.equal(f.workers.length,0);
});
test('superseded calculations cannot publish old totals or failures',async()=>{
 const first=fixture(),old=await ready(first);first.stop();const count=first.states.length;
 const next=fixture(),current=await ready(next);
 old.onmessage({data:{usage:{grams:999}}});old.onerror();
 assert.equal(first.states.length,count);assert.equal(old.terminated,true);
 current.onmessage({data:{usage:{grams:12}}});assert.equal(next.states.at(-1).usage.grams,12);next.stop();
});
test('cancellation during sampling prevents worker startup',async()=>{
 let f;f=fixture({sampleTile:()=>{f.stop();return {labels:new Uint8Array([0]),nx:1,ny:1};}});
 await sleep(15);assert.equal(f.workers.length,0);
});
test('sampling and worker failures provide retryable error states',async()=>{
 const f=fixture({sampleTile:()=>{throw Error('Invalid geometry');}});await sleep(15);
 assert.equal(f.states.at(-1).phase,'error');assert.match(f.states.at(-1).text,/Invalid geometry/);f.stop();
 const g=fixture(),w=await ready(g);w.onmessage({data:{error:'Geometry failed'}});
 assert.equal(g.states.at(-1).phase,'error');assert.equal(w.terminated,true);g.stop();
});
