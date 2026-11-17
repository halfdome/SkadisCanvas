// Reference coordinates are in print space. Preserve corner radii and functional
// hole sizes; resize only the spans between the original corner regions.
export const referenceSize={width:200,height:200.0800018310547};
export const referenceFeet=[[12.5,12.540001],[187.5,12.540001],[12.5,187.540001],[187.5,187.540001]];
export function resizeCoordinate(value,original,target){
 return value+(target-original)*Math.max(0,Math.min(1,(value-15)/(original-30)));
}
export function spacerFeet(c){
 const insetX=Math.max(12.5,c.width*12.5/referenceSize.width);
 const insetY=Math.max(12.540001,c.height*12.540001/referenceSize.height);
 return [[insetX,insetY],[c.width-insetX,insetY],[insetX,c.height-insetY],[c.width-insetX,c.height-insetY]];
}
export function spacerSlots(c){
 const feet=spacerFeet(c),result=[];
 // A centered, staggered 40 × 20 mm lattice. Leave complete slots at the edges
 // and clear the legs, including their adjustable outer diameter.
 for(let row=-Math.ceil(c.height/40);row<=Math.ceil(c.height/40);row++){
  const y=c.height/2+row*20;
  if(y<19||y>c.height-19)continue;
  for(let col=-Math.ceil(c.width/40);col<=Math.ceil(c.width/40);col++){
   const x=c.width/2+col*40+(row%2===0?20:0);
   if(x<14||x>c.width-14)continue;
   if(feet.some(([fx,fy])=>Math.hypot(x-fx,Math.max(0,Math.abs(y-fy)-5))<c.spacerDiameter/2+6))continue;
   result.push([x,y]);
  }
 }
 return result;
}
