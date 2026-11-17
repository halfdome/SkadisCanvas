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

import {filamentWarnings} from '../lib/filaments.mjs';
test('PLA/PETG incompatibility includes backing and all PLA/PETG variants',()=>{
 const c={palette:['#ffffff'],filaments:[{family:'Bambu PETG HF'}],backingFilament:{family:'Bambu PLA Basic'}};
 assert.equal(filamentWarnings(c).plaPetg,true);
 assert.equal(filamentWarnings({...c,filaments:[{family:'Bambu PLA Matte'}]}).plaPetg,false);
 assert.equal(filamentWarnings({...c,backingFilament:{family:'Bambu PETG Basic'}}).plaPetg,false);
 assert.equal(filamentWarnings({...c,palette:['#ffffff','#000000'],filaments:[{family:'Bambu PETG-CF'},{family:'Bambu PLA-CF'}],backingFilament:{family:'Bambu PETG HF'}}).plaPetg,true);
});
test('material alerts ignore unused assignments after usage is known',()=>{
 const c={palette:['#ffffff'],filaments:[{family:'Bambu PETG HF'}],backingFilament:{family:'Bambu PLA Basic'}};
 assert.equal(filamentWarnings(c,[{family:'Bambu PETG HF',volume:100},{family:'Bambu PLA Basic',volume:0}]).plaPetg,false);
 assert.equal(filamentWarnings(c,[{family:'Bambu PLA Basic',volume:100},{family:'Bambu PLA Matte',volume:20}]).mixed,false);
 assert.equal(filamentWarnings(c,[{family:'Bambu PETG HF',volume:100},{family:'Bambu PLA Basic',volume:1}]).plaPetg,true);
});
