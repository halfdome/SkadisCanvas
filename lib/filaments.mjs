// Manufacturer display swatches; these are not colorimetric print measurements or live stock.
export const filamentFamilies={
  'Bambu PLA Basic':{material:'PLA',source:'https://store.bblcdn.com/s7/default/1084369ef84345bbaa5d704a492954e0/Bambu_PLA_Basic_Hex_Code.pdf',colors:[['Jade White','#ffffff'],['Beige','#f7e6de'],['Light Gray','#d1d3d5'],['Silver','#a6a9aa'],['Gray','#8e9089'],['Magenta','#ec008c'],['Pink','#f55a74'],['Hot Pink','#f5547c'],['Orange','#ff6a13'],['Pumpkin Orange','#ff9016'],['Gold','#e4bd68'],['Sunflower Yellow','#fec600'],['Yellow','#f4ee2a'],['Bright Green','#becf00'],['Bambu Green','#00ae42'],['Mistletoe Green','#3f8e43'],['Bronze','#847d48'],['Cocoa Brown','#6f5034'],['Brown','#9d432c'],['Maroon Red','#9d2235'],['Red','#c12e1f'],['Turquoise','#00b1b7'],['Cyan','#0086d6'],['Blue','#0a2989'],['Cobalt Blue','#0056b8'],['Purple','#5e43b7'],['Indigo Purple','#482960'],['Blue Grey','#5b6579'],['Dark Gray','#545454'],['Black','#000000']]},
  'Bambu PLA Matte':{material:'PLA',source:'https://store.bblcdn.eu/s8/default/297a7e758f3e45e0a3691c41ca90ec1b/Bambu_PLA_Matte_Hex_Code.pdf',colors:[['Ivory White','#ffffff'],['Charcoal','#000000'],['Ash Gray','#9b9ea0'],['Marine Blue','#0078bf'],['Scarlet Red','#de4343'],['Mandarin Orange','#f99963']]},
  'Bambu PETG HF':{material:'PETG',colors:[]},
  'Bambu ABS':{material:'ABS',colors:[]},
  'Custom / other brand':{material:'custom',colors:[]}
};
export function filamentName(c,index){const f=index<0?c.backingFilament:c.filaments?.[index];return f?`${f.family} / ${f.colorName||'Custom color'}`:'Custom color';}
export function mixedMaterials(c){const list=[...(c.filaments||[]).slice(0,c.palette.length),c.backingFilament].filter(Boolean).map(f=>filamentFamilies[f.family]?.material).filter(x=>x&&x!=='custom');return new Set(list).size>1;}
export function nearestPreset(hex,family){const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)),target=rgb(hex);return [...filamentFamilies[family].colors].sort((a,b)=>{const d=h=>rgb(h).reduce((s,v,k)=>s+(v-target[k])**2,0);return d(a[1])-d(b[1]);})[0];}
