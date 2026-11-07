// Verified against Bambu's published specifications and BambuStudio profiles, 2026-11-06.
export const printers={
  x1c:{name:'Bambu X1C',width:256,depth:256,height:256,excludeLeft:18,source:'https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20X1%20Carbon%200.4%20nozzle.json'},
  h3c:{name:'Bambu H3C',width:330,depth:320,height:325,excludeLeft:0,source:'https://raw.githubusercontent.com/bambulab/BambuStudio/master/resources/profiles/BBL/machine/Bambu%20Lab%20H3C%200.4%20nozzle.json'},
  custom:{name:'Custom printer',width:256,depth:256,height:256,excludeLeft:0}
};
export function printerLimits(c){
  const key=c.printer||'custom',base=printers[key];if(!base)throw Error('Choose a valid printer.');
  const p=key==='custom'?{...base,width:c.bedWidth??256,depth:c.bedDepth??256,height:c.bedHeight??256}:base;
  const margin=c.bedMargin??5,reserve=c.towerReserve??40;
  for(const [label,v]of Object.entries({bedWidth:p.width,bedDepth:p.depth,bedHeight:p.height,bedMargin:margin,towerReserve:reserve}))if(!Number.isFinite(v)||v<0)throw Error(`Invalid ${label}.`);
  if(p.width<40||p.depth<40||p.height<1||p.width>1000||p.depth>1000||p.height>1000||margin>50||reserve>150)throw Error('Check printer dimensions and clearance.');
  // Conservative rectangle to the right of X1C's front-left 18 × 28 mm exclusion.
  return {...p,usableWidth:p.width-p.excludeLeft-2*margin,usableDepth:p.depth-2*margin-reserve,margin,reserve};
}
export function validatePrinter(c){if(!c.printer)return;const p=printerLimits(c);if(c.width>p.usableWidth||c.height>p.usableDepth||c.thickness>p.height)throw Error(`${p.name}: board exceeds the configured ${p.usableWidth} × ${p.usableDepth} × ${p.height} mm allowance. Reduce board size or adjust clearances.`);}
