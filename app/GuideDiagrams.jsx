import {useId} from 'react';
import SeamDiagram from './SeamDiagram.jsx';

export function PlateSpaceDiagram(){return <figure>
 <svg viewBox="0 0 320 250" role="img" aria-label="Top view: the tile and orange tower reserve sit within edge margins. Tower reserve includes clearance, not just the gap to the tile.">
  <rect x="28" y="15" width="264" height="210" rx="8" fill="#fff" stroke="#839b89"/>
  <rect x="44" y="31" width="232" height="178" fill="#eef3e9" stroke="#839b89" strokeDasharray="4 4"/>
  <rect x="64" y="43" width="192" height="29" rx="3" fill="#df9360"/>
  <text x="160" y="62" textAnchor="middle" fontSize="12">Tower + clearance reserve</text>
  <rect x="64" y="89" width="192" height="104" rx="4" fill="#c5d8cb"/>
  <text x="160" y="147" textAnchor="middle" fontSize="16">Tile</text>
  <path d="M28 235H44m-16-4v8m16-8v8" stroke="#a4533b"/>
  <text x="53" y="240" fontSize="12">Edge / brim margin</text>
 </svg><figcaption>Top view · schematic. Reserved space reduces the usable tile area.</figcaption>
 </figure>;}

export function WallDimensionsDiagram({config:c}){
 const width=c.cols*c.width+(c.cols-1)*c.gap,height=c.rows*c.height+(c.rows-1)*c.gap;
 return <figure><svg viewBox="0 0 320 220" role="img" aria-label="Columns run across; rows run down. Total wall size includes a gap between tiles, not at the outside edges.">
  {[0,1].flatMap(r=>[0,1,2].map(col=><rect key={`${r}-${col}`} x={48+col*80} y={38+r*68} width="70" height="58" rx="4" fill="#dce7de" stroke="#94a795"/>))}
  <path d="M48 22H278m-5-4 5 4-5 4M30 38V164m-4-5 4 5 4-5" stroke="#304f4a" fill="none"/>
  <text x="163" y="13" textAnchor="middle" fontSize="12">Columns →</text>
  <text transform="translate(18 103) rotate(-90)" textAnchor="middle" fontSize="12">Rows ↓</text>
  <path d="M118 175V190m10-15v15m-10-7h10" stroke="#c9834b"/>
  <text x="140" y="188" fontSize="12">Tile gap</text>
 </svg><figcaption>Current wall: <strong>{width.toLocaleString()} × {height.toLocaleString()} mm</strong><br/>{c.cols} columns × {c.rows} rows · {c.gap} mm gaps</figcaption></figure>;
}

export function MountingDiagram(){return <figure><svg viewBox="0 0 320 300" role="img" aria-label="Spacer side view: height is rear clearance, diameter is the outer width of a leg. Mounting-hole front view: inset runs from either tile edge to the hole center, and hole diameter is the opening width.">
 <text x="12" y="19" fontSize="13" fontWeight="600">Spacer · side view</text>
 <rect x="30" y="100" width="180" height="16" fill="#dce7de" stroke="#839b89"/>
 <rect x="55" y="48" width="48" height="52" fill="#c5d8cb" stroke="#839b89"/>
 <path d="M64 48V100h30V48" fill="#fff" stroke="#839b89"/>
 <path d="M55 36H103m-48-4v8m48-8v8M123 48V100m-4-52h8m-8 52h8" stroke="#a4533b"/>
 <text x="79" y="29" textAnchor="middle" fontSize="12">Outer Ø</text>
 <text x="136" y="71" fontSize="12">Height</text><text x="136" y="88" fontSize="11">Rear clearance</text>
 <text x="12" y="154" fontSize="13" fontWeight="600">Mounting hole · front view</text>
 <rect x="30" y="176" width="180" height="102" fill="#dce7de" stroke="#839b89"/>
 <circle cx="84" cy="222" r="17" fill="#fff" stroke="#839b89"/>
 <path d="M30 222H84V176M67 245H101m-34-4v8m34-8v8" fill="none" stroke="#a4533b" strokeDasharray="3 2"/>
 <text x="42" y="210" fontSize="11">Inset</text><text x="94" y="199" fontSize="11">Inset</text>
 <text x="115" y="249" fontSize="12">Hole Ø</text>
 </svg><figcaption>Leg diameter and mounting-hole diameter are different measurements.</figcaption></figure>;}

