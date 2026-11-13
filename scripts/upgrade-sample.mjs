// Development helper: retain an existing sample's artwork meshes while testing a new exporter.
import {readFileSync,writeFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import {exportWall} from '../lib/project3mf.mjs';
const zip=unzipSync(readFileSync(process.argv[2]));
const c=JSON.parse(strFromU8(zip['Metadata/surface-project.json'])).config;
const xml=strFromU8(zip['3D/3dmodel.model']),objects=new Map(),tiles=[];
const unesc=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
const colors=[...xml.matchAll(/<base [^>]*displaycolor="(#[0-9A-Fa-f]{6})[^"]*"/g)].map(m=>m[1]);
for(const m of xml.matchAll(/<object ([^>]+)>([\s\S]*?)<\/object>/g)){
 const attr=m[1],body=m[2],id=attr.match(/id="(\d+)"/)[1],name=unesc(attr.match(/name="([^"]*)"/)[1]);
 if(body.includes('<mesh>')){
  const idx=name.startsWith('Backing')?-1:Number(name.match(/^Color (\d+)/)?.[1])-1;
  objects.set(id,{name,color:colors[Number(attr.match(/pindex="(\d+)"/)[1])],filament:idx<0?c.backingFilament:c.filaments?.[idx],vertices:[...body.matchAll(/<vertex x="([^"]+)" y="([^"]+)" z="([^"]+)"/g)].map(m=>m.slice(1).map(Number)),triangles:[...body.matchAll(/<triangle v1="(\d+)" v2="(\d+)" v3="(\d+)"/g)].map(m=>m.slice(1).map(Number))});
 }else{
  const [,r,col]=name.match(/R(\d+)-C(\d+)/);tiles.push({name,row:Number(r)-1,col:Number(col)-1,parts:[...body.matchAll(/<component objectid="(\d+)"/g)].map(m=>objects.get(m[1]))});
 }
}
const result=exportWall(tiles,c);writeFileSync(process.argv[3],result.data);console.log(`${process.argv[3]}: ${tiles.length} tiles, ${result.format}`);
