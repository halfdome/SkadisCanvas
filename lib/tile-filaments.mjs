// Use the generated parts so colors clipped away by slots are not listed.
// Match the export's material identity, including family and named color.
export function tileFilaments(parts) {
  const materials=new Map();
  for(const part of parts) {
    const color=part.color.toUpperCase();
    const family=part.filament?.family||'Custom / other brand';
    const name=part.filament?.colorName||'Custom color';
    const key=JSON.stringify([family,color,name]);
    const item=materials.get(key)||{color,family,name,surface:false,backing:false};
    if(part.name.startsWith('Backing - '))item.backing=true;
    else item.surface=true;
    materials.set(key,item);
  }
  return [...materials.values()].sort((a,b)=>Number(b.surface)-Number(a.surface));
}
