// Both views sample one centered 16 mm circle in the same 20 mm square.
function DetailCrop({size,x,label}){
 const count=Math.round(20/size),cell=6*size;
 return <g transform={`translate(${x} 28)`}>
  <text x="60" y="-10" textAnchor="middle" fontSize="13" fontWeight="600" fill="#263a35">{label}</text>
  <rect width="120" height="120" fill="#f0e5cf"/>
  <g shapeRendering="crispEdges">{Array.from({length:count},(_,row)=>{
   const filled=Array.from({length:count},(_,col)=>col).filter(col=>((col+0.5)*size-10)**2+((row+0.5)*size-10)**2<8**2);
   return filled.length?<rect key={row} x={filled[0]*cell} y={row*cell} width={filled.length*cell} height={cell} fill="#304f4a"/>:null;
  })}</g>
  <rect width="120" height="120" fill="none" stroke="#a4b2a2"/>
  <text x="60" y="140" textAnchor="middle" fontSize="11" fill="#59665f">{size===2?'Coarser edge':'Finer edge'}</text>
 </g>;
}
export default function SurfaceDetailExample(){
 return <figure className="surface-detail-example">
  <strong>Surface detail, up close</strong>
  <svg viewBox="0 0 280 174" role="img" aria-label="The same centered 16 millimeter circle in a 20 by 20 millimeter area: 2 millimeters per pixel makes a coarser stepped edge; 0.4 millimeters per pixel makes a finer stepped edge. Both circles have the same size and position.">
   <DetailCrop size={2} x={8} label="2 mm / pixel"/>
   <DetailCrop size={0.4} x={152} label="0.4 mm / pixel"/>
  </svg>
  <figcaption>Same circle · same 20 × 20 mm area, enlarged.<br/>Only the cell size changes.</figcaption>
 </figure>;
}
