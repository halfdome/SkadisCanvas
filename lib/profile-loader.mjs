import profiles,{profileModels,isBambuPrinter} from './bambu-profiles.mjs';

// Advance only after testing the new revision. Never use master at runtime.
export const PROFILE_REVISION='8e524a39d4c4cd0541801c1c46d2f77debb0bf1d';
export const PROFILE_SOURCE=`https://github.com/bambulab/BambuStudio/tree/${PROFILE_REVISION}/resources/profiles/BBL`;
const root=`https://raw.githubusercontent.com/bambulab/BambuStudio/${PROFILE_REVISION}/resources/profiles/`;
const families=['Generic PLA',...['PLA Basic','PLA Matte','PLA Tough+','PLA Silk+','PLA-CF','PETG Basic','PETG HF','PETG Matte','PETG Translucent','PETG-CF','ABS','ABS-GF','ASA','ASA-CF'].map(n=>'Bambu '+n)];
const excluded=new Set(['inherits','include','type','name','from','setting_id','instantiation','description','compatible_printers','compatible_printers_condition','compatible_prints','compatible_prints_condition','filament_id','default_filament_profile','default_print_profile','default_filament_colour']);
const settings=value=>Object.fromEntries(Object.entries(value).filter(([k])=>!excluded.has(k)));
const pending=new Map();
async function browserCache(){try{return await globalThis.caches?.open(`skadis-bambu-${PROFILE_REVISION}-v1`);}catch{return null;}}
export function validProfile(value,key){
  return value?.revision===PROFILE_REVISION&&value?.machineId===`Bambu Lab ${profileModels[key]?.[0]} 0.4 nozzle`&&
    Array.isArray(value.machine?.printable_area)&&typeof value.processId==='string'&&value.process&&value.filaments?.['Generic PLA']?.filament_type;
}
export function installProfile(key,value){
  if(!isBambuPrinter(key)||!validProfile(value,key))throw Error('The downloaded printer profile is incomplete or uses a different version.');
  profiles[key]=value;return value;
}
export function createProfileLoader({fetcher=globalThis.fetch,cacheProvider=browserCache}={}){
  const requests=new Map();
  async function json(path){
    if(path.includes('..')||path.startsWith('/')||!path.endsWith('.json'))throw Error('Invalid upstream profile path.');
    const url=root+path.split('/').map(encodeURIComponent).join('/');
    if(!requests.has(url))requests.set(url,(async()=>{
      const cache=await cacheProvider();
      try{const hit=await cache?.match(url);if(hit)return await hit.json();}catch{/* Refetch a corrupt cache entry. */}
      const response=await fetcher(url,{signal:AbortSignal.timeout(20000),credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw Error(`Bambu profile download failed (${response.status}).`);
      const value=await response.json();
      try{await cache?.put(url,new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}}));}catch{/* Cache is best-effort. */}
      return value;
    })().catch(error=>{requests.delete(url);throw error;}));
    return requests.get(url);
  }
  return async function load(key){
    if(!isBambuPrinter(key))throw Error('Choose a supported Bambu printer.');
    const manifest=await json('BBL.json');
    const entries=[...manifest.machine_list,...manifest.process_list,...manifest.filament_list];
    const index=new Map(entries.map(e=>[e.name,e.sub_path]));
    const raw=name=>{if(!index.has(name))throw Error(`Missing upstream profile: ${name}`);return json('BBL/'+index.get(name));};
    const resolved=new Map();
    async function resolve(name,chain=[]){
      if(chain.includes(name))throw Error('Circular upstream profile inheritance.');
      if(!resolved.has(name))resolved.set(name,(async()=>{
        const data=await raw(name),out={};
        const parents=[...(data.inherits?[data.inherits]:[]),...(data.include||[])];
        for(const parent of parents)Object.assign(out,await resolve(parent,[...chain,name]));
        return {...out,...data};
      })());
      return resolved.get(name);
    }
    const [model,code]=profileModels[key],machineId=`Bambu Lab ${model} 0.4 nozzle`;
    const machine=await resolve(machineId),processId=machine.default_print_profile;
    const [process,filamentEntries]=await Promise.all([resolve(processId),Promise.all(families.map(async family=>{
      const preferred=[`${family} @BBL ${code}`,`${family} @BBL ${code} 0.4 nozzle`];
      const candidates=manifest.filament_list.filter(e=>(e.name===family||e.name.startsWith(family+' @'))&&!/0\.[268] nozzle|@base/.test(e.name)).map(e=>e.name);
      for(const name of [...new Set([...preferred.filter(n=>index.has(n)),...candidates])]){
        const data=await raw(name);
        if(!data.compatible_printers?.includes(machineId))continue;
        const value=await resolve(name);
        return [family,{...settings(value),preset:name,id:value.filament_id||'GFL99'}];
      }
      return null;
    }))]);
    const value={revision:PROFILE_REVISION,source:PROFILE_SOURCE,upstreamVersion:manifest.version,machineId,processId,machine:settings(machine),process:settings(process),filaments:Object.fromEntries(filamentEntries.filter(Boolean))};
    if(!validProfile(value,key))throw Error('No complete compatible printer profile is available.');
    return value;
  };
}
const upstream=createProfileLoader();
export async function loadProfile(key){
  if(!isBambuPrinter(key))return null;
  if(profiles[key])return profiles[key];
  if(!pending.has(key))pending.set(key,(async()=>{
    const cache=await browserCache(),url=`${root}skadis-resolved-v1-${key}.json`;
    try{const hit=await cache?.match(url),value=hit&&await hit.json();if(validProfile(value,key))return installProfile(key,value);}catch{/* Retry from upstream. */}
    const value=await upstream(key);
    try{await cache?.put(url,new Response(JSON.stringify(value)));}catch{/* Cache is optional. */}
    return installProfile(key,value);
  })().finally(()=>pending.delete(key)));
  return pending.get(key);
}
