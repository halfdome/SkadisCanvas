export function layerPlan({thickness,layerHeight,colorLayers}){
  if(!(Number.isFinite(thickness)&&thickness>0&&Number.isFinite(layerHeight)&&layerHeight>0))return null;
  const total=Math.ceil(thickness/layerHeight-1e-8);
  const valid=Number.isInteger(colorLayers)&&colorLayers>=1&&colorLayers<=total;
  const full=valid&&colorLayers===total;
  const depth=full?thickness:colorLayers*layerHeight;
  return {total,valid,full,depth,backing:thickness-depth};
}
