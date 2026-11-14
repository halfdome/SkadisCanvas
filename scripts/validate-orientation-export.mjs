import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import assert from 'node:assert/strict';
import {unzipSync,strFromU8} from 'fflate';
import {inspectLayers} from './validate-sliced.mjs';
// Test only actual UI downloads passed on the command line.
const [outputDir,...inputs]=process.argv.slice(2),dir=path.resolve(outputDir);
mkdirSync(dir,{recursive:true});
const reports=[];
for(const input of inputs){
  const zip=unzipSync(readFileSync(input)),c=JSON.parse(strFromU8(zip['Metadata/surface-project.json'])).config;
  assert.equal(c.backing,'#ffffff');assert.equal(c.backingFilament.colorName,'Jade White');
  const name=`${c.printer}-${c.faceDown?'face-down':'face-up'}-${c.colorLayers}-layers`,source=path.join(dir,name+'.3mf'),sliced=path.join(dir,name+'-sliced.3mf');
  copyFileSync(input,source);
  const run=spawnSync('/Applications/BambuStudio.app/Contents/MacOS/BambuStudio',['--debug','2','--slice','0','--export-3mf',sliced,source],{cwd:dir,encoding:'utf8',timeout:180000,maxBuffer:16e6});
  writeFileSync(path.join(dir,name+'.log'),(run.stdout||'')+(run.stderr||''));
  assert.equal(run.status,0,`${name}: Bambu Studio slicing failed: ${run.error||run.signal||''}`);
  const slicedZip=unzipSync(readFileSync(sliced)),plates=Object.keys(slicedZip).filter(n=>/^Metadata\/plate_\d+\.gcode$/.test(n));
  assert.equal(plates.length,c.cols*c.rows);
  const config=JSON.parse(strFromU8(zip['Metadata/project_settings.config']));
  const white=config.filament_colour.indexOf('#FFFFFF');assert.ok(white>=0);
  const surfaceTools=c.palette.map(hex=>config.filament_colour.indexOf(hex.toUpperCase())).sort((a,b)=>a-b);
  for(const plate of plates){
    const layers=inspectLayers(strFromU8(slicedZip[plate]));assert.equal(layers.size,Math.round(c.thickness/c.layerHeight));
    let count=0;
    for(const [z,tools] of layers){
      const colored=c.faceDown?z<=c.colorLayers*c.layerHeight+1e-5:z>c.thickness-c.colorLayers*c.layerHeight+1e-5;
      assert.deepEqual([...tools].sort((a,b)=>a-b),colored?surfaceTools:[white],`${name} at Z=${z}`);
      if(colored)count++;
    }
    assert.equal(count,c.colorLayers);
  }
  const report={input,source,sliced,printer:c.printer,faceDown:c.faceDown,plates:plates.length,coloredLayers:c.colorLayers,backing:c.backing};reports.push(report);console.log(JSON.stringify(report));
}
writeFileSync(path.join(dir,'report.json'),JSON.stringify(reports,null,2));
