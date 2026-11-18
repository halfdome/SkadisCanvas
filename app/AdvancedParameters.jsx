import BoardStylePreview from './BoardStylePreview.jsx';
import PrintCrossSection from './PrintCrossSection.jsx';
import SurfaceDetailExample from './SurfaceDetailExample.jsx';
import {PlateSpaceDiagram,WallDimensionsDiagram,MountingDiagram,SlotDiagram,SeamComparison,CropComparison,OrientationDiagram} from './GuideDiagrams.jsx';
import {layerPlan} from '../lib/layers.mjs';

function Parameters({items}){return <dl className="guide-parameters">{items.map(([name,description])=><div key={name}><dt>{name}</dt><dd>{description}</dd></div>)}</dl>;}
function Topic({title,children,visual}){return <div className={`guide-topic${visual?' has-visual':''}`}><div><h4>{title}</h4>{children}</div>{visual&&<aside className="guide-topic-visual">{visual}</aside>}</div>;}
function Towers(){return <figure><svg viewBox="0 0 320 160" role="img" aria-label="Standard reserves a compact square beside the tile. Wall-style reserves a wide shallow strip behind it. Schematic comparison.">
 {[false,true].map((wall,i)=><g key={i} transform={`translate(${i*160} 0)`}><rect x="9" y="9" width="142" height="115" rx="5" fill="#fff" stroke="#839b89"/>{wall?<><rect x="24" y="22" width="112" height="18" rx="3" fill="#df9360"/><rect x="24" y="51" width="112" height="58" rx="3" fill="#dce7de"/></>:<><rect x="21" y="22" width="41" height="41" rx="3" fill="#df9360"/><rect x="73" y="22" width="65" height="87" rx="3" fill="#dce7de"/></>}<text x="80" y="147" textAnchor="middle" fontSize="13">{wall?'Wall-style':'Standard'}</text></g>)}
 </svg><figcaption>Orange = tower reserve · green = tile. Schematic, not a clearance guarantee.</figcaption></figure>;}