export function SlotDiagram(){return <figure><svg viewBox="0 0 320 220" role="img" aria-label="Slot width measures across a capsule opening; slot height includes its rounded ends. Pattern pitch measures center to center within a row; the next row is staggered by half a pitch.">
 <rect x="14" y="12" width="292" height="196" rx="7" fill="#dce7de"/>
 {[70,210].map(x=><rect key={x} x={x-9} y="60" width="18" height="50" rx="9" fill="#fff" stroke="#839b89"/>)}
 <rect x="131" y="139" width="18" height="50" rx="9" fill="#fff" stroke="#839b89"/>
 <path d="M70 38H210m-140-4v8m140-8v8M45 60V110m-4-50h8m-8 50h8M61 122H79m-18-4v8m18-8v8" stroke="#a4533b"/>
 <text x="140" y="30" textAnchor="middle" fontSize="12">Pattern pitch</text>
 <text transform="translate(34 85) rotate(-90)" textAnchor="middle" fontSize="11">Height</text>
 <text x="70" y="141" textAnchor="middle" fontSize="11">Width</text>
 <path d="M70 175H128" stroke="#a4533b" strokeDasharray="3 2"/>
 <text x="198" y="170" fontSize="11">Next row:</text><text x="198" y="187" fontSize="11">½ pitch offset</text>
 </svg><figcaption>Slot dimensions affect accessory fit. Test with the actual hook.</figcaption></figure>;}

export function SeamComparison(){return <div className="guide-example-pair">{[true,false].map(shared=><figure key={String(shared)}><strong>{shared?'Shared edge slots':'Inset slots'}</strong><SeamDiagram shared={shared}/><figcaption>{shared?'Two tiles complete a slot.':'Pattern moves inward; edge results depend on size.'}</figcaption></figure>)}</div>;}

export function CropComparison(){const id=useId();return <figure><svg viewBox="0 0 320 290" role="img" aria-label="The same square artwork on a wide wall: Fill canvas crops its top and bottom; Fit artwork shows the full square with backing-colored areas on both sides.">
 <defs><g id={`${id}-art`}><rect width="100" height="100" fill="#f0e5cf"/><circle cx="70" cy="26" r="15" fill="#e6a041"/><path d="M0 65Q25 25 60 67T100 57V100H0Z" fill="#304f4a"/><path d="M0 88Q35 65 70 90T100 80V100H0Z" fill="#a4533b"/></g><clipPath id={`${id}-crop`}><rect x="50" y="35" width="220" height="90"/></clipPath></defs>
 <text x="160" y="23" textAnchor="middle" fontSize="14" fontWeight="600">Fill canvas</text>
 <g clipPath={`url(#${id}-crop)`}><use href={`#${id}-art`} transform="translate(50 -30) scale(2.2)"/></g><rect x="50" y="35" width="220" height="90" fill="none" stroke="#839b89"/>
 <text x="160" y="146" textAnchor="middle" fontSize="12">Crops the top and bottom</text>
 <text x="160" y="178" textAnchor="middle" fontSize="14" fontWeight="600">Fit artwork</text>
 <rect x="50" y="190" width="220" height="90" fill="#fff" stroke="#839b89"/><use href={`#${id}-art`} transform="translate(115 190) scale(.9)"/>
 </svg><figcaption>Same artwork · same wall proportions · 100% scale.<br/>White side areas use the backing/background filament.</figcaption></figure>;}

export function OrientationDiagram(){return <figure><svg viewBox="0 0 320 180" role="img" aria-label="Face-down prints the colored artwork first against the plate. Face-up prints the backing first and artwork last.">
 {[true,false].map((down,i)=><g key={i} transform={`translate(0 ${i*90})`}><text x="12" y="18" fontSize="13" fontWeight="600">{down?'Face-down · color first':'Face-up · color last'}</text><rect x="16" y="29" width="230" height="39" rx="3" fill="#e0e5da" stroke="#839b89"/><rect x="17" y={down?57:30} width="228" height="10" fill="#e6a041"/><path d="M8 73H254" stroke="#7f8979" strokeWidth="3"/><text x="263" y="77" fontSize="10">Plate</text></g>)}
 </svg><figcaption>Orange = artwork layers. Export already applies the orientation.</figcaption></figure>;}
