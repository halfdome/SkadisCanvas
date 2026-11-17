'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Grip, X, Maximize2} from 'lucide-react';
import ActionButton from './ActionButton.jsx';
import BoardStylePreview from './BoardStylePreview.jsx';
import PrintCrossSection from './PrintCrossSection.jsx';
import {hasSpacers,isPictureBoard} from '../lib/board-designs.mjs';
import {isBambu} from '../lib/project3mf.mjs';
import {layerPlan} from '../lib/layers.mjs';
import {clampPopout} from '../lib/popout-position.mjs';

function Step({number,title,children,visual}){
 return <section className="guide-step" id={`guide-step-${number}`}><div className="guide-step-heading"><span>{number.toString().padStart(2,'0')}</span><h3>{title}</h3></div><div className="guide-step-content"><div>{children}</div><div className="guide-visual">{visual}</div></div></section>;
}
function ArtworkDiagram(){return <figure><svg viewBox="0 0 270 170" role="img" aria-label="Artwork fills a wall of tiles. Drag to position and scroll to zoom."><rect x="10" y="16" width="250" height="140" rx="6" fill="#f0e5cf"/><circle cx="175" cy="62" r="26" fill="#e6a041"/><path d="M10 110Q90 50 160 112T260 96V156H10Z" fill="#304f4a"/><path d="M10 140Q110 110 170 140T260 130V156H10Z" fill="#a4533b"/>{[60,110,160,210].map(x=><path key={x} d={`M${x} 16V156`} stroke="#fff"/>)}{[62,109].map(y=><path key={y} d={`M10 ${y}H260`} stroke="#fff"/>)}<path d="M99 87h35m-7-6 7 6-7 6m-21-12-7 6 7 6m10-23v34m-6-27 6-7 6 7m-12 20 6 7 6-7" stroke="#fff" strokeWidth="2" fill="none"/></svg><figcaption>One image spans the entire wall.</figcaption></figure>;}
function ColorDiagram({config:c}){const source=c.sourcePalette??c.palette;return <figure className="guide-colors"><div><strong>Source</strong><span>→</span><strong>Filament</strong></div>{c.palette.slice(0,4).map((color,i)=><div key={i}><span className="guide-swatch" style={{background:source[i]??color}}/><span>→</span><span className="guide-swatch" style={{background:color}}/></div>)}<figcaption>Review each match in the preview’s right-hand list.</figcaption></figure>;}
function ExportDiagram({bambu}){return <figure><svg viewBox="0 0 270 160" role="img" aria-label={bambu?'One tile on each print plate, with a reserved prime tower area.':'Import the colored parts together as one object.'}><rect x="18" y="15" width="234" height="130" rx="9" fill="#fff" stroke="#a8b7aa"/><rect x="63" y="27" width="144" height="16" rx="2" fill="#df9360"/><text x="135" y="39" textAnchor="middle" fontSize="10" fill="#263a35">Prime tower reserve</text><rect x="68" y="57" width="134" height="74" rx="4" fill="#dce7de"/><text x="135" y="99" textAnchor="middle" fill="#304f4a">R01–C01</text></svg><figcaption>{bambu?'One tile per plate · schematic':'Example placement · arrange in your slicer'}</figcaption></figure>;}
function AssemblyDiagram(){return <figure><svg viewBox="0 0 270 170" role="img" aria-label="Assembly from the artwork side: R01-C01 at top left; columns increase right and rows increase down.">{[0,1].flatMap(row=>[0,1,2].map(col=><g key={`${row}-${col}`}><rect x={12+col*83} y={24+row*66} width="77" height="60" rx="4" fill={row?'#304f4a':'#e6a041'}/><text x={50+col*83} y={59+row*66} textAnchor="middle" fontSize="11" fill={row?'#fff':'#263a35'}>R0{row+1}–C0{col+1}</text></g>))}</svg><figcaption>Front view · rows ↓ · columns →</figcaption></figure>;}
export default function PrintGuide({config:c,colors,onClose}){
 const panel=useRef(null),closeButton=useRef(null),drag=useRef(null),returnFocus=useRef(null);
 const [position,setPosition]=useState(null);
 const constrain=p=>{const r=panel.current.getBoundingClientRect();return clampPopout(p,r.width,r.height,window.innerWidth,window.innerHeight);};
 const reset=()=>{const r=panel.current.getBoundingClientRect();setPosition(constrain({x:window.innerWidth-r.width-24,y:32}));};
 useEffect(()=>{
  returnFocus.current=document.activeElement;closeButton.current?.focus();
  const resize=()=>setPosition(p=>p?constrain(p):p);
  window.addEventListener('resize',resize);
  return()=>{window.removeEventListener('resize',resize);if(panel.current?.contains(document.activeElement)||document.activeElement===document.body)returnFocus.current?.focus();};
 },[]);
 const move=e=>{if(!drag.current||e.pointerId!==drag.current.id)return;setPosition(constrain({x:drag.current.x+e.clientX-drag.current.clientX,y:drag.current.y+e.clientY-drag.current.clientY}));};
 const start=e=>{if(e.button!==0)return;const r=panel.current.getBoundingClientRect();drag.current={id:e.pointerId,x:r.left,y:r.top,clientX:e.clientX,clientY:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();};
 const stop=()=>{drag.current=null;};
 const keys=e=>{const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!direction)return;e.preventDefault();const r=panel.current.getBoundingClientRect(),step=e.shiftKey?40:10;setPosition(constrain({x:r.left+direction[0]*step,y:r.top+direction[1]*step}));};
 const layers=layerPlan(c),bambu=isBambu(c),spacers=hasSpacers(c),picture=isPictureBoard(c);
 return createPortal(<section ref={panel} className="print-guide-popout" role="dialog" aria-modal="false" aria-labelledby="print-guide-title" style={position?{left:position.x,top:position.y,right:'auto'}:undefined} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}}>
  <div className="guide-popout-header"><button className="guide-drag-handle" aria-label="Move print guide" title="Drag to move. Use arrow keys when focused; Shift moves faster." onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={keys}><Grip size={19}/><span><span id="print-guide-title">Print guide</span><small>Drag to move · keep designing alongside</small></span></button><ActionButton className="guide-header-button" aria-label="Reset guide position" hint="Return the print guide to the upper-right corner." onClick={reset}><Maximize2 size={18}/></ActionButton><button ref={closeButton} className="guide-header-button" aria-label="Close print guide" title="Close print guide (Esc)" onClick={onClose}><X size={20}/></button></div>
  <div className="guide-scroll" tabIndex={0} aria-label="Print guide steps">
   <p className="guide-intro">From artwork to a finished wall. These examples follow your current board and print settings.</p>
   <nav className="guide-step-nav" aria-label="Guide steps">{['Board','Artwork','Filaments','Export','Slice','Assemble'].map((label,i)=><a key={label} href={`#guide-step-${i+1}`} title={`Jump to ${label.toLowerCase()} instructions`}>{i+1}. {label}</a>)}</nav>
   <Step number={1} title="Choose the board and printer" visual={<BoardStylePreview config={c}/>}>
    <p>Choose your printer first. Set <strong>Columns</strong> and <strong>Rows</strong> for the whole wall, then the width and height of each tile. Stay within the displayed usable maximum tile area.</p>
    <p><strong>Full flat board</strong> has hook slots. <strong>Board with spacers</strong> adds rear legs. <strong>Solid picture board</strong> has no hook slots; mounting holes and mounting spacers are optional.</p>
    <p>{spacers?`Current legs: ${c.spacerHeight} mm clearance behind the board, Ø${c.spacerDiameter} mm per leg. Spacer boards use a 5 mm body and print face-down.`:'With no spacers, board thickness and print orientation are adjustable.'}{picture&&spacers&&!c.mountHoles?' Mounting holes are off, so the picture face stays closed.':''}</p>
   </Step>
   <Step number={2} title="Upload and position the artwork" visual={<ArtworkDiagram/>}>
    <p>Use <strong>Upload an illustration</strong> for a PNG, JPG, WebP or SVG (up to 25 MB). Choose <strong>Fill canvas</strong> to crop the image or <strong>Fit artwork</strong> to show it all.</p>
    <p>In <strong>Adjust artwork</strong>, drag to position and scroll to zoom. Choose <strong>Done adjusting</strong>, then click a tile to inspect its close-up and export it individually. The top preview always shows the whole canvas.</p>
    <p><strong>Save settings as…</strong> saves the configuration. Keep the artwork separately and upload it again after loading settings.</p>
   </Step>
   <Step number={3} title="Match colors to the spools you own" visual={<ColorDiagram config={c}/>}>
    <p>Set the number of surface colors and a filament range, then use <strong>Match image colors</strong>. Compare source colors and matched filaments on the right of the preview; review the backing filament too.</p>
    <p>Use one compatible material family throughout the tile. Switching automatic matches between PLA and PETG also updates the backing material. PLA and PETG do not fuse reliably together.</p>
    <p><strong>Use source colors as custom filaments</strong> needs matching real spools and slicer presets; it does not mix inks or filaments. <strong>Undo custom filaments</strong> restores the previous assignments.</p>
    <p>Usage estimates update automatically. Wait for <strong>Calculated</strong>; estimates cover model material, excluding purge and the prime tower. Check final totals after slicing.</p>
   </Step>
   <Step number={4} title="Export one tile before the whole wall" visual={<ExportDiagram bambu={bambu}/>}>
    <p>Click a tile, open <strong>Export tile</strong>, then download that tile. The ZIP includes its 3MF and separate STL parts. <strong>Download blank tile</strong> creates an STL for checking the board and mounting fit without artwork.</p>
    <p><strong>Download wall</strong> exports every tile. {bambu?'Bambu projects use one tile per plate. More than 36 tiles are split into rectangular projects in a ZIP with an assembly map.':'Custom-printer exports require manual plate and material setup in your slicer.'}</p>
    <p>For multi-filament Bambu projects, choose Automatic, Standard or Wall-style prime tower. Keep its reserved space clear; the slicer determines the final tower size.</p>
   </Step>
   <Step number={5} title="Open, slice and inspect" visual={<PrintCrossSection config={c} colors={colors}/>}>
    <p>{bambu?<>Open the 3MF <strong>as a project in Bambu Studio</strong>. Confirm the printer, 0.4 mm nozzle profile, build plate and filament presets; map them to your loaded spools before printing.</>:<>Open the 3MF in your slicer, select your printer and assign the filament for each part.</>} If using STLs, import all parts together as <strong>one multipart object</strong>; keep their relative positions.</p>
    <p>The exported orientation is already <strong>{c.faceDown?'face-down':'face-up'}</strong>. Do not mirror or flip it again. Set first and subsequent layers to <strong>{c.layerHeight} mm</strong>. {layers?.full?'Artwork colors fill the board thickness.':`The ${c.faceDown?'first':'last'} ${c.colorLayers} layers contain the artwork.`}{spacers?' Rear legs use the backing filament.':''}</p>
    <p>Slice and inspect the plate layout and colored layers: no overlap with the tower, every color in its intended region, and {spacers?'four connected rear legs':'a continuous backing where configured'}. Check thin details and slicer warnings. Print one tile and check fit and appearance before printing the rest.</p>
   </Step>
   <Step number={6} title="Assemble from the artwork side" visual={<AssemblyDiagram/>}>
    <p><strong>R01</strong> is the top row; <strong>C01</strong> is the left column. Lay out the cooled tiles face-up using the assembly map or tile names. Keep your configured <strong>{c.gap} mm gap</strong> between tiles.</p>
    <p>{spacers?'Rear spacers set the wall clearance. Check mounting hardware against the actual bore and your wall before installation. Back-label engraving is unavailable with spacers.':'Optional back-label engraving marks tile positions when enough backing remains. Mounting hardware and panel connectors are not included.'}</p>
   </Step>
  </div>
 </section>,document.body);
}
