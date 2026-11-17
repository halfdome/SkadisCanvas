'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Grip, X, Maximize2, Minimize2} from 'lucide-react';
import ActionButton from './ActionButton.jsx';
import AdvancedParameters from './AdvancedParameters.jsx';
import ExportTileLocation from './ExportTileLocation.jsx';
import GuideProduction from './GuideProduction.jsx';
import {hasSpacers} from '../lib/board-designs.mjs';
import {isBambu} from '../lib/project3mf.mjs';
import {layerPlan} from '../lib/layers.mjs';
import {clampPopout} from '../lib/popout-position.mjs';

function Step({number,id=number,title,children,visual}){
 return <section className="guide-step" id={`guide-step-${id}`}><div className="guide-step-heading">{number&&<span>{number.toString().padStart(2,'0')}</span>}<h3>{title}</h3></div><div className={`guide-step-content${visual?'':' guide-step-text-only'}`}><div>{children}</div>{visual&&<div className="guide-visual">{visual}</div>}</div></section>;
}
function ArtworkDiagram(){return <figure><svg viewBox="0 0 270 170" role="img" aria-label="Artwork fills a wall of tiles. Drag to position and scroll to zoom."><rect x="10" y="16" width="250" height="140" rx="6" fill="#f0e5cf"/><circle cx="175" cy="62" r="26" fill="#e6a041"/><path d="M10 110Q90 50 160 112T260 96V156H10Z" fill="#304f4a"/><path d="M10 140Q110 110 170 140T260 130V156H10Z" fill="#a4533b"/>{[60,110,160,210].map(x=><path key={x} d={`M${x} 16V156`} stroke="#fff"/>)}{[62,109].map(y=><path key={y} d={`M10 ${y}H260`} stroke="#fff"/>)}<path d="M99 87h35m-7-6 7 6-7 6m-21-12-7 6 7 6m10-23v34m-6-27 6-7 6 7m-12 20 6 7 6-7" stroke="#fff" strokeWidth="2" fill="none"/></svg><figcaption>One image spans the entire wall.</figcaption></figure>;}
function ColorDiagram({config:c}){const source=c.sourcePalette??c.palette;return <figure className="guide-colors"><div><strong>Source</strong><span>→</span><strong>Filament</strong></div>{c.palette.slice(0,4).map((color,i)=><div key={i}><span className="guide-swatch" style={{background:source[i]??color}}/><span>→</span><span className="guide-swatch" style={{background:color}}/></div>)}<figcaption>Review each match in the preview’s right-hand list.</figcaption></figure>;}
function AssemblyDiagram(){return <figure><svg viewBox="0 0 270 170" role="img" aria-label="Assembly from the artwork side: R01-C01 at top left; columns increase right and rows increase down.">{[0,1].flatMap(row=>[0,1,2].map(col=><g key={`${row}-${col}`}><rect x={12+col*83} y={24+row*66} width="77" height="60" rx="4" fill={row?'#304f4a':'#e6a041'}/><text x={50+col*83} y={59+row*66} textAnchor="middle" fontSize="11" fill={row?'#fff':'#263a35'}>R0{row+1}–C0{col+1}</text></g>))}</svg><figcaption>Front view · rows ↓ · columns →</figcaption></figure>;}
function SimpleGuide({config:c}){
 const bambu=isBambu(c);
 return <div className="guide-simple">
  <section className="guide-group" id="guide-configure" aria-labelledby="guide-configure-title">
   <h2 id="guide-configure-title">Configure</h2>
   <p className="guide-summary">Start with these essentials. The default layer and detail settings are a good starting point for your first test.</p>
   <Step number={1} title="Printer"><p>Choose your <strong>Printer model</strong> in Section 01.</p></Step>
   <Step number={2} title="Board dimensions"><p>In Section 02, choose a <strong>Board style</strong>, then set <strong>Columns</strong>, <strong>Rows</strong> and each tile’s <strong>Board width</strong> and <strong>Board height</strong>. Stay within the printer’s usable tile area and check the total wall size.</p></Step>
   <Step number={3} title="Artwork" visual={<ArtworkDiagram/>}><p>In Section 03, <strong>Upload an illustration</strong>. Bold shapes, a few colors and large areas of color work best. Choose <strong>Fill canvas</strong> to fill the wall or <strong>Fit artwork</strong> to keep the whole image visible.</p></Step>
   <Step number={4} title="Color palette" visual={<ColorDiagram config={c}/>}><p>In Section 04, choose a <strong>Filament range</strong> matching your spools, set the <strong>Number of surface colors</strong>, then click <strong>Match image colors</strong>. Check the matched colors in the preview.</p></Step>
   <Step number={5} title="Print layers"><p>In Section 05, check the <strong>{layerPlan(c)?.full?'Background filament':'Single-color backing'}</strong>{layerPlan(c)?.full?'':' filament'}. Use the same material family as the artwork—PLA and PETG do not fuse reliably together. {hasSpacers(c)?'Spacer boards print face-down.':''}</p></Step>
  </section>
  <section className="guide-group" id="guide-test" aria-labelledby="guide-test-title">
   <h2 id="guide-test-title">Test</h2>
   <Step id="test-tile" title="Try one tile first" visual={<ExportTileLocation/>}>
    <p>Click a representative tile in the canvas. In <strong>Selected tile</strong> below the preview, open <strong>Export tile</strong> and choose <strong>Download tile</strong>. Unzip the download.</p>
    <p>{bambu?<>Open its 3MF <strong>as a project in Bambu Studio</strong>.</>:<>Open its 3MF in your slicer and set up your printer and materials.</>} Confirm the printer and filament assignments. Keep the exported orientation and use <strong>{c.layerHeight} mm</strong> for first and subsequent layer heights.</p>
    <p>Follow the <a href="#guide-print" className="guide-inline-link">Print steps below</a> to slice and print this tile. Check its appearance and fit before continuing.</p>
   </Step>
  </section>
  <GuideProduction config={c} Step={Step} AssemblyDiagram={AssemblyDiagram}/>
 </div>;
}
export default function PrintGuide({config:c,colors,onClose}){
 const panel=useRef(null),scroll=useRef(null),closeButton=useRef(null),drag=useRef(null),returnFocus=useRef(null);
 const [position,setPosition]=useState(null),[expanded,setExpanded]=useState(false),[mode,setMode]=useState('simple');
 const constrain=p=>{const r=panel.current.getBoundingClientRect();return clampPopout(p,r.width,r.height,window.innerWidth,window.innerHeight);};
 useLayoutEffect(()=>{if(!expanded)setPosition(p=>p?constrain(p):p);},[expanded,mode]);
 const toggleExpanded=()=>{drag.current=null;setExpanded(value=>!value);};
 useEffect(()=>{
  returnFocus.current=document.activeElement;closeButton.current?.focus();
  return()=>{if(panel.current?.contains(document.activeElement)||document.activeElement===document.body)returnFocus.current?.focus();};
 },[]);
 useEffect(()=>{
  if(expanded)return;
  const resize=()=>setPosition(p=>p?constrain(p):p);
  window.addEventListener('resize',resize);
  return()=>window.removeEventListener('resize',resize);
 },[expanded]);
 const move=e=>{if(!drag.current||e.pointerId!==drag.current.id)return;setPosition(constrain({x:drag.current.x+e.clientX-drag.current.clientX,y:drag.current.y+e.clientY-drag.current.clientY}));};
 const start=e=>{if(expanded||e.button!==0)return;const r=panel.current.getBoundingClientRect();drag.current={id:e.pointerId,x:r.left,y:r.top,clientX:e.clientX,clientY:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();};
 const stop=()=>{drag.current=null;};
 const keys=e=>{if(expanded)return;const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!direction)return;e.preventDefault();const r=panel.current.getBoundingClientRect(),step=e.shiftKey?40:10;setPosition(constrain({x:r.left+direction[0]*step,y:r.top+direction[1]*step}));};
 const layers=layerPlan(c),bambu=isBambu(c),spacers=hasSpacers(c);
 return createPortal(<section ref={panel} className={`print-guide-popout${expanded?' is-expanded':''}`} role="dialog" aria-modal="false" aria-labelledby="print-guide-title" style={!expanded&&position?{left:position.x,top:position.y,right:'auto'}:undefined} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}}}>
  <div className="guide-popout-header"><button className="guide-drag-handle" aria-label="Move print guide" disabled={expanded} title={expanded?'Restore the guide to move it.':'Drag to move. Use arrow keys when focused; Shift moves faster.'} onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onKeyDown={keys}><Grip size={19}/><span><span id="print-guide-title">Print guide</span><small>{expanded?'Expanded reading view':'Drag to move · keep designing alongside'}</small></span></button><ActionButton className="guide-header-button" aria-label={expanded?'Restore print guide':'Expand print guide'} aria-pressed={expanded} hint={expanded?'Return to the floating guide.':'Expand the guide to fill the browser window.'} onClick={toggleExpanded}>{expanded?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</ActionButton><button ref={closeButton} className="guide-header-button" aria-label="Close print guide" title="Close print guide (Esc)" onClick={onClose}><X size={20}/></button></div>
  <div className="guide-mode-bar" role="group" aria-label="Guide detail level">
   <ActionButton className="guide-mode-button" aria-pressed={mode==='simple'} hint="Show the essential steps for your first print." onClick={()=>{setMode('simple');scroll.current?.scrollTo({top:0});}}>Simple</ActionButton>
   <ActionButton className="guide-mode-button" aria-pressed={mode==='advanced'} hint="Show all settings, explanations and visual examples." onClick={()=>{setMode('advanced');scroll.current?.scrollTo({top:0});}}>Advanced</ActionButton>
  </div>
  <div ref={scroll} className="guide-scroll" tabIndex={0} aria-label="Print guide steps">
   <div className="guide-reading-content">
   <p className="guide-intro"><strong>Follow the workflow below, step by step.</strong></p>
   <nav className="guide-stage-nav" aria-label="Workflow stages">{['Configure','Test','Print','Assemble'].map(label=><a key={label} href={`#guide-${label.toLowerCase()}`} title={`Jump to ${label.toLowerCase()}`}>{label}</a>)}</nav>
   {mode==='simple'?<SimpleGuide config={c}/>:<div className="guide-advanced">
   <AdvancedParameters config={c} colors={colors} Step={Step} ColorDiagram={ColorDiagram}/>
   <section className="guide-group" id="guide-test" aria-labelledby="guide-test-title">
   <h2 id="guide-test-title">Test</h2>
   <Step id="test-tile" title="Print and check one tile" visual={<ExportTileLocation/>}>
    <p>Choose a tile with representative colors and fine details. In <strong>Selected tile</strong> below the canvas, open <strong>Export tile</strong> and choose <strong>Download tile</strong>; the ZIP includes its 3MF and separate STL parts. For a mounting or board-fit check without artwork, use <strong>Download blank tile</strong>.</p>
    <p>{bambu?<>Open the 3MF <strong>as a project in Bambu Studio</strong>. Confirm the printer, 0.4 mm nozzle profile, build plate and filament presets; map them to your loaded spools before printing.</>:<>Open the 3MF in your slicer, select your printer and assign the filament for each part.</>} If using STLs, import all parts together as <strong>one multipart object</strong>; keep their relative positions.</p>
    <p>Use the settings from <strong>Print layers (Section 05)</strong>. The exported orientation is already <strong>{c.faceDown?'face-down':'face-up'}</strong>. Do not mirror or flip it again. Set first and subsequent layers to <strong>{c.layerHeight} mm</strong>. {layers?.full?'Artwork colors fill the board thickness.':`The ${c.faceDown?'first':'last'} ${c.colorLayers} layers contain the artwork.`}{spacers?' Rear legs use the backing filament.':''}</p>
    <p>Slice and inspect the plate layout and colored layers: no overlap with the tower, every color in its intended region, and {spacers?'four connected rear legs':'a continuous backing where configured'}. Check thin details and slicer warnings, then print this tile. Inspect its colors, surface detail, strength and mounting fit. Adjust the configuration and repeat the test if needed.</p>
    <div className="guide-comparison-table"><table><caption>Use the test tile to choose the next adjustment</caption><thead><tr><th>What you notice</th><th>What to check</th></tr></thead><tbody>
     <tr><th>Wrong color regions</th><td>Compare Original, Extracted colors and Filament preview. Review source assignments in Section 04, then the slicer’s spool mapping.</td></tr>
     <tr><th>Small details disappear</th><td>Try a smaller Surface detail value in Section 05 within the export limits. Check the sliced paths; simplify or enlarge features that still disappear.</td></tr>
     <tr><th>Hooks or screws do not fit</th><td>Recheck Slot width/height or Mounting-hole dimensions in Section 02 with the actual accessory. Export a blank fit-test tile before repeating the artwork print.</td></tr>
     <tr><th>Artwork breaks at seams</th><td>Check installed Tile gap in Section 02 and crop positioning in Section 03. Keep the same gap when assembling.</td></tr>
     <tr><th>Tile or tower does not fit</th><td>Check the actual sliced footprint, brim and printer profile. Reduce tile size or revise tower/clearance choices in Section 01.</td></tr>
    </tbody></table></div>
   </Step>
   </section>
   <GuideProduction config={c} advanced Step={Step} AssemblyDiagram={AssemblyDiagram}/>
   </div>}
   </div>
  </div>
 </section>,document.body);
}
