import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults} from '../lib/geometry.mjs';
import {zoomArtwork,imagePlacement} from '../lib/image.mjs';
const image={width:1600,height:1000};
test('wheel zoom preserves the source point under the pointer within crop bounds',()=>{
 const c={...defaults,zoom:2,panX:50,panY:50},x=.6,y=.4;
 const before=imagePlacement(image,c),next=zoomArtwork(image,c,-80,x,y),after=imagePlacement(image,{...c,...next});
 assert.ok(next.zoom>c.zoom);
 assert.ok(Math.abs((x*before.wallWidth-before.x)/before.width-(x*after.wallWidth-after.x)/after.width)<1e-10);
 assert.ok(Math.abs((y*before.wallHeight-before.y)/before.height-(y*after.wallHeight-after.y)/after.height)<1e-10);
});
test('zoom handles exact fit, both directions and existing scale bounds',()=>{
 for(const fit of ['cover','contain'])for(const zoom of [.25,1,4])for(const delta of [-1000,1000]){
 const next=zoomArtwork(image,{...defaults,fit,zoom},delta,0,1);
 assert.ok(next.zoom>=.25&&next.zoom<=4);
 assert.ok(next.panX>=0&&next.panX<=100);assert.ok(next.panY>=0&&next.panY<=100);
 }
 assert.equal(zoomArtwork(image,{...defaults,zoom:4},-100).zoom,4);
 assert.equal(zoomArtwork(image,{...defaults,zoom:.25},100).zoom,.25);
 assert.ok(zoomArtwork(image,defaults,100).zoom<defaults.zoom);
});
