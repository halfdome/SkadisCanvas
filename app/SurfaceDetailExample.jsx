// Sample the same artwork at both resolutions so the comparison changes only cell size.
function sampleColor(x,y){
 if((x-7.4)**2+(y-1.3)**2<0.45**2)return '#a4533b';
 return (x-4.5)**2+(y-4.3)**2<3.2**2?'#304f4a':'#f0e5cf';
}
function DetailCrop({size,x,label}){
 const columns=Math.round(10/size),rows=Math.round(8/size),cell=12*size;
 return <g transform={`translate(${x} 28)`}>
  <text x="60" y="-10" textAnchor="middle" fontSize="13" fontWeight="600" fill="#263a35">{label}</text>
  <g shapeRendering="crispEdges">{Array.from({length:columns*rows},(_,i)=>{
   const col=i%columns,row=Math.floor(i/columns);
   return <rect key={i} x={col*cell} y={row*cell} width={cell} height={cell} fill={sampleColor((col+0.5)*size,(row+0.5)*size)}/>;
  })}</g>
  <rect width="120" height="96" fill="none" stroke="#a4b2a2"/>
  <text x="60" y="116" textAnchor="middle" fontSize="11" fill="#59665f">{size===2?'Larger steps · dot lost':'Finer edge · dot retained'}</text>
 </g>;
}
export default function SurfaceDetailExample(){
 return <figure className="surface-detail-example">
  <strong>Surface detail, up close</strong>
  <svg viewBox="0 0 280 150" role="img" aria-label="The same 10 by 8 millimeter artwork at two settings: 2 millimeters per pixel creates a blocky circular edge and loses a small dot; 0.4 millimeters per pixel creates a finer edge and retains the dot.">
   <DetailCrop size={2} x={8} label="2 mm / pixel"/>
   <DetailCrop size={0.4} x={152} label="0.4 mm / pixel"/>
  </svg>
  <figcaption>Same 10 × 8 mm area, enlarged.<br/>Smaller cells preserve more detail.</figcaption>
 </figure>;
}
