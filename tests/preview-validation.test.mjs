import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,validate,validatePreview} from '../lib/geometry.mjs';
import {printerLimits} from '../lib/printers.mjs';
import {matchOriginalColors} from '../lib/filaments.mjs';
test('a new photo with more colors still previews when its larger tower exceeds the existing maximum tile',()=>{
 const c={...defaults,cols:1,rows:1,...matchOriginalColors(defaults.palette,defaults.matchFamily,defaults)};
 const limit=printerLimits(c);c.width=Math.floor(limit.usableWidth);c.height=Math.floor(limit.usableDepth);validate(c);
 const photoColors=['#c87f56','#f6f6f6','#c3edaf','#009065','#555361','#aae063','#ff5270','#5142af'];
 const replacement={...c,...matchOriginalColors(photoColors,c.matchFamily,c)};
 assert.ok(printerLimits(replacement).usableDepth<c.height);
 assert.throws(()=>validate(replacement),/allowance/);
 assert.doesNotThrow(()=>validatePreview(replacement));
 const next=printerLimits(replacement);assert.doesNotThrow(()=>validate({...replacement,width:Math.floor(next.usableWidth),height:Math.floor(next.usableDepth)}));
});
test('export-only layer and detail limits do not prevent displaying artwork',()=>{
 for(const patch of [{colorLayers:100},{pixel:.1},{printer:'custom',bedWidth:100,bedDepth:100}]){
  assert.throws(()=>validate({...defaults,...patch}));
  assert.doesNotThrow(()=>validatePreview({...defaults,...patch}));
 }
});
test('invalid drawing dimensions still prevent preview rendering',()=>{
 for(const patch of [{width:''},{rows:NaN},{height:0},{pitch:0},{palette:[]}])assert.throws(()=>validatePreview({...defaults,...patch}));
});
