'use client';
import {useState,useRef,useId,useEffect} from 'react';
import {createPortal} from 'react-dom';

export const explanations={
  Printer:'Choose the printer used for size checks, available filament presets and the exported Bambu Studio project.',
  'Mounting holes':'Add four straight through-holes to every solid picture tile, one near each corner. Off gives a completely unbroken picture surface.',
  'Mounting-hole diameter':'Diameter of each circular through-hole. Choose a size appropriate for your mounting hardware; no countersink is added.',
  'Mounting-hole inset':'Distance from each tile edge to the center of the corner mounting hole. Leave enough material around each hole.',
  'Board style':'Full flat board is the default configurable pegboard. Board with spacers keeps the supplied rounded and beveled style, slot and mounting-hole profiles, with adjustable dimensions and rear clearance. Solid picture board has no hook slots or spacers, with optional mounting holes.',
  Columns:'Number of tiles across the wall. The artwork spans all columns and rows. The wall can contain up to 100 tiles.',
  Rows:'Number of tiles from top to bottom. R01 is the top row in the preview and exported assembly map.',
  'Board width':'Width of one tile, in millimeters. Spacer boards move their corner legs and regenerate the slot pattern without stretching the holes.',
  'Board height':'Height of one tile, in millimeters. Spacer boards add or remove rows at the original slot spacing as the height changes.',
  'Board thickness':'Thickness of the flat board, including its colored surface. Rear spacer height is separate.',
  'Tile gap':'Installed space between neighboring tiles. Artwork is placed across the whole wall, including these gaps.',
  'Spacer height':'Distance from the rear of the board to the ends of its four spacers. The reference is 10 mm; choose 2–40 mm.',
  'Spacer diameter':'Outer diameter of each corner spacer. The reference is 15 mm; choose 10–20 mm. The original mounting-hole profiles remain unchanged.',
  'Bed width':'Printer build plate width. This is used with margins to check whether a tile fits.',
  'Bed depth':'Printer build plate depth, from front to back.',
  'Build height':'Maximum printable height, including both the board and any rear spacers.',
  'Edge / brim margin':'Space reserved around the build plate for edge clearance and a possible brim.',
  'Minimum tower clearance':'Minimum total depth reserved for the tower area. Leave at 0 to calculate it from the tower style, colors and layer height, with a sizing buffer and 3 mm separation. Larger values reserve extra space.',
  'Seam alignment':'Shared edge slots follow one wall-wide pattern and can cross tile seams. Inset slots shift that pattern inward. Board dimensions and pitch affect the exact result.',
  'Slot width':'Width of each capsule-shaped pegboard opening. Changing this affects accessory fit.',
  'Slot height':'Overall height of each capsule-shaped opening, including its rounded ends.',
  'Pattern pitch':'Distance between repeated slots in a row. Alternating rows are offset by half this spacing.',
  'Artwork placement':'Fill canvas covers the wall and crops excess artwork. Fit artwork keeps the whole image visible; uncovered areas use the backing color.',
  Scale:'Enlarges or reduces the artwork relative to the wall. This changes the crop, not the physical board dimensions. You can also scroll over the preview in Original or Adjust artwork mode.',
  'Adjust artwork':'Drag the artwork in the wall preview, or use the horizontal and vertical position controls. Finish adjusting to select tiles again.',
  'Horizontal position':'Moves the artwork left or right within its available crop. At an exact fit there may be no horizontal movement.',
  'Vertical position':'Moves the artwork up or down within its available crop. At an exact fit there may be no vertical movement.',
  'Number of surface colors':'Maximum number of colors extracted from the original image, from 1 to 32. Several source colors can share one filament.',
  'Filament range':'Limits automatic color matching to these filament families. All PLA/PETG includes only families supported by the selected printer.',
  'Display color':'Preview color for this filament. A manual change uses a custom color within the selected filament family.',
  'Filament type':'Material family used for this part and its slicer preset. Review material compatibility before combining families.',
  'Filament color':'A named manufacturer swatch. Selecting it changes the preview color and exported filament name.',
  'Print orientation':'Face-down puts the artwork against the plate and prints it first. The spacer design uses face-down so its spacers build upward.',
  'Layer height':'Thickness of one printed layer. The exported first layer and subsequent layers use this same height.',
  'Colored layers':'Number of layers used for the artwork. Color depth equals this number multiplied by layer height. Spacer volumes use the backing filament.',
  'Surface detail':'Physical size of one artwork sample. Smaller values preserve finer detail but increase export time and file size.',
  'Engrave tile ID on the back':'Adds a recessed row/column label to the rear of a generated flat board. This needs enough backing thickness and is unavailable on the spacer board.',
  'Selected tile':'Choose a tile by its installed-wall position. Its close-up and download links appear here; R01/C01 is the top-left tile.',
  'Preview mode':'Filament preview shows matched filament colors; Extracted colors shows the reduced source palette; Original shows the uploaded image.',
  'Tile grid':'Shows or hides the boundaries between tiles in the wall preview.'
};

export default function ParameterHelp({label,text}){
  const [position,setPosition]=useState(null),button=useRef(null),id=useId();
  const show=()=>{const r=button.current.getBoundingClientRect();setPosition({left:Math.max(12,Math.min(r.left,window.innerWidth-292)),top:Math.max(12,Math.min(r.bottom+8,window.innerHeight-150))});};
  useEffect(()=>{if(!position)return;const close=e=>{if(e.type==='keydown'&&e.key!=='Escape')return;if(e.target===button.current&&e.type==='pointerdown')return;setPosition(null);};window.addEventListener('keydown',close);window.addEventListener('pointerdown',close);return()=>{window.removeEventListener('keydown',close);window.removeEventListener('pointerdown',close);};},[position]);
  return <span className="parameter-help" onMouseEnter={show} onMouseLeave={()=>setPosition(null)}><button ref={button} type="button" className="help-dot" aria-label={`About ${label}`} aria-describedby={position?id:undefined} onFocus={show} onBlur={()=>setPosition(null)} onClick={e=>{e.preventDefault();e.stopPropagation();show();}}>i</button>{position&&createPortal(<span id={id} role="tooltip" className="help-bubble" style={position}><strong>{label}</strong>{text||explanations[label]}</span>,document.body)}</span>;
}
