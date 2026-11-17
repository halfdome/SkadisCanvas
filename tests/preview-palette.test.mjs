import test from 'node:test';import assert from 'node:assert/strict';
import {defaults} from '../lib/geometry.mjs';
import {previewPalette,sourceShares} from '../lib/preview-palette.mjs';
test('source ranking excludes transparency and keeps mapping identifiers',()=>{
 const shares=sourceShares([0,1,1,1,2,3,4,4],4);
 assert.deepEqual(shares,[1/6,3/6,1/6,1/6]);
 const result=previewPalette({...defaults,colorCount:8},shares);
 assert.equal(result.sources.length,4);assert.equal(result.sources[0].index,2);
 assert.equal(result.sources[0].color,defaults.palette[1]);
});
test('shared source matches merge without double-counting backing or usage',()=>{
 const f={family:'Bambu PLA Basic',colorName:'Jade White'};
 const c={...defaults,palette:['#ffffff','#FFFFFF','#000000'],sourcePalette:['#fffffe','#fefefe','#010101'],filaments:[f,f,{...f,colorName:'Black'}],backing:'#ffffff',backingFilament:f};
 const amount={color:'#FFFFFF',family:f.family,name:f.colorName,grams:123};
 const p=previewPalette(c,[],{materials:[amount]});
 assert.equal(p.sources.length,3);assert.equal(p.surfaceFilamentCount,2);assert.equal(p.filaments.length,2);
 assert.deepEqual(p.filaments[0].sourceIndices,[1,2]);assert.equal(p.filaments[0].backing,true);assert.equal(p.filaments[0].amount.grams,123);
});
