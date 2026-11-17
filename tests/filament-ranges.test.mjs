import test from 'node:test';import assert from 'node:assert/strict';
import {matchGroups,matchingFamilies,availableFilaments,filamentFamilies,matchOriginalColors} from '../lib/filaments.mjs';
import {printers} from '../lib/printers.mjs';
test('combined PLA/PETG ranges match only supported members and retain backing',()=>{
  for(const printer of Object.keys(printers))for(const group of ['All Bambu PLA','Bambu PETG Basic + HF','All Bambu PETG']){
    assert.ok(matchingFamilies(printer).includes(group));
    const available=availableFilaments(printer),members=matchGroups[group].filter(f=>available.includes(f));
    const colors=members.flatMap(f=>filamentFamilies[f].colors.map(([,hex])=>hex));
    const previous={printer,backing:'#ffffff',backingFilament:{family:'Bambu PLA Basic'},backingLocked:true};
    const result=matchOriginalColors(colors,group,previous);
    assert.deepEqual(result.palette.map(x=>x.toLowerCase()),colors.map(x=>x.toLowerCase()));
    assert.ok(result.filaments.every(f=>members.includes(f.family)));
    assert.equal(result.backing,'#ffffff');assert.deepEqual(result.backingFilament,previous.backingFilament);
  }
});
