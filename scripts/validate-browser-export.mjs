import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {inspectLayers} from './validate-sliced.mjs';
// Input must be a ZIP downloaded through the real UI. Never generates a substitute.
const [input,outputDir,colorArg]=process.argv.slice(2),dir=path.resolve(outputDir),expectedColors=Number(colorArg||4);
mkdirSync(dir,{recursive:true});
const bundle=unzipSync(readFileSync(input)),files=Object.keys(bundle).filter(n=>n.endsWith('.3mf'));
assert.equal(files.length,2,'5x8 wall has two rectangular files');
const seen=new Set(),results=[];
for(const name of files){
 const source=path.join(dir,name),sliced=path.join(dir,name.replace('.3mf','-sliced.3mf'));
 writeFileSync(source,bundle[name]);
 const zip=unzipSync(bundle[name]),manifest=JSON.parse(strFromU8(zip['Metadata/surface-project.json']));
 const c=manifest.config,region=manifest.region;assert.equal(manifest.tiles.length,20);
 for(const t of manifest.tiles){assert.ok(!seen.has(t.name));seen.add(t.name);assert.ok(t.row>=region.row+1&&t.row<=region.row+region.rows&&t.col>=region.col+1&&t.col<=region.col+region.cols);}
 assert.equal(c.colorCount,expectedColors,'Requested color count retained');
 assert.equal(c.sourcePalette.length,expectedColors);assert.deepEqual(c.palette,c.sourcePalette,'Fixture colors match exact manufacturer swatches');
 assert.ok(c.sourcePalette.every(x=>['#ffffff','#000000','#00ae42','#c12e1f','#f4ee2a','#0086d6','#ec008c','#ff6a13'].includes(x)),'Every extracted color exists in original PNG');
 const studio=process.env.BAMBU_STUDIO||'/Applications/BambuStudio.app/Contents/MacOS/BambuStudio';
 const run=spawnSync(studio,['--debug','2','--slice','0','--export-3mf',sliced,source],{cwd:dir,encoding:'utf8',timeout:1200000,maxBuffer:16e6});
 writeFileSync(source+'.log',(run.stdout||'')+(run.stderr||''));
 assert.equal(run.status,0,`${name}: actual Bambu slicing must succeed (${run.error||run.signal||''})`);
 const slicedZip=unzipSync(readFileSync(sliced)),plates=Object.keys(slicedZip).filter(n=>/^Metadata\/plate_\d+\.gcode$/.test(n));
 assert.equal(plates.length,20);
 for(const plate of plates){
  const layers=inspectLayers(strFromU8(slicedZip[plate]));assert.equal(layers.size,25);
  for(const [z,tools] of layers){assert.ok(!tools.has(null));if(z<=.60001)assert.equal(tools.size,expectedColors,`${plate}: all ${expectedColors} original colors in surface`);else assert.deepEqual([...tools],[0],`${plate}: only backing above surface`);}
 }
 const result={file:name,printer:c.printer,tileSize:[c.width,c.height],region,plates:plates.length,layers:25,coloredLayers:3,colors:expectedColors,sourcePalette:c.sourcePalette};results.push(result);console.log(JSON.stringify(result));
}
assert.equal(seen.size,40);writeFileSync(path.join(dir,'report.json'),JSON.stringify({input,tiles:seen.size,results},null,2));
