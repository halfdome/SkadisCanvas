import {spacerFeet} from './spacer-layout.mjs';
export const FLAT_BOARD='full-flat-board';
export const PICTURE_BOARD='solid-picture-board';
export const isPictureBoard=c=>c.boardDesign===PICTURE_BOARD;
export const pictureMountDefaults={mountSpacers:false,mountHoles:false,mountHoleDiameter:4.5,mountHoleInset:10};
export function pictureMountHoles(c){
 if(!isPictureBoard(c)||!c.mountHoles)return [];
 if(hasSpacers(c))return spacerFeet(c);
 const inset=c.mountHoleInset??pictureMountDefaults.mountHoleInset;
 return [[inset,inset],[c.width-inset,inset],[inset,c.height-inset],[c.width-inset,c.height-inset]];
}
export const SPACER_BOARD='board-with-spacers';
export const spacerDefaults={width:200,height:200,thickness:5,spacerHeight:10,spacerDiameter:15};
export const hasSpacers=c=>c.boardDesign===SPACER_BOARD||(isPictureBoard(c)&&c.mountSpacers===true);
export const boardDepth=c=>c.thickness+(hasSpacers(c)?c.spacerHeight*1.0002:0);
export function chooseBoardDesign(c,boardDesign){
  if(boardDesign===PICTURE_BOARD){const next={...pictureMountDefaults,...c,boardDesign};return next.mountSpacers?choosePictureSpacers(next,true):next;}
  return boardDesign===SPACER_BOARD?{...c,...spacerDefaults,width:Math.max(50,c.width),height:Math.max(50,c.height),boardDesign,backLabel:false,faceDown:true}:{...c,boardDesign};
}

export function choosePictureSpacers(c,enabled){
 return enabled?{...c,mountSpacers:true,spacerHeight:c.spacerHeight??10,spacerDiameter:c.spacerDiameter??15,thickness:5,width:Math.max(50,c.width),height:Math.max(50,c.height),faceDown:true,backLabel:false}:{...c,mountSpacers:false};
}
