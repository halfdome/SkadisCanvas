import {zipSync,strToU8} from 'fflate';
import profiles from './bambu-profiles.mjs';
import {printerLimits,plateLayout} from './printers.mjs';

import {MAX_PLATES,partitionWall,inRegion,regionLabel} from './partitions.mjs';
export {MAX_PLATES} from './partitions.mjs';
const fmt=n=>Number(n.toFixed(6));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const meta=(key,value)=>`<metadata key="${esc(key)}" value="${esc(value)}"/>`;
const transform=(x,y,z=0)=>`1 0 0 0 1 0 0 0 1 ${fmt(x)} ${fmt(y)} ${fmt(z)}`;
export const isBambu=c=>Object.hasOwn(profiles,c?.printer);
export function exportWall(tiles,config){
  const expected=config.cols*config.rows,seen=new Set(tiles.map(t=>`${t.col},${t.row}`));
  if(tiles.length!==expected||seen.size!==expected||tiles.some(t=>!Number.isInteger(t.col)||!Number.isInteger(t.row)||t.col<0||t.row<0||t.col>=config.cols||t.row>=config.rows))throw Error(`Entire-wall export requires all ${expected} tiles exactly once.`);
  if(!isBambu(config)||tiles.length<=MAX_PLATES)return {data:makeProject3mf(tiles,config),format:'3mf',projectCount:1,tileCount:tiles.length};
  const regions=partitionWall(config.cols,config.rows),files={};
  for(const r of regions)files[`part-${r.number}-${regionLabel(r)}.3mf`]=makeProject3mf(tiles.filter(t=>inRegion(t,r)),{...config,region:r});
  files['assembly-map.svg']=strToU8(`<svg xmlns="http://www.w3.org/2000/svg" width="${config.cols*90}" height="${config.rows*90}" viewBox="0 0 ${config.cols*90} ${config.rows*90}">${regions.map(r=>`<rect x="${r.col*90}" y="${r.row*90}" width="${r.cols*90}" height="${r.rows*90}" fill="${['#dce9df','#f6ddb9','#dddeef','#efd5d3'][r.number%4]}" stroke="#304f4a"/><text x="${(r.col+r.cols/2)*90}" y="${(r.row+r.rows/2)*90}" text-anchor="middle" font-family="sans-serif" font-size="18">Part ${r.number} · ${r.count} tiles</text>`).join('')}</svg>`);
  files['READ-ME.txt']=strToU8(`Open each 3MF as a project in Bambu Studio. Each contains a rectangular portion of the wall with one tile per plate. All ${tiles.length} tiles are included exactly once across ${regions.length} files. Filenames and object names retain installed-wall row/column coordinates. R01 is the top row; C01 is the left column. See assembly-map.svg. Artwork is ${config.faceDown?'face-down: inspect the first layers':'face-up: inspect the last layers'} after slicing.\n`);
  return {data:zipSync(files,{level:0}),format:'zip',projectCount:regions.length,tileCount:tiles.length};
}
function materialSpec(p){
  const family=p.filament?.family||'Custom / other brand';
  return {family,color:p.color.toUpperCase(),name:p.filament?.colorName||'Custom color'};
}
function settings(c,materials,plan){
  const layout=plateLayout(c);
  const base=profiles[c.printer], presets=materials.map(m=>{
    const preset=base.filaments[m.family==='Custom / other brand'?'Generic PLA':m.family];
    if(!preset)throw Error(`${m.family} has no preset for this printer.`);
    return preset;
  });
  const filamentSettings={};
  for(const key of new Set(presets.flatMap(p=>Object.keys(p)))){
    if(key==='preset'||key==='id')continue;
    const fallback=presets.find(p=>p[key]!==undefined)[key];
    const values=presets.map(p=>p[key]??fallback);
    filamentSettings[key]=Array.isArray(values[0])?values.flat():values[0];
  }
  const result={
    ...base.machine,...base.process,...filamentSettings,
    filament_self_index:presets.flatMap((p,i)=>(p.filament_extruder_variant||[0]).map(()=>String(i+1))),
    printer_settings_id:base.machineId,print_settings_id:base.processId,
    filament_colour:materials.map(m=>m.color),
    filament_settings_id:presets.map(p=>p.preset),
    filament_type:presets.map(p=>p.filament_type[0]),
    filament_ids:presets.map(p=>p.id),
    filament_vendor:presets.map(p=>p.filament_vendor[0]),
    filament_is_support:materials.map(()=>'0'),filament_map:materials.map(()=>'1'),
    layer_height:String(c.layerHeight),initial_layer_print_height:String(c.layerHeight),
    bottom_shell_layers:String(Math.max(3,c.colorLayers)),bottom_shell_thickness:String(c.layerHeight*c.colorLayers),
    top_shell_layers:'5',sparse_infill_density:'15%',wall_loops:'2',brim_type:'no_brim',
    curr_bed_type:'Textured PEI Plate',enable_prime_tower:layout.tower?'1':'0',
    wipe_tower_x:Array(plan.active).fill(String(layout.tower?.x??15)),
    wipe_tower_y:Array(plan.active).fill(String(layout.tower?.y??15)),
  };
  // Studio's GUI merges named system presets and discards unmarked overrides,
  // unlike its CLI. Preserve every authored process setting during that merge.
  const overrides=['layer_height','initial_layer_print_height','bottom_shell_layers','bottom_shell_thickness','top_shell_layers','sparse_infill_density','wall_loops','brim_type','enable_prime_tower'];
  if(layout.tower?.compact){
    Object.assign(result,{prime_tower_width:String(layout.tower.width),prime_tower_brim_width:'0',prime_tower_rib_wall:'0',prime_tower_fillet_wall:'0'});
    overrides.push('prime_tower_width','prime_tower_brim_width','prime_tower_rib_wall','prime_tower_fillet_wall');
  }
  result.different_settings_to_system=[overrides.join(';'),...materials.map(()=>''),''];
  return result;
}
export function make3mf(parts,title='SKADIS tile',config=null,coordinates={col:0,row:0}){return makeProject3mf([{parts,name:title,...coordinates}],config,{singleTile:true});}
export function makeProject3mf(tiles,config,{singleTile=false}={}){
  if(!tiles.length)throw Error('No tiles to export.');
  const native=isBambu(config),plan={active:tiles.length},bed=native?printerLimits(config):null,layout=native?plateLayout(config):null;
  const materials=[],materialMap=new Map(),resources=[],build=[],objects=[],plates=[],assembly=[];
  if(native&&tiles.length>MAX_PLATES)throw Error('Split the mural into rectangular projects of at most 36 plates.');
  let nextId=2;
  tiles.forEach((tile,index)=>{
    const components=[],parts=[];
    tile.parts.forEach(p=>{
      const spec=materialSpec(p),key=spec.family+'|'+spec.color;
      if(!materialMap.has(key)){materialMap.set(key,materials.length);materials.push(spec);}
      const mat=materialMap.get(key),id=nextId++;
      resources.push(`<object id="${id}" type="model" name="${esc(p.name)}" pid="1" pindex="${mat}"><mesh><vertices>${p.vertices.map(v=>`<vertex x="${fmt(v[0])}" y="${fmt(v[1])}" z="${fmt(v[2])}"/>`).join('')}</vertices><triangles>${p.triangles.map(t=>`<triangle v1="${t[0]}" v2="${t[1]}" v3="${t[2]}"/>`).join('')}</triangles></mesh></object>`);
      components.push(`<component objectid="${id}"/>`);
      parts.push(`<part id="${id}" subtype="normal_part">${meta('name',p.name)}${meta('extruder',mat+1)}${meta('matrix','1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1')}</part>`);
    });
    const id=nextId++,name=tile.name;
    resources.push(`<object id="${id}" type="model" name="${esc(name)}"><components>${components.join('')}</components></object>`);
    let x=config&&!singleTile?tile.col*(config.width+10):0,y=config&&!singleTile?(config.rows-1-tile.row)*(config.height+10):0;
    if(native){
      const n=index,cols=Math.ceil(Math.sqrt(plan.active));
      x=(n%cols)*bed.width*1.2+layout.x;y=-Math.floor(n/cols)*bed.depth*1.2+layout.y;
      plates.push(`<plate>${meta('plater_id',n+1)}${meta('plater_name',tile.name)}${meta('locked','false')+meta('bed_type','Textured PEI Plate')}<model_instance>${meta('object_id',id)}${meta('instance_id',0)}${meta('identify_id',index+1)}</model_instance></plate>`);
      objects.push(`<object id="${id}">${meta('name',name)}${meta('extruder',1)}${parts.join('')}</object>`);
      assembly.push(`<assemble_item object_id="${id}" instance_id="0" transform="${transform(tile.col*(config.width+config.gap),(config.rows-1-tile.row)*(config.height+config.gap))}" offset="0 0 0"/>`);
    }
    build.push(`<item objectid="${id}" transform="${transform(x,y)}" printable="1"/>`);
  });
  const files={
    '[Content_Types].xml':strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="application/xml"/><Default Extension="json" ContentType="application/json"/><Default Extension="txt" ContentType="text/plain"/></Types>'),
    '_rels/.rels':strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>'),
    // The Application marker selects Bambu's project importer rather than its
    // generic color-conversion wizard. Generator records the actual authoring app.
    '3D/3dmodel.model':strToU8(`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:BambuStudio="http://schemas.bambulab.com/package/2021">${native?'<metadata name="Application">BambuStudio-02.09.01.70</metadata><metadata name="BambuStudio:3mfVersion">1</metadata>':''}<metadata name="Generator">Skadis Canvas</metadata><metadata name="Title">Skadis Canvas - ${tiles.length} tiles</metadata><resources><basematerials id="1">${materials.map(m=>`<base name="${esc(m.family+' / '+m.name)}" displaycolor="${m.color}FF"/>`).join('')}</basematerials>${resources.join('')}</resources><build>${build.join('')}</build></model>`)
  };
  if(native){files['Metadata/model_settings.config']=strToU8(`<?xml version="1.0" encoding="UTF-8"?><config>${objects.join('')}${plates.join('')}<assemble>${assembly.join('')}</assemble></config>`);files['Metadata/project_settings.config']=strToU8(JSON.stringify(settings(config,materials,plan),null,2));}
  if(config){files['Metadata/surface-project.json']=strToU8(JSON.stringify({version:1,config,region:config.region,tiles:tiles.map(t=>({name:t.name,row:t.row+1,col:t.col+1}))},null,2));files['Metadata/print-guide.txt']=strToU8(`${native?`Open as a PROJECT in Bambu Studio. ${tiles.length} tiles on separate plates. This file contains one rectangular portion of the installed wall; names retain original wall row/column coordinates. Verify printer, filament presets and purge tower before slicing.`:'Generic 3MF: keep each tile grouped, assign filaments and arrange plates in your slicer.'}\nFirst and subsequent layer heights: ${config.layerHeight} mm. Color depth: ${config.colorLayers*config.layerHeight} mm. ${config.faceDown?'Face-down orientation is already applied. Do not mirror again. Top view shows the backing; inspect bottom/first layers for the image.':'Face-up orientation is already applied. Do not mirror. The backing prints first; inspect the top/last layers for the image.'} R01 is the top row and C01 the left column on the installed wall. Custom filament colors use Generic PLA as a starting preset; select the actual material before printing. No mounting hardware or connectors included. ${config.backLabel?'Tile IDs are engraved on the back. R01-C01 is the top-left tile viewed from the artwork side.':''} Test accessory fit before printing the wall.`);}
  return zipSync(files,{level:6});
}
