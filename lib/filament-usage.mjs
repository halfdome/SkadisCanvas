import profiles from './bambu-profiles.mjs';
import {layerPlan} from './layers.mjs';

export const materialKey=m=>JSON.stringify([m.family,m.color.toUpperCase(),m.name]);
export const usageAssumptions='Approximate model use: 15% infill, 2 walls and exported top/bottom layers. Excludes purge, prime tower, supports and failed prints. Confirm final totals after slicing.';

export function materialUsage(volume,material,printer){
  const preset=profiles[printer]?.filaments[material.family];
  const density=Number(preset?.filament_density?.[0])||1.24;
  const diameter=Number(preset?.filament_diameter?.[0])||1.75;
  return {...material,volume,grams:volume*density/1000,meters:volume/(Math.PI*(diameter/2)**2)/1000,density,diameter,assumedDensity:!preset};
}
export function combineUsage(reports){
  const entries=new Map();
  for(const report of reports)for(const item of report.materials){
    const key=materialKey(item),prev=entries.get(key);
    if(prev){prev.volume+=item.volume;prev.grams+=item.grams;prev.meters+=item.meters;}
    else entries.set(key,{...item});
  }
  const materials=[...entries.values()];
  return {materials,grams:materials.reduce((n,m)=>n+m.grams,0),meters:materials.reduce((n,m)=>n+m.meters,0)};
}

// Integrate material cross-sections at print-layer midpoints. Offset the whole
// object (not each color region) so color boundaries do not invent extra walls.
// Nearby sections retain solid skins around the board and the spacer ends.
// This is a geometric estimate, not a toolpath/flush calculation.
export function estimateUsage(api,parts,c){
  const owned=[],keep=x=>(owned.push(x),x),volumes=parts.map(()=>0);
  try{
    const solids=parts.map(part=>{
      const mesh=new api.Mesh({numProp:3,vertProperties:Float32Array.from(part.vertices.flat()),triVerts:Uint32Array.from(part.triangles.flat())});mesh.merge();
      const solid=keep(new api.Manifold(mesh));
      if(solid.status()!=='NoError')throw Error('Usage could not be estimated from this geometry.');
      return solid;
    });
    const whole=keep(api.Manifold.union(solids)),box=whole.boundingBox(),height=box.max[2];
    const process=profiles[c.printer]?.process||{};
    const wallWidth=(Number(process.outer_wall_line_width)||.42)+(Number(process.inner_wall_line_width)||.45);
    const plan=layerPlan(c),bottom=(plan.full?3:Math.max(3,c.colorLayers))*c.layerHeight;
    const top=Math.max(5,Math.ceil((Number(process.top_shell_thickness)||1)/c.layerHeight-1e-8))*c.layerHeight;
    for(let z0=0;z0<height-1e-6;z0+=c.layerHeight){
      const dz=Math.min(c.layerHeight,height-z0),z=z0+dz/2;
      const layerOwned=[],local=x=>(layerOwned.push(x),x);
      try{
        const section=local(whole.slice(z)),inner=local(section.offset(-wallWidth));
        const above=local(whole.slice(z+top)),below=local(whole.slice(z-bottom));
        const enclosed=local(inner.intersect(above)),sparse=local(enclosed.intersect(below));
        solids.forEach((solid,i)=>{
          const face=local(solid.slice(z)),core=local(face.intersect(sparse));
          volumes[i]+=Math.max(0,face.area()-.85*core.area())*dz;
        });
      }finally{layerOwned.reverse().forEach(x=>x.delete());}
    }
    return combineUsage(parts.map((part,i)=>({materials:[materialUsage(volumes[i],{color:part.color.toUpperCase(),family:part.filament?.family||'Custom / other brand',name:part.filament?.colorName||'Custom color'},c.printer)]})));
  }finally{owned.reverse().forEach(x=>x.delete());}
}
