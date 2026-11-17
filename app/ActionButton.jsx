'use client';
import {Children,useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';

const hints={
  'Print guide':'Open the artwork, export, slicing and assembly instructions.',
  'Use maximum tile size':'Set a flat board to the largest whole-millimeter size that fits after tower and margin allowances. Dimensions need not be multiples of the slot pitch. Spacer boards retain their reference dimensions.',
  'Build plate settings':'Show printer dimensions, edge margins and space reserved for the prime tower.',
  'Reset spacers':'Restore each spacer leg to 10 mm height and 15 mm outer diameter.',
  'Hole pattern':'Show the slot width, slot height and spacing controls for flat boards.',
  'Upload an illustration':'Choose a PNG, JPG, WebP or SVG under 25 MB. Its colors are matched to the selected filament range.',
  'Fill canvas':'Cover the entire wall with artwork; edges may be cropped.',
  'Fit artwork':'Keep the complete image visible; unused areas use the background filament.',
  'Adjust artwork':'Drag the whole-canvas preview to position the image and scroll to zoom, or use Scale to adjust its crop.',
  'Done adjusting':'Finish positioning the artwork and return to tile selection.',
  'Reset crop':'Restore the image to its centered, full-canvas crop at 100% scale.',
  'Match image colors':'Replace the current surface assignments with the nearest filament swatches in the selected range.',
  'Use source colors as custom filaments':'Use the image’s extracted colors directly, replacing named filament matches with custom filaments. Undo restores your previous assignments.',
  'Undo custom filaments':'Restore the surface colors and named filament assignments from before using source colors.',
  'Match dominant surface color':'Use the first surface filament for the backing and keep it linked to automatic color matching.',
  'Import STL dimensions':'Read the width, height and thickness of an STL. This imports dimensions only, not its geometry.',
  'Apply dimensions':'Use the STL’s measured dimensions for the generated flat board.',
  'Save settings as…':'Save a JSON file containing your board, print and filament settings. Artwork is saved separately.',
  'Load settings':'Restore settings from a saved JSON file, then upload its matching artwork separately.',
  'Filament preview':'Show the whole canvas using your selected filament colors.',
  'Extracted colors':'Show the whole canvas using the reduced color palette extracted from the image.',
  'Original':'Show the original image with the current crop and board holes. Scroll over the canvas to zoom the artwork.',
  'Toggle tile grid':'Show or hide boundaries between tiles in the whole-canvas preview.',
  'Cancel':'Stop generating the current export.',
  'Download wall':'Export every tile as a print project. Larger walls are split into rectangular projects in a ZIP.',
  'Export tile':'Show downloads for the selected tile, including its artwork or a blank fit-test board.',
  'Download blank tile':'Download this board without artwork as an STL for checking its shape and accessory fit.',
  'Dismiss message':'Close this notification.',
  'Close ×':'Close the print guide and return to the canvas.'
};
function labelText(children){return Children.toArray(children).map(child=>typeof child==='string'||typeof child==='number'?String(child):child?.props?.children?labelText(child.props.children):'').join('').trim();}
export default function ActionButton({as:Tag='button',hint,children,...props}){
  const label=props['aria-label']||labelText(children);
  const description=hint||hints[label]||(label.startsWith('Upload an illustration')?hints['Upload an illustration']:label.startsWith('Download tile')?'Export only this selected tile, including its 3MF project and separate STL parts.':undefined);
  const ref=useRef(null),id=useId(),[position,setPosition]=useState(null);
  const show=()=>{if(!description)return;const r=ref.current.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(r.left,window.innerWidth-292)),top:Math.max(8,Math.min(r.bottom+8,window.innerHeight-160))});};
  useEffect(()=>{if(!position)return;const close=e=>{if(e.type==='keydown'&&e.key!=='Escape')return;setPosition(null);};window.addEventListener('keydown',close);window.addEventListener('scroll',close,true);return()=>{window.removeEventListener('keydown',close);window.removeEventListener('scroll',close,true);};},[position]);
  return <><Tag {...(Tag==='button'?{type:'button'}:{})} {...props} ref={ref} data-action-hint={description} aria-describedby={position?id:props['aria-describedby']} onMouseEnter={show} onMouseLeave={()=>setPosition(null)} onFocus={show} onBlur={()=>setPosition(null)} onClick={e=>{setPosition(null);props.onClick?.(e);}}>{children}</Tag>{position&&createPortal(<span id={id} role="tooltip" className="help-bubble" style={position}><strong>{label}</strong>{description}</span>,document.body)}</>;
}
