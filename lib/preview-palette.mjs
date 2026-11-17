import {materialKey} from './filament-usage.mjs';
export function sourceShares(labels,count){
 const totals=Array(count).fill(0);let visible=0;
 for(const label of labels)if(label<count){totals[label]++;visible++;}
 return totals.map(n=>visible?n/visible:0);
}
export function previewPalette(c,shares=[],usage=null){
 const source=c.sourcePalette?.length===c.palette.length?c.sourcePalette:c.palette;
 const sources=source.map((color,i)=>({color,index:i+1,share:shares[i]??null})).sort((a,b)=>(b.share??0)-(a.share??0)||a.index-b.index);
 const groups=new Map();
 const add=(color,choice,index)=>{
  const material={color:color.toUpperCase(),family:choice?.family||'Custom / other brand',name:choice?.colorName||'Custom color'};
  const key=materialKey(material),entry=groups.get(key)||{...material,sourceIndices:[],backing:false};
  if(index)entry.sourceIndices.push(index);else entry.backing=true;
  entry.amount=usage?.materials.find(m=>materialKey(m)===key)||null;
  groups.set(key,entry);
 };
 c.palette.forEach((color,i)=>add(color,c.filaments?.[i],i+1));add(c.backing,c.backingFilament,null);
 const filaments=[...groups.values()];
 return {sources,filaments,surfaceFilamentCount:filaments.filter(f=>f.sourceIndices.length).length};
}
