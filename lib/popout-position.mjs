// Keep every edge reachable, including after zoom or viewport resize.
export function clampPopout(position,width,height,viewportWidth,viewportHeight){
 const edge=8;
 return {x:Math.max(edge,Math.min(position.x,viewportWidth-width-edge)),y:Math.max(edge,Math.min(position.y,viewportHeight-height-edge))};
}
