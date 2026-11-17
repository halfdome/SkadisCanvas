import test from 'node:test';import assert from 'node:assert/strict';
import {takeArtworkFile,validateArtworkFile,readArtworkFile} from '../lib/artwork-upload.mjs';
const photo={name:'IMG_0576.jpg',type:'image/jpeg',size:2800000};
test('file selections are cleared so the same photo can be chosen repeatedly',()=>{
 const input={files:[photo],value:'C:\\fakepath\\IMG_0576.jpg'};
 assert.equal(takeArtworkFile(input),photo);assert.equal(input.value,'');
 input.value='C:\\fakepath\\IMG_0576.jpg';assert.equal(takeArtworkFile(input),photo);assert.equal(input.value,'');
 assert.equal(takeArtworkFile({files:[],value:''}),undefined);
});
test('missing generic MIME metadata can fall back to recognized image extensions',()=>{
 for(const type of ['', 'application/octet-stream','image/jpeg'])assert.doesNotThrow(()=>validateArtworkFile({...photo,type}));
 assert.throws(()=>validateArtworkFile({...photo,type:'',name:'not-an-image.txt'}),/PNG/);
 assert.throws(()=>validateArtworkFile({...photo,size:0}),/empty/);
 assert.throws(()=>validateArtworkFile({...photo,size:25000001}),/25 MB/);
});
test('decoding releases object URLs on success, failure, excessive dimensions and timeout',async()=>{
 for(const outcome of ['loaded','error','large','timeout']){
  const released=[];const urlApi={createObjectURL:()=> 'blob:fixture',revokeObjectURL:url=>released.push(url)};
  class FakeImage{width=outcome==='large'?10000:3471;height=outcome==='large'?10000:2789;set src(value){if(outcome!=='timeout')queueMicrotask(()=>outcome==='error'?this.onerror?.():this.onload?.());}}
  const promise=readArtworkFile(photo,{ImageClass:FakeImage,urlApi,timeoutMs:10});
  if(outcome==='loaded')assert.equal((await promise).width,3471);else await assert.rejects(promise,/could not|40 megapixels|timed out/);
  assert.deepEqual(released,['blob:fixture']);
 }
});
