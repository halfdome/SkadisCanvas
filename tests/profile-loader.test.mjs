import test from 'node:test';
import assert from 'node:assert/strict';
import {createProfileLoader,PROFILE_REVISION,installProfile,validProfile} from '../lib/profile-loader.mjs';
import profiles from '../lib/bambu-profiles.mjs';
import {makeProject3mf} from '../lib/project3mf.mjs';
const machine='Bambu Lab H3C 0.4 nozzle';
function fixture(){
 const data={
  'machine.json':{name:machine,inherits:'base',include:['script'],default_print_profile:'standard',printable_area:['0x0','100x0','100x100','0x100']},
  'base.json':{machine_start_gcode:'base code',test:['base']},
  'script.json':{machine_start_gcode:'included code'},
  'process.json':{layer_height:'0.2'},
  'filament.json':{compatible_printers:[machine],filament_type:['PLA'],filament_density:['1.24']}
 };
 const manifest={version:'test',machine_list:[{name:machine,sub_path:'machine.json'},{name:'base',sub_path:'base.json'},{name:'script',sub_path:'script.json'}],process_list:[{name:'standard',sub_path:'process.json'}],filament_list:[{name:'Generic PLA @BBL H3C',sub_path:'filament.json'}]};
 const calls=[];
 const fetcher=async url=>{calls.push(url);assert.ok(url.includes(PROFILE_REVISION));const name=decodeURIComponent(url.split('/').at(-1));return new Response(JSON.stringify(name==='BBL.json'?manifest:data[name]),{status:200});};
 return {data,manifest,calls,fetcher};
}
test('fetches only requested printer, resolves includes and inheritance, and reuses cached data offline',async()=>{
 const f=fixture(),stored=new Map(),cache={match:async key=>stored.get(key)?.clone(),put:async(key,value)=>stored.set(key,value.clone())};
 const load=createProfileLoader({fetcher:f.fetcher,cacheProvider:async()=>cache});
 const value=await load('h3c');
 assert.equal(value.machine.machine_start_gcode,'included code');assert.deepEqual(value.machine.test,['base']);
 assert.equal(value.process.layer_height,'0.2');assert.equal(value.filaments['Generic PLA'].preset,'Generic PLA @BBL H3C');
 assert.equal(value.machine.inherits,undefined);assert.equal(f.calls.length,6);
 const offline=createProfileLoader({fetcher:()=>{throw Error('offline');},cacheProvider:async()=>cache});
 assert.deepEqual(await offline('h3c'),value);
 assert.equal(validProfile({...value,revision:'other'},'h3c'),false);
 assert.throws(()=>installProfile('x1c',value),/incomplete/);
});
test('failed fetch retries; unavailable cache does not prevent loading',async()=>{
 const f=fixture();let fail=true;
 const load=createProfileLoader({cacheProvider:async()=>null,fetcher:async(...args)=>{if(fail){fail=false;return new Response('',{status:503});}return f.fetcher(...args);}});
 await assert.rejects(load('h3c'),/503/);assert.ok(validProfile(await load('h3c'),'h3c'));
});
test('rejects cycles, missing parents and paths outside the pinned profiles',async()=>{
 for(const mutation of [f=>f.data['base.json'].inherits=machine,f=>f.data['base.json'].inherits='missing',f=>f.manifest.machine_list[1].sub_path='../outside.json']){
  const f=fixture();mutation(f);await assert.rejects(createProfileLoader({fetcher:f.fetcher,cacheProvider:async()=>null})('h3c'),/Circular|Missing|Invalid/);
 }
});
test('an unloaded Bambu printer cannot silently export a generic project',()=>{
 const saved=profiles.h3c;delete profiles.h3c;
 try{assert.throws(()=>makeProject3mf([{parts:[],col:0,row:0}],{printer:'h3c'}),/Loading printer/);}finally{profiles.h3c=saved;}
});
