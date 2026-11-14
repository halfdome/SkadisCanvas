// Manufacturer display swatches; these are not colorimetric print measurements or live stock.
export const filamentFamilies={
  'Bambu PLA Basic':{material:'PLA',source:'https://store.bblcdn.com/s7/default/1084369ef84345bbaa5d704a492954e0/Bambu_PLA_Basic_Hex_Code.pdf',colors:[['Jade White','#ffffff'],['Beige','#f7e6de'],['Light Gray','#d1d3d5'],['Silver','#a6a9aa'],['Gray','#8e9089'],['Magenta','#ec008c'],['Pink','#f55a74'],['Hot Pink','#f5547c'],['Orange','#ff6a13'],['Pumpkin Orange','#ff9016'],['Gold','#e4bd68'],['Sunflower Yellow','#fec600'],['Yellow','#f4ee2a'],['Bright Green','#becf00'],['Bambu Green','#00ae42'],['Mistletoe Green','#3f8e43'],['Bronze','#847d48'],['Cocoa Brown','#6f5034'],['Brown','#9d432c'],['Maroon Red','#9d2235'],['Red','#c12e1f'],['Turquoise','#00b1b7'],['Cyan','#0086d6'],['Blue','#0a2989'],['Cobalt Blue','#0056b8'],['Purple','#5e43b7'],['Indigo Purple','#482960'],['Blue Grey','#5b6579'],['Dark Gray','#545454'],['Black','#000000']]},
  'Bambu PLA Matte':{material:'PLA',source:'https://store.bblcdn.eu/s8/default/f131f643495b417197832b291fc7b068/Bambu_PLA_Matte_Hex_Code.pdf',colors:[['Ivory White', '#ffffff'], ['Bone White', '#cbc6b8'], ['Desert Tan', '#e8dbb7'], ['Latte Brown', '#d3b7a7'], ['Caramel', '#ae835b'], ['Terracotta', '#b15533'], ['Dark Brown', '#7d6556'], ['Dark Chocolate', '#4d3324'], ['Lilac Purple', '#ae96d4'], ['Sakura Pink', '#e8afcf'], ['Mandarin Orange', '#f99963'], ['Lemon Yellow', '#f7d959'], ['Plum', '#950051'], ['Scarlet Red', '#de4343'], ['Dark Red', '#bb3d43'], ['Dark Green', '#68724d'], ['Grass Green', '#61c680'], ['Apple Green', '#c2e189'], ['Ice Blue', '#a3d8e1'], ['Sky Blue', '#56b7e6'], ['Marine Blue', '#0078bf'], ['Dark Blue', '#042f56'], ['Ash Gray', '#9b9ea0'], ['Nardo Gray', '#757575'], ['Charcoal', '#000000']]},
  'Bambu PETG HF':{material:'PETG',colors:[]},
  'Bambu ABS':{material:'ABS',colors:[]},
  'Custom / other brand':{material:'custom',colors:[]}
};
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
export function matchOriginalColors(sourcePalette,family='Bambu PLA Basic'){
 const families=family==='Bambu PLA Basic + Matte'?['Bambu PLA Basic','Bambu PLA Matte']:[family];
 const candidates=families.flatMap(f=>filamentFamilies[f].colors.map(([colorName,color])=>({family:f,colorName,color,lab:lab(color)})));
 const matches=sourcePalette.map(hex=>{const target=lab(hex);return candidates.reduce((best,m)=>{const distance=m.lab.reduce((s,v,k)=>s+(v-target[k])**2,0);return !best||distance<best.distance?{...m,distance}:best;},null);});
 return {sourcePalette,palette:matches.map(x=>x.color),filaments:matches.map(({family,colorName})=>({family,colorName})),backing:matches[0].color,backingFilament:{family:matches[0].family,colorName:matches[0].colorName}};
}
