import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,tileParts} from '../lib/geometry.mjs';
import {tileFilaments} from '../lib/tile-filaments.mjs';

test('tile list contains only generated surface materials and the actual backing',()=>{
  const c={...defaults,cols:1,rows:1,filaments:defaults.palette.map((_,i)=>({family:'Bambu PLA Basic',colorName:`Color ${i+1}`}))};
  const parts=tileParts(c,new Uint8Array([1]),1,1);
  const list=tileFilaments(parts);
  assert.equal(list.length,2);
  assert.equal(list[0].color,c.palette[1].toUpperCase());
  assert.equal(list[0].name,'Color 2');
  assert.equal(list[0].surface,true);
  assert.equal(list[1].backing,true);
  assert.equal(list[1].color,c.backing.toUpperCase());
  const full=tileFilaments(tileParts({...c,colorLayers:25},new Uint8Array([1]),1,1));
  assert.equal(full.length,1);assert.equal(full[0].backing,false);
});
test('reused filament merges roles while same-hex different materials remain distinct',()=>{
  const filament={family:'Bambu PLA Basic',colorName:'Jade White'};
  const list=tileFilaments([
    {name:'Backing - white',color:'#ffffff',filament},
    {name:'Color 1',color:'#FFFFFF',filament},
    {name:'Color 2',color:'#ffffff',filament:{family:'Bambu PETG HF',colorName:'White'}}
  ]);
  assert.equal(list.length,2);
  assert.deepEqual([list[0].surface,list[0].backing],[true,true]);
  assert.equal(list[1].family,'Bambu PETG HF');
});

import {printers} from '../lib/printers.mjs';
import {matchOriginalColors} from '../lib/filaments.mjs';
test('X1C defaults to eight colors, while a smaller artwork palette reports its actual count',()=>{
  assert.equal(printers.x1c.colorCount,8);
  assert.equal(matchOriginalColors(['#ff0000','#00ff00','#0000ff'],'Bambu PLA Basic',{printer:'x1c'}).colorCount,3);
});
