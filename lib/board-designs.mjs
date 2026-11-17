export const FLAT_BOARD='full-flat-board';
export const PICTURE_BOARD='solid-picture-board';
export const isPictureBoard=c=>c.boardDesign===PICTURE_BOARD;
export const pictureMountDefaults={mountHoles:false,mountHoleDiameter:4.5,mountHoleInset:10};
export function pictureMountHoles(c){
 if(!isPictureBoard(c)||!c.mountHoles)return [];
 const inset=c.mountHoleInset??pictureMountDefaults.mountHoleInset;
 return [[inset,inset],[c.width-inset,inset],[inset,c.height-inset],[c.width-inset,c.height-inset]];
}
export const SPACER_BOARD='board-with-spacers';
export const spacerDefaults={width:200,height:200,thickness:5,spacerHeight:10,spacerDiameter:15};
export const hasSpacers=c=>c.boardDesign===SPACER_BOARD;
export const boardDepth=c=>c.thickness+(hasSpacers(c)?c.spacerHeight*1.0002:0);
export function chooseBoardDesign(c,boardDesign){
  if(boardDesign===PICTURE_BOARD)return {...pictureMountDefaults,...c,boardDesign};
  return boardDesign===SPACER_BOARD?{...c,...spacerDefaults,width:Math.max(50,c.width),height:Math.max(50,c.height),boardDesign,backLabel:false,faceDown:true}:{...c,boardDesign};
}
