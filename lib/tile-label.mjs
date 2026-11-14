// Three-column block lettering with a printable 0.8 mm stroke.
const glyphs={
  R:['110','101','110','101','101'], C:['111','100','100','100','111'],
  '-':['000','000','111','000','000'],
  0:['111','101','101','101','111'],1:['010','110','010','010','111'],
  2:['111','001','111','100','111'],3:['111','001','111','001','111'],
  4:['101','101','111','001','001'],5:['111','100','111','001','111'],
  6:['111','100','111','101','111'],7:['111','001','010','010','010'],
  8:['111','101','111','101','111'],9:['111','101','111','001','111']
};
export const tileName=(col,row)=>`R${String(row+1).padStart(2,'0')}-C${String(col+1).padStart(2,'0')}`;

export function labelLayout(c,col,row,holes){
  const name=tileName(col,row),stroke=.8,margin=1.2,width=(4*name.length-1)*stroke,height=5*stroke;
  const obstacles=holes.map(([x,y])=>[x-c.slotWidth/2-margin,y-c.slotHeight/2-margin,x+c.slotWidth/2+margin,y+c.slotHeight/2+margin]);
  const maxX=c.width-margin-width,maxY=c.height-margin-height;
  const candidates=(axis,size,max,center)=>[center,margin,max,...obstacles.flatMap(b=>[b[axis]-size,b[axis+2]])].filter(v=>v>=margin&&v<=max).sort((a,b)=>Math.abs(a-center)-Math.abs(b-center));
  const xs=candidates(0,width,maxX,(c.width-width)/2),ys=candidates(1,height,maxY,(c.height-height)/2);
  for(const y of ys)for(const x of xs){
    if(obstacles.some(([l,b,r,t])=>x<r-1e-7&&x+width>l+1e-7&&y<t-1e-7&&y+height>b+1e-7))continue;
    const cells=[],join=.06;
    // Mirror in CAD X: the rear is viewed from the opposite side of the tile.
    for(const [i,char] of [...name].entries())glyphs[char].forEach((line,j)=>{
      [...line].forEach((on,k)=>{
        if(on==='1')cells.push([x+(4*name.length-2-4*i-k)*stroke-join,y+(4-j)*stroke-join,stroke+2*join,stroke+2*join]);
      });
    });
    return {name,cells,depth:Math.max(2,Math.ceil(.4/c.layerHeight-1e-8))*c.layerHeight};
  }
  throw Error(`No clear space for the back label on ${name}. Increase the hole pitch or turn off back labels.`);
}
