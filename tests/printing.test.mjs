import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,tileParts,validate,makeProject3mf} from '../lib/geometry.mjs';
import {matchOriginalColors} from '../lib/filaments.mjs';
import {unzipSync,strFromU8} from 'fflate';
import {saveSettingsAs} from '../lib/settings-file.mjs';

test('white PLA backing survives original-image rematching by default',()=>{
  const c={...defaults,...matchOriginalColors(['#c12e1f','#00ae42'],'Bambu PLA Basic',defaults)};
  assert.equal(c.backing,'#ffffff');
  assert.deepEqual(c.backingFilament,{family:'Bambu PLA Basic',colorName:'Jade White'});
  const part=tileParts({...c,width:40,height:40,cols:1,rows:1},new Uint8Array([0]),1,1)[0];
  assert.equal(part.color,'#ffffff');assert.deepEqual(part.filament,c.backingFilament);
});

test('orientation preserves artwork handedness and puts the chosen colored depth at the correct face',()=>{
  for(const faceDown of [true,false])for(const colorLayers of [1,3,8,10]) {
    const c={...defaults,faceDown,colorLayers,cols:1,rows:1,width:40,height:40,palette:['#c12e1f','#00ae42']};
    const parts=tileParts(c,new Uint8Array([0,1,1,1]),2,2),depth=.2*colorLayers;
    const bounds=p=>[Math.min(...p.vertices.map(v=>v[2])),Math.max(...p.vertices.map(v=>v[2]))];
    const close=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-7));
    close(bounds(parts[0]),faceDown?[depth,5]:[0,5-depth]);
    for(const part of parts.slice(1))close(bounds(part),faceDown?[0,depth]:[5-depth,5]);
    const red=parts[1];assert.ok(red.vertices.every(v=>v[1]>=20-1e-8&&(faceDown?v[0]>=20-1e-8:v[0]<=20+1e-8)));
    const zip=unzipSync(makeProject3mf([{name:'R01-C01',row:0,col:0,parts}],c));
    const guide=strFromU8(zip['Metadata/print-guide.txt']);
    assert.ok(guide.includes(faceDown?'Face-down':'Face-up'));
    assert.equal(JSON.parse(strFromU8(zip['Metadata/surface-project.json'])).config.faceDown,faceDown);
  }
});

test('face-up requires a whole number of print layers to preserve requested colored layer count',()=>{
  assert.throws(()=>validate({...defaults,faceDown:false,layerHeight:.3}),/multiple of layer height/);
  validate({...defaults,faceDown:false,layerHeight:.3,thickness:5.1});
});

test('save-as writes settings to the chosen handle and closes it; cancellation does not download',async()=>{
  let options,contents,closed=false;
  assert.equal(await saveSettingsAs({...defaults,faceDown:false},{showSaveFilePicker:async o=>{options=o;return {createWritable:async()=>({write:async text=>{contents=text;},close:async()=>{closed=true;}})}}}),'saved');
  assert.equal(options.suggestedName,'skadis-project.json');assert.ok(closed);
  assert.equal(JSON.parse(contents).config.faceDown,false);assert.equal(JSON.parse(contents).config.backing,'#ffffff');
  assert.equal(await saveSettingsAs(defaults,{showSaveFilePicker:async()=>{throw Object.assign(new Error('Cancelled'),{name:'AbortError'});}}),'cancelled');
});
