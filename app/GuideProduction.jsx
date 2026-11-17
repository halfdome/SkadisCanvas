import {isBambu} from '../lib/project3mf.mjs';
import {layerPlan} from '../lib/layers.mjs';
import {hasSpacers} from '../lib/board-designs.mjs';

export function SlicerWorkflow(){
 return <figure className="slicer-workflow" aria-label="Bambu Studio workflow: Prepare, Preview, Print plate.">
  <div><span>1</span><strong>Prepare</strong><small>Printer · plate · filaments</small></div>
  <div><span>2</span><strong>Preview</strong><small>Layers · colors · tower clearance</small></div>
  <div><span>3</span><strong>Print plate</strong><small>Printer · spool mapping</small></div>
  <figcaption>Check each plate before sending it.</figcaption>
 </figure>;
}
export default function GuideProduction({config:c,advanced=false,Step,AssemblyDiagram}){
 const bambu=isBambu(c),layers=layerPlan(c);
 return <>
  <section className="guide-group" id="guide-print" aria-labelledby="guide-print-title">
   <h2 id="guide-print-title">Print</h2>
   <Step id="print-wall" title={bambu?'Prepare and print in Bambu Studio':'Prepare and print in your slicer'} visual={bambu?<SlicerWorkflow/>:undefined}>
    <p>Once the test tile looks right, use <strong>Download wall</strong>. Unzip the download if needed and open each project in turn. Use the same checks below for your test tile.</p>
    <ol className="guide-checklist">
     <li><strong>Open the project.</strong> {bambu?<>Use <strong>File → Open Project</strong> for the 3MF so its plates, colors and print settings stay together.</>:<>Open the 3MF and configure your printer and each part’s filament.</>}</li>
     <li><strong>Check the hardware.</strong> {bambu?'Confirm the printer model and 0.4 mm nozzle profile match your machine. ':''}Select the build plate you actually use{bambu?'—the exported project starts with Textured PEI Plate.':'.'}</li>
     <li><strong>Check the filaments.</strong> Match every project filament, including the backing, to your real material and color. Use an appropriate material preset; a display color alone does not set printing temperatures.</li>
     <li><strong>Keep the project’s print settings.</strong> First and subsequent layer heights should both be <strong>{c.layerHeight} mm</strong>. Keep the exported <strong>{c.faceDown?'face-down':'face-up'}</strong> orientation and tile size.{advanced?' If you change a process preset, recheck these values and the solid colored layers.':''}</li>
     <li><strong>Slice and inspect.</strong> {bambu?<>Click <strong>Slice plate</strong>. In <strong>Preview</strong>, select the filament color view and use the layer slider.</>:<>Slice the plate and inspect its layer preview.</>} {layers?.full?'Check artwork colors through the board thickness.':`Check the ${c.faceDown?'first':'last'} ${c.colorLayers} artwork layers.`} Confirm small details remain, the tile and prime tower do not overlap, and both fit inside the printable area. Resolve slicing warnings.</li>
     <li><strong>Send the right plate.</strong> {bambu?<>Click <strong>Print plate</strong>, select the correct printer, and verify each filament’s AMS slot against the loaded spool. Check any extruder or hotend assignments shown.</>:<>Confirm the target printer and loaded materials before sending.</>} Watch the first layer, then repeat for the remaining plates and projects.</li>
    </ol>
    {advanced&&<><p>Check the slicer’s filament totals, including purge and prime-tower material, before committing to the full wall. If you add a brim or change the tower, recheck clearance after slicing.</p><p>Use <strong>Save settings as…</strong> to keep the Canvas configuration. Save the artwork separately. {bambu?'Walls over 36 tiles are split into rectangular projects; use the assembly map to track completed sections.':''}</p></>}
   </Step>
  </section>
  <section className="guide-group" id="guide-assemble" aria-labelledby="guide-assemble-title">
   <h2 id="guide-assemble-title">Assemble</h2>
   <Step id="assemble-wall" title="Lay out the cooled tiles" visual={<AssemblyDiagram/>}>
    <p>Lay the tiles out face-up using the assembly map or tile names. <strong>R01</strong> is the top row; <strong>C01</strong> is the left column. Keep the configured <strong>{c.gap} mm</strong> gap between tiles.</p>
    <p>{hasSpacers(c)?'Rear spacers set the wall clearance. Check the mounting hardware against the actual holes and your wall before installation.':'Check the artwork alignment and mounting fit before fixing the tiles in place.'}</p>
    {advanced&&<p>{hasSpacers(c)?'Back-label engraving is unavailable with spacers.':'Optional back-label engraving helps identify each tile’s position.'} Mounting hardware and panel connectors are not included.</p>}
   </Step>
  </section>
 </>;
}
