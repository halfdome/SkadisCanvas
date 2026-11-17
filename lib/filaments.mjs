import swatches from './bambu-swatches.mjs';
import profiles from './bambu-profiles.mjs';
import {printers} from './printers.mjs';
// Manufacturer display swatches; these are not colorimetric print measurements or live stock.
export const filamentFamilies={
  'Bambu PLA Basic':{material:'PLA',source:'https://store.bblcdn.com/s7/default/1084369ef84345bbaa5d704a492954e0/Bambu_PLA_Basic_Hex_Code.pdf',colors:[['Jade White','#ffffff'],['Beige','#f7e6de'],['Light Gray','#d1d3d5'],['Silver','#a6a9aa'],['Gray','#8e9089'],['Magenta','#ec008c'],['Pink','#f55a74'],['Hot Pink','#f5547c'],['Orange','#ff6a13'],['Pumpkin Orange','#ff9016'],['Gold','#e4bd68'],['Sunflower Yellow','#fec600'],['Yellow','#f4ee2a'],['Bright Green','#becf00'],['Bambu Green','#00ae42'],['Mistletoe Green','#3f8e43'],['Bronze','#847d48'],['Cocoa Brown','#6f5034'],['Brown','#9d432c'],['Maroon Red','#9d2235'],['Red','#c12e1f'],['Turquoise','#00b1b7'],['Cyan','#0086d6'],['Blue','#0a2989'],['Cobalt Blue','#0056b8'],['Purple','#5e43b7'],['Indigo Purple','#482960'],['Blue Grey','#5b6579'],['Dark Gray','#545454'],['Black','#000000']]},
  'Bambu PLA Matte':{material:'PLA',source:'https://store.bblcdn.eu/s8/default/f131f643495b417197832b291fc7b068/Bambu_PLA_Matte_Hex_Code.pdf',colors:[['Ivory White', '#ffffff'], ['Bone White', '#cbc6b8'], ['Desert Tan', '#e8dbb7'], ['Latte Brown', '#d3b7a7'], ['Caramel', '#ae835b'], ['Terracotta', '#b15533'], ['Dark Brown', '#7d6556'], ['Dark Chocolate', '#4d3324'], ['Lilac Purple', '#ae96d4'], ['Sakura Pink', '#e8afcf'], ['Mandarin Orange', '#f99963'], ['Lemon Yellow', '#f7d959'], ['Plum', '#950051'], ['Scarlet Red', '#de4343'], ['Dark Red', '#bb3d43'], ['Dark Green', '#68724d'], ['Grass Green', '#61c680'], ['Apple Green', '#c2e189'], ['Ice Blue', '#a3d8e1'], ['Sky Blue', '#56b7e6'], ['Marine Blue', '#0078bf'], ['Dark Blue', '#042f56'], ['Ash Gray', '#9b9ea0'], ['Nardo Gray', '#757575'], ['Charcoal', '#000000']]},
  ...Object.fromEntries(Object.entries(swatches).filter(([name])=>!['Bambu PLA Basic','Bambu PLA Matte'].includes(name))),
  'Custom / other brand':{material:'custom',colors:[]}
};
export const defaultMatchFamily='Bambu PLA Basic + Matte';
export const matchGroups={
  [defaultMatchFamily]:['Bambu PLA Basic','Bambu PLA Matte'],
  'All Bambu PLA':Object.keys(filamentFamilies).filter(f=>filamentFamilies[f].material==='PLA'),
  'Bambu PETG Basic + HF':['Bambu PETG Basic','Bambu PETG HF'],
  'All Bambu PETG':Object.keys(filamentFamilies).filter(f=>filamentFamilies[f].material==='PETG')
};
export const customFilament='Custom / other brand';
export function availableFilaments(printer){
  const presets=profiles[printer]?.filaments;
  return Object.keys(filamentFamilies).filter(name=>name===customFilament||
    (!presets||Object.hasOwn(presets,name))&&(!printers[printer]?.openFrame||!['ABS','ASA'].includes(filamentFamilies[name].material)));
}
export function matchingFamilies(printer){
  const available=availableFilaments(printer);
  return [...Object.keys(matchGroups).filter(group=>matchGroups[group].some(f=>available.includes(f))),...available.filter(name=>filamentFamilies[name].colors.length)];
}
export function filamentWarnings(c,usedMaterials){
  const selections=usedMaterials?usedMaterials.filter(m=>m.volume>1e-6):[...(c.filaments||[]).slice(0,c.palette.length),c.backingFilament].filter(Boolean);
  const materials=new Set(selections.map(f=>filamentFamilies[f.family]?.material));
  return {
    plaPetg:materials.has('PLA')&&materials.has('PETG'),
    mixed:[...materials].filter(m=>m&&m!=='custom').length>1,
    families:[...new Set(selections.filter(f=>['PLA','PETG'].includes(filamentFamilies[f.family]?.material)).map(f=>f.family))],
    abrasive:selections.some(f=>/-(CF|GF)$/.test(f.family)),
    translucent:selections.some(f=>f.family==='Bambu PETG Translucent')
  };
}
export function unavailableFilaments(c) {
  const available=new Set(availableFilaments(c.printer));
  return [...new Set([...(c.filaments||[]).slice(0,c.palette.length),c.backingFilament].filter(f=>f&&!available.has(f.family)).map(f=>f.family))];
}
export function filamentName(c,index){const f=index<0?c.backingFilament:c.filaments?.[index];return f?`${f.family} / ${f.colorName||'Custom color'}`:'Custom color';}
export function mixedMaterials(c){const list=[...(c.filaments||[]).slice(0,c.palette.length),c.backingFilament].filter(Boolean).map(f=>filamentFamilies[f.family]?.material).filter(x=>x&&x!=='custom');return new Set(list).size>1;}
// CIELAB distance avoids treating equal RGB steps as equal perceived changes.
export function lab(hex){
 const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const f=v=>v>216/24389?Math.cbrt(v):v*841/108+4/29;
 const x=f((.4124564*r+.3575761*g+.1804375*b)/.95047),y=f(.2126729*r+.7151522*g+.072175*b),z=f((.0193339*r+.119192*g+.9503041*b)/1.08883);
 return [116*y-16,500*(x-y),200*(y-z)];
}
export function nearestPreset(hex,family){
 const target=lab(hex),distance=h=>lab(h).reduce((s,v,k)=>s+(v-target[k])**2,0);
 return [...filamentFamilies[family].colors].sort((a,b)=>distance(a[1])-distance(b[1]))[0];
}
// Changing artwork material also corrects an incompatible PLA/PETG backing.
// Keep compatible, custom and other-material backings unchanged.
export function alignBackingMaterial(config,artworkFamily){
 const material=filamentFamilies[artworkFamily]?.material;
 const backingMaterial=filamentFamilies[config.backingFilament?.family]?.material;
 if(!['PLA','PETG'].includes(material)||!['PLA','PETG'].includes(backingMaterial)||material===backingMaterial)return config;
 const preferred=material==='PETG'?['Bambu PETG HF','Bambu PETG Basic']:['Bambu PLA Basic','Bambu PLA Matte'];
 const available=availableFilaments(config.printer);
 const family=preferred.find(f=>available.includes(f));
 if(!family)return config;
 const [colorName,backing]=nearestPreset(config.backing||'#ffffff',family);
 return {...config,backing,backingFilament:{family,colorName}};
}
export function matchOriginalColors(sourcePalette,family='Bambu PLA Basic',previous={}){
 const available=availableFilaments(previous.printer);
 const families=(matchGroups[family]??[family]).filter(f=>available.includes(f));
 const candidates=families.flatMap(f=>(filamentFamilies[f]?.colors||[]).map(([colorName,color])=>({family:f,colorName,color,lab:lab(color)})));
 if(!candidates.length)return matchOriginalColors(sourcePalette,defaultMatchFamily,previous);
 const matches=sourcePalette.map(hex=>{const target=lab(hex);return candidates.reduce((best,m)=>{const distance=m.lab.reduce((s,v,k)=>s+(v-target[k])**2,0);return !best||distance<best.distance?{...m,distance}:best;},null);});
 const result={colorCount:sourcePalette.length,sourcePalette,palette:matches.map(x=>x.color),filaments:matches.map(({family,colorName})=>({family,colorName})),backing:previous.backingLocked?previous.backing:matches[0].color,backingFilament:previous.backingLocked?previous.backingFilament:{family:matches[0].family,colorName:matches[0].colorName}};
 const aligned=alignBackingMaterial({...previous,...result},matches[0].family);
 return {...result,backing:aligned.backing,backingFilament:aligned.backingFilament};
}