export default function AdvancedParameters({config:c,colors,Step,ColorDiagram}){
 const layers=layerPlan(c),validLayers=layers?.valid;
 return <section className="guide-group" id="guide-configure" aria-labelledby="guide-configure-title">
  <h2 id="guide-configure-title">Configure</h2>
  <nav className="guide-step-nav advanced-section-nav" aria-label="Configuration sections">{['Printer','Board dimensions','Artwork','Color palette','Print layers'].map((name,i)=><a key={name} href={`#guide-step-${i+1}`}>{String(i+1).padStart(2,'0')} {name}</a>)}</nav>
  <Step number={1} title="Printer">
   <Topic title="Choose the machine before sizing the tiles" visual={<PlateSpaceDiagram/>}>
    <Parameters items={[
     ['Printer model','Select the machine you will use. This sets the build-volume limits, compatible filament presets and the exported printer profile. Bambu settings are downloaded on demand from a fixed, tested upstream version and cached in this browser. A new printer or cleared cache needs an internet connection. If loading fails, use Retry printer settings; exports wait until the settings are ready. Changing the printer can rematch the palette and change the initial color count; review Section 04 afterward.'],
     ['Build volume / Usable maximum tile area','Build volume is the machine’s overall limit. Usable maximum tile area is the smaller rectangle left after edge margins, printer exclusion zones and the tower reserve. Size each tile against the usable area, not the overall bed.'],
     ['Use maximum tile size','Applies the displayed usable width and height to every tile. Columns and rows stay the same, so the total wall size changes. Recheck the wall dimensions, crop and seam pattern afterward.']
    ]}/>
   </Topic>
   <Topic title="Choose a prime tower style" visual={<Towers/>}>
    <Parameters items={[
     ['Automatic','Tries Standard first, then Wall-style when needed to fit the layout. Use this as a starting point; the preview identifies the chosen style.'],
     ['Standard','Reserves a compact square tower. Choose it to keep that style in the Bambu project; a large tile may need to shrink to leave room.'],
     ['Wall-style','Reserves a wide, shallow tower behind the tile. It can free depth for a larger tile, but still needs enough room across the plate.'],
     ['One filament','A single-filament project needs no prime tower. A different backing color also counts as a filament. The reserved footprint is an estimate; inspect the actual tower after slicing.']
    ]}/>
   </Topic>
   <Topic title="Open Build plate settings">
    <Parameters items={[
     ['Edge / brim margin','Reserved space at the bed edges, in millimeters; the default is 5 mm. Increasing it reduces usable width and depth. This allowance does not add a brim. If you enable a brim in the slicer, check that it fits.'],
     ['Minimum tower clearance','Minimum total depth to reserve for the tower area—not just the empty gap between tower and tile. Leave 0 for the calculated footprint, sizing buffer and 3 mm separation. Increase it for extra space; entering a smaller value does not override the calculated minimum.'],
     ['Bed width / Bed depth / Build height','Shown for Custom printer. Enter the usable machine dimensions in millimeters: left-to-right, front-to-back, and vertical height. Board thickness plus spacer height must fit the build height. Custom-printer projects need manual plate arrangement and printer setup in your slicer.']
    ]}/>
    <p className="guide-checkpoint"><strong>Before moving on:</strong> confirm the printer, then set the tile size in Section 02. Review the usable area again after changing filaments, layers or tower style.</p>
   </Topic>
  </Step>
  <Step number={2} title="Board dimensions">
   <Topic title="Set the wall grid and each tile’s size" visual={<WallDimensionsDiagram config={c}/> }>
    <Parameters items={[
     ['Columns / Rows','Columns count across the wall; rows count down. These are tile counts, not millimeters. The wall supports up to 100 tiles in total. More tiles add seams and print jobs.'],
     ['Board width / Board height','Dimensions of one tile, in millimeters. Changing them changes every tile and the full wall size. Spacer designs can resize: the legs follow the corners while the original slot and mounting-hole profiles keep their size.'],
     ['Board thickness','Total body thickness, including artwork layers. It is adjustable from 1–20 mm without spacers; spacer styles use a fixed 5 mm body. This value excludes the rear legs.'],
     ['Tile gap','Installed space between adjacent tiles, from 0–20 mm. The artwork spans these gaps; they are not extra strips printed on a tile. Use the intended assembly gap before positioning the image.']
    ]}/>
    <div className="guide-formula">Wall width = columns × tile width + (columns − 1) × gap<br/>Wall height = rows × tile height + (rows − 1) × gap</div>
   </Topic>
   <Topic title="Choose Board style">
    <div className="guide-style-cards">
     {[['full-flat-board','Full flat board','Hook slots and a flat back. Adjust the slot pattern, body thickness and seam alignment.'],['board-with-spacers','Board with spacers','Hook slots plus four rear legs. Preserves the reference outline and hole profiles while allowing a different tile size.'],['solid-picture-board','Solid picture board','No hook slots. Use it for tiled artwork; mounting holes and mounting spacers are independently optional.']].map(([id,name,description])=><figure key={id}><h5>{name}</h5><BoardStylePreview config={{...c,boardDesign:id,mountSpacers:false,mountHoles:false,spacerHeight:10,spacerDiameter:15}}/><figcaption>{description}</figcaption></figure>)}
    </div>
   </Topic>
   <Topic title="Configure mounting holes and rear spacers" visual={<MountingDiagram/>}>
    <Parameters items={[
     ['Mounting spacers','Solid picture board only: adds the same four hollow rear legs as Board with spacers. Enabling them sets a 5 mm body, requires face-down printing and disables back-label engraving.'],
     ['Spacer height','Clearance from the back of the board to the end of each leg. Default 10 mm; adjustable from 2–40 mm. It adds to the body thickness, so a 5 mm board with 10 mm legs is about 15 mm deep overall.'],
     ['Spacer diameter','Outer diameter of each individual leg, not the mounting hole. Default 15 mm; adjustable from 10–20 mm. Changing it does not change the reference bore profile. Reset spacers restores 10 mm height and 15 mm diameter.'],
     ['Mounting holes','Solid picture board only: adds four through-holes per tile. Turn off for an unbroken picture surface. With spacers enabled, the holes follow the reference bore and align with the legs; with holes off, the hollow legs remain closed at the picture face.'],
     ['Mounting-hole diameter','Shown for a solid picture board with holes and no spacers. Sets the opening size, from 2–12 mm; default 4.5 mm. These are straight holes without countersinks. Test the intended hardware.'],
     ['Mounting-hole inset','Distance from both tile edges to a hole’s center; default 10 mm. A larger inset moves holes farther inward. The app requires at least 2 mm of material around the edges and between neighboring holes.']
    ]}/>
   </Topic>
   <Topic title="Align the seams on a Full flat board" visual={<SeamComparison/>}>
    <Parameters items={[
     ['Shared edge slots','Uses one wall-wide pattern. Neighboring tiles can contribute half of a slot at their shared edge. Tile dimensions that are multiples of Pattern pitch give regular shared edges; inspect the result when adding a gap.'],
     ['Inset slots','Shifts the pattern inward. This is not a guarantee that every slot stays clear of every seam: tile size, pitch and gap still affect where slots land.'],
     ['Other board styles','Spacer boards retain their reference pattern and solid picture boards have no hook slots. Their controls do not include Seam alignment or Hole pattern.']
    ]}/>
   </Topic>
   <Topic title="Open Hole pattern" visual={<SlotDiagram/>}>
    <Parameters items={[
     ['Slot width','Opening width, default 5 mm. A wider opening changes hook fit and removes more material.'],
     ['Slot height','Full capsule height including both rounded ends, default 15 mm. It must be at least the slot width and leave clearance to neighboring slots.'],
     ['Pattern pitch','Center-to-center spacing within a row, default 40 mm. Adjacent rows are offset by half a pitch. Reducing it adds more openings; increasing it spaces them farther apart.']
    ]}/>
    <p className="guide-checkpoint"><strong>Fit check:</strong> export a blank tile before committing to a custom hole pattern or mounting dimensions. Changing slot size can make existing accessories fit differently.</p>
   </Topic>
  </Step>
  <Step number={3} title="Artwork">
   <Topic title="Upload and choose how the image fills the wall" visual={<CropComparison/>}>
    <Parameters items={[
     ['Upload an illustration','Accepts PNG, JPG, WebP or SVG up to 25 MB. Bold outlines, few colors and broad connected shapes translate well to filament regions. Fine texture, gradients and tiny isolated features are harder to preserve. Check the loaded filename and preview before proceeding.'],
     ['Fill canvas','At 100% scale, enlarges the artwork enough to cover the wall. If image and wall proportions differ, excess artwork is cropped. Use this when filling the entire wall matters more than keeping every edge of the image.'],
     ['Fit artwork','At 100% scale, shows the whole image. Different proportions leave uncovered areas that use the backing/background filament. Transparent image areas also use that filament.']
    ]}/>
   </Topic>
   <Topic title="Refine the crop without resizing the board">
    <Parameters items={[
     ['Scale','25–400% of the chosen Fill/Fit placement. Raising it zooms into the artwork; lowering it reveals more of the image and can expose background areas. It does not change tile dimensions. Scroll over Original or Adjust artwork to zoom around the pointer.'],
     ['Adjust artwork','Enables dragging on the main preview. Horizontal position and Vertical position appear while adjusting. At an exact fit there may be no movement along that axis.'],
     ['Horizontal position / Vertical position','Range 0–100%, with 50% centered. Dragging and sliders control the same placement; use the preview to judge the crop. These percentages describe alignment within the available space, not millimeters.'],
     ['Reset crop / Done adjusting','Reset crop restores Fill canvas, 100% scale and centered positioning. Done adjusting returns to tile inspection. Uploading another image also resets scale and position, so review its crop.']
    ]}/>
    <div className="guide-comparison-table"><table><caption>Use the preview modes to check each stage</caption><thead><tr><th>Mode</th><th>What to inspect</th></tr></thead><tbody><tr><th>Original</th><td>Image composition, crop and position.</td></tr><tr><th>Extracted colors</th><td>How reducing the image palette changes its regions.</td></tr><tr><th>Filament preview</th><td>The colors assigned to those regions for printing.</td></tr></tbody></table></div>
    <p className="guide-checkpoint"><strong>Inspect the seams:</strong> toggle the tile grid and check whether important faces, lettering or small details fall across a gap.</p>
   </Topic>
  </Step>
  <Step number={4} title="Color palette">
   <Topic title="Choose available filaments, then reduce the image palette" visual={<ColorDiagram config={c}/> }>
    <Parameters items={[
     ['Filament range','First choose the group you actually plan to use, such as PLA Basic + Matte or PETG Basic + HF. All PLA / All PETG searches the families supported by the selected printer; it does not mean those spools are loaded or on hand.'],
     ['Number of surface colors','Maximum number of source colors extracted, from 1–32. Fewer colors simplify the artwork; more can retain distinctions but may require more spools and color changes. The source may contain fewer useful colors than the requested number. This is not the printer’s spool capacity.'],
     ['Match image colors','Finds nearby manufacturer swatches in the chosen range. Several source colors can map to the same filament, so the final filament count can be lower. Changing the range or color count also rematches; it can replace manual choices.']
    ]}/>
    <p>The backing can add another filament beyond the surface colors. Check the final material list against your printer and feeder setup before exporting.</p>
   </Topic>
   <Topic title="Review every source → filament assignment">
    <Parameters items={[
     ['Filament type','Selects the material family and corresponding slicer preset for that region. Keep compatible materials throughout the surface and backing. A color swatch alone cannot establish material compatibility.'],
     ['Filament color','Select a named manufacturer swatch to set the display color and exported filament name. Compare it with the spool you will actually load.'],
     ['Display color','Manual hexadecimal color for the preview. Editing it creates a custom color within the chosen family. It recolors the assigned region; it does not add a new source region or physically mix materials.'],
     ['Use source colors as custom filaments','Replaces matched swatches with the extracted source colors. Use it when supplying your own matching spools, not to manufacture an unavailable color. Custom / other brand exports start from Generic PLA; choose the real material preset in the slicer.'],
     ['Undo custom filaments','Restores the assignments saved before applying source colors. Use it immediately if that change was accidental; rematching, changing a surface assignment, uploading artwork or loading settings clears this undo.']
    ]}/>
   </Topic>
   <Topic title="Read color mapping and usage estimates">
    <Parameters items={[
     ['Source colors → Matched filament','The list beside the canvas pairs the extracted source color with its assigned filament. Source percentages describe the image distribution; they are not grams of printed plastic.'],
     ['Calculating / Calculated','Estimates refresh when artwork, geometry, print layers or filament assignments change. Wait for Calculated before reading the totals. Whole-canvas totals and selected-tile totals cover different scopes.'],
     ['Filaments in this tile','Select a tile to see only its used surface and backing materials, with estimated mass and length. A tile may use fewer colors than the whole canvas.'],
     ['Estimate limits','Model estimates assume the exported infill, walls and shell settings. They exclude purge, prime towers, supports and failed prints. Use the sliced project’s totals for the final spool check.']
    ]}/>
    <p className="guide-checkpoint"><strong>Material check:</strong> choosing PLA or PETG for the artwork switches an incompatible backing to that family. Review Section 05 after manual changes; do not combine PLA and PETG in one board.</p>
   </Topic>
  </Step>
  <Step number={5} title="Print layers">
   <Topic title="Export identification"><p>Every exported tile includes a small rear export code and an enclosed internal pattern, alongside identification metadata in its 3MF. These contain no name or email and are separate from the optional row/column label. Allow at least 1.6 mm body thickness at 0.2 mm layers (2.4 mm at 0.4 mm layers) and clear space between holes. Export will explain if a mark cannot fit. Inspect the sliced rear detail and internal cavities, and test the print’s strength. Identifiers can be removed; they do not prove ownership or prevent copying. See Service terms &amp; export identification below the design controls.</p></Topic>
   <Topic title="Set the printing direction and color depth" visual={<OrientationDiagram/>}>
    <Parameters items={[
     ['Print orientation','Face-down prints the picture against the build plate first. Face-up prints the backing first and the artwork last. Spacers require face-down so the legs build upward. Export applies the orientation; do not mirror or flip the project again.'],
     ['Layer height','Vertical thickness of one printed layer, from 0.08–0.4 mm; default 0.2 mm. Both the first layer and later layers must match this value in the slicer. Choose a value supported by your nozzle/material profile. Smaller layers require more layers for the same height.'],
     ['Colored layers','Artwork depth is Colored layers × Layer height, capped at the board thickness. Default 3 × 0.2 mm = 0.6 mm. Increasing it replaces backing depth with artwork colors. The maximum fills the entire board body with artwork colors.'],
     ['Face-up thickness','When a separate backing remains, Board thickness must be an exact multiple of Layer height so the artwork starts at a layer boundary. For example, 5 mm ÷ 0.2 mm = 25 layers.']
    ]}/>
   </Topic>
   <Topic title="Review the current cross-section" visual={validLayers?<PrintCrossSection config={c} colors={colors}/>:undefined}>
    {validLayers?<div className="guide-formula"><strong>Current body: {c.thickness} mm</strong><br/>Artwork: {layers.depth.toFixed(2)} mm · Backing: {Math.max(0,layers.backing).toFixed(2)} mm<br/>{layers.full?'Artwork colors fill the body thickness.':`${c.colorLayers} artwork layers at ${c.layerHeight} mm per layer.`}</div>:<p>Correct the layer settings to see a valid artwork/backing depth.</p>}
    <p>The cross-section follows the selected tile’s filament colors. It shows print order and layer depth, not a prediction of optical opacity. Test the actual filament combination; translucent material is especially sensitive to the backing and thickness.</p>
    <Parameters items={[
     ['Single-color backing / Background filament','Choose its material family, named color or custom display color just as for a surface filament. It fills the body behind the artwork and any uncovered image areas; spacer legs use it too. At full color depth the control is called Background filament because no separate backing body remains.'],
     ['Match dominant surface color','Assigns the first, dominant surface filament to the backing/background. This can avoid adding a separate spool. Check the preview because uncovered artwork areas also change.'],
     ['Engrave tile ID on the back','Adds recessed row/column labels such as R01-C01. Available without spacers and only with enough backing depth. If the app asks for more room, increase Board thickness or reduce Colored layers. Full color depth leaves no backing for the label.']
    ]}/>
   </Topic>
   <Topic title="Balance Surface detail with export size" visual={<SurfaceDetailExample/>}>
    <p>Surface detail is a horizontal artwork cell size in millimeters, not Layer height. Smaller cells preserve finer outlines but create more sampled regions to process. They cannot restore detail missing from the uploaded image or guarantee that the nozzle can print every tiny feature.</p>
    <div className="guide-comparison-table"><table><caption>Example: a 200 × 200 mm tile</caption><thead><tr><th>Surface detail</th><th>Sample grid</th><th>Typical use</th></tr></thead><tbody>{[[4,'50 × 50','Fast composition check'],[2,'100 × 100','Quick draft'],[1,'200 × 200','Intermediate detail'],[0.8,'250 × 250','Finer artwork'],[0.4,'500 × 500','Small features; highest workload']].map(([mm,grid,use])=><tr key={mm}><th>{mm} mm / pixel</th><td>{grid}</td><td>{use}</td></tr>)}</tbody></table></div>
    <p>At 0.4 mm/pixel a 200 mm tile has 25 times as many sample cells as at 2 mm/pixel—not necessarily 25 times the file size or print time. That 250,000-cell tile exceeds the current 160,000-cell export limit. Use a smaller tile or a coarser setting; the whole wall also has a 1,500,000-cell limit.</p>
    <p className="guide-checkpoint"><strong>Refine one tile first:</strong> begin at 2 mm/pixel, then compare a finer setting in the selected-tile preview and sliced layers. If export reports excessive detail, increase mm/pixel or reduce tile size/count.</p>
   </Topic>
   <Topic title="Optional imports and saving your setup">
    <Parameters items={[
     ['Import STL dimensions','Below Section 05, available without spacers. An STL up to 50 MB supplies only its width, height and thickness. Review them, then choose Apply dimensions. The mesh, slots and feet are not imported; the selected board style is generated again.'],
     ['Save settings as…','Saves the current configuration as JSON. Keep the original artwork separately; it is not embedded in this settings file.'],
     ['Load settings','Restores a saved configuration. Upload the matching artwork separately and inspect the crop, colors and printer settings before exporting.']
    ]}/>
   </Topic>
  </Step>
 </section>;
}
