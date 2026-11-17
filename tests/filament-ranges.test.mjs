import test from 'node:test';import assert from 'node:assert/strict';
import {matchGroups,matchingFamilies,availableFilaments,filamentFamilies,matchOriginalColors,alignBackingMaterial} from '../lib/filaments.mjs';
import {printers} from '../lib/printers.mjs';
test('combined PLA/PETG ranges match supported members and align backing material',()=>{
  for(const printer of Object.keys(printers))for(const group of ['All Bambu PLA','Bambu PETG Basic + HF','All Bambu PETG']){
    assert.ok(matchingFamilies(printer).includes(group));
    const available=availableFilaments(printer),members=matchGroups[group].filter(f=>available.includes(f));
    const colors=members.flatMap(f=>filamentFamilies[f].colors.map(([,hex])=>hex));
    const previous={printer,backing:'#ffffff',backingFilament:{family:'Bambu PLA Basic'},backingLocked:true};
    const result=matchOriginalColors(colors,group,previous);
    assert.deepEqual(result.palette.map(x=>x.toLowerCase()),colors.map(x=>x.toLowerCase()));
    assert.ok(result.filaments.every(f=>members.includes(f.family)));
    assert.equal(filamentFamilies[result.backingFilament.family].material,filamentFamilies[members[0]].material);
    assert.ok(available.includes(result.backingFilament.family));
    if(group==='All Bambu PLA')assert.deepEqual(result.backingFilament,previous.backingFilament);
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
test('risk warnings require positive use and treat PLA/PETG variants as one material',()=>{
 const c={palette:['#ffffff'],filaments:[{family:'Bambu PETG-CF'}],backingFilament:{family:'Bambu PLA Basic'}};
 for(const familyList of [['Bambu PLA Basic','Bambu PLA Matte'],['Bambu PETG Basic','Bambu PETG HF','Bambu PETG Matte']]){
  const warning=filamentWarnings(c,familyList.map(family=>({family,volume:100})));
  assert.equal(warning.plaPetg,false);assert.equal(warning.mixed,false);assert.equal(warning.abrasive,false);
 }
 assert.equal(filamentWarnings(c,[]).plaPetg,false);assert.equal(filamentWarnings(c,[]).abrasive,false);
 assert.equal(filamentWarnings(c,[{family:'Bambu PETG HF',volume:10},{family:'Bambu PETG-CF',volume:0}]).abrasive,false);
 assert.equal(filamentWarnings(c,[{family:'Bambu PETG-CF',volume:10}]).abrasive,true);
});

test('artwork changes align incompatible backing both ways without losing its color intent',()=>{
 const original={printer:'x1c',backing:'#ffffff',backingFilament:{family:'Bambu PLA Basic',colorName:'Jade White'},backingLocked:true};
 const petg=alignBackingMaterial(original,'Bambu PETG Basic');
 assert.equal(petg.backingFilament.family,'Bambu PETG HF');
 assert.match(petg.backingFilament.colorName,/white/i);
 assert.equal(petg.backingLocked,true);
 const pla=alignBackingMaterial(petg,'Bambu PLA Matte');
 assert.equal(pla.backingFilament.family,'Bambu PLA Basic');
 assert.equal(pla.backing,'#ffffff');
 assert.equal(alignBackingMaterial(petg,'Bambu PETG-CF'),petg);
 assert.equal(alignBackingMaterial(original,'Custom / other brand'),original);
 const custom={...original,backingFilament:{family:'Custom / other brand'}};
 assert.equal(alignBackingMaterial(custom,'Bambu PETG HF'),custom);
 const dark=alignBackingMaterial({...original,backing:'#000000'},'Bambu PETG HF');
 assert.match(dark.backingFilament.colorName,/black/i);
});
