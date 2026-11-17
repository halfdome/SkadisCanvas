import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPopout} from '../lib/popout-position.mjs';
test('dragging and resizing keep the guide and its controls inside the viewport',()=>{
 assert.deepEqual(clampPopout({x:100,y:60},780,600,1440,900),{x:100,y:60});
 assert.deepEqual(clampPopout({x:-600,y:-20},780,600,1440,900),{x:8,y:8});
 assert.deepEqual(clampPopout({x:1700,y:1000},780,600,1440,900),{x:652,y:292});
 assert.deepEqual(clampPopout({x:652,y:292},374,700,390,844),{x:8,y:136});
});
