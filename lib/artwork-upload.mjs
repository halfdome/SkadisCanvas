export const artworkAccept='image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg';
export function takeArtworkFile(input){
 const file=input.files?.[0];
 // A second selection of the same file must fire change, even after a failure.
 input.value='';
 return file;
}
export function validateArtworkFile(file){
 if(!file||!file.size)throw Error('This image file is empty. Choose another copy.');
 if(file.size>25000000)throw Error('Please use an image smaller than 25 MB.');
 const type=(file.type||'').toLowerCase();
 const generic=!type||type==='application/octet-stream';
 if(!/^image\/(png|jpeg|webp|svg\+xml)$/.test(type)&&!(generic&&/\.(png|jpe?g|webp|svg)$/i.test(file.name||'')))
  throw Error('Choose a PNG, JPG, WebP or SVG. For HEIC photos, export a JPEG copy first.');
}
export async function readArtworkFile(file,{ImageClass=globalThis.Image,urlApi=globalThis.URL,timeoutMs=20000}={}){
 validateArtworkFile(file);
 const url=urlApi.createObjectURL(file),image=new ImageClass();
 let timer;
 try{
  await new Promise((resolve,reject)=>{
   timer=setTimeout(()=>reject(Error('Reading this image timed out. Try selecting it again.')),timeoutMs);
   image.onload=resolve;
   image.onerror=()=>reject(Error('This image could not be read. Try exporting a new PNG or JPEG copy.'));
   image.src=url;
  });
  if(!image.width||!image.height)throw Error('This image has no readable dimensions.');
  if(image.width*image.height>40000000)throw Error('Please resize this image below 40 megapixels and try again.');
  return image;
 }finally{clearTimeout(timer);image.onload=null;image.onerror=null;urlApi.revokeObjectURL(url);}
}
