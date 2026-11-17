import {hasSpacers,isPictureBoard} from '../lib/board-designs.mjs';

export default function BoardStylePreview({config:c}) {
  const picture=isPictureBoard(c),spacers=hasSpacers(c),height=Math.max(8,Math.min(48,(Number(c.spacerHeight)||10)*2));
  const radius=Math.max(5,Math.min(14,(Number(c.spacerDiameter)||15)*.65));
  const project=([x,y])=>[110+.85*x-.5*y,65+.24*x+.39*y];
  const corners=[[18,18],[142,18],[18,142],[142,142]].map(project).sort((a,b)=>a[1]-b[1]);
  return <figure className="board-style-preview">
    <svg viewBox="0 0 290 186" role="img" aria-label={spacers?`Board with four hollow rear spacers, ${c.spacerHeight} mm high and ${c.spacerDiameter} mm in diameter. Rear view schematic.`:picture?`Solid picture board with ${c.mountHoles?'four mounting holes':'no holes'} and no spacers. Rear view schematic.`:'Full flat board with a flat back and no spacers. Rear view schematic.'}>
      <path d="M30 134L167 173L249 108L112 68Z" fill="#263a3510"/>
      <g transform="matrix(.85 .24 -.5 .39 110 65)">
        <path d="M0 0H160V160H0Z" transform="translate(0 9)" fill="#829888"/>
        <rect width="160" height="160" rx="6" fill="#dce7de" stroke="#7a9183" strokeWidth="1.5"/>
        {!picture&&[32,64,96,128].flatMap((x,col)=>[30,64,98,132].map((y,row)=><rect key={`${col}-${row}`} x={x-3.5} y={y-9+(col%2?8:0)} width="7" height="18" rx="3.5" fill="#f7f8f3" stroke="#a2b2a5" strokeWidth="1"/>))}
        {picture&&c.mountHoles&&[[12,12],[148,12],[12,148],[148,148]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill="#f7f8f3" stroke="#a2b2a5"/>)}
      </g>
      {spacers&&corners.map(([x,y],i)=><g key={i}>
        <path d={`M${x-radius} ${y-height}V${y}a${radius} ${radius*.4} 0 0 0 ${radius*2} 0V${y-height}Z`} fill="#b4c9b9" stroke="#708b79"/>
        <ellipse cx={x} cy={y-height} rx={radius} ry={radius*.4} fill="#e9f0e7" stroke="#708b79"/>
        <ellipse cx={x} cy={y-height} rx="2.8" ry="1.7" fill="#617d6b"/>
      </g>)}
      <text x="145" y="181" textAnchor="middle" fill="#59655e" fontSize="11">Rear view · schematic</text>
    </svg>
    <figcaption>{spacers?<>Four rear spacers · <strong>{c.spacerHeight} mm</strong> high · <strong>Ø{c.spacerDiameter} mm</strong> per leg</>:picture?`Solid picture tile · ${c.mountHoles?'four mounting holes':'no holes'} · no spacers`:'Flat back · no spacers'}</figcaption>
  </figure>;
}
