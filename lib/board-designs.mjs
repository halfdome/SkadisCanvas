export const FLAT_BOARD='full-flat-board';
export const SPACER_BOARD='board-with-spacers';
export const spacerDefaults={width:200,height:200.0800018310547,thickness:5,spacerHeight:10,spacerDiameter:15};
export const hasSpacers=c=>c.boardDesign===SPACER_BOARD;
export const boardDepth=c=>c.thickness+(hasSpacers(c)?c.spacerHeight*1.0002:0);
export function chooseBoardDesign(c,boardDesign){
  return boardDesign===SPACER_BOARD?{...c,...spacerDefaults,boardDesign,backLabel:false,faceDown:true}:{...c,boardDesign,width:200,height:200,thickness:5};
}
