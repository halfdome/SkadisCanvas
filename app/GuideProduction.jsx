import {isBambu} from '../lib/project3mf.mjs';
import {layerPlan} from '../lib/layers.mjs';
import {hasSpacers} from '../lib/board-designs.mjs';

function DownloadWallLocation(){
 return <figure className="export-location-example">
  <svg viewBox="0 0 360 290" role="img" aria-label="Download All is in the toolbar above the main canvas, on the right. Illustrated example.">
   <rect x="8" y="8" width="344" height="274" rx="8" fill="#fff" stroke="#b4c1b4"/>
   <text x="22" y="32" fontSize="12" fontWeight="600" fill="#304f4a">Total wall size</text>
   <text x="22" y="51" fontSize="11" fill="#59665f">Tiles · print projects</text>
   <rect x="183" y="16" width="159" height="48" rx="7" fill="none" stroke="#d77e42" strokeWidth="3"/>
   <rect x="188" y="21" width="149" height="38" rx="4" fill="#304f4a"/>
   <path d="M202 29v14m-4-4 4 4 4-4m-10 4v6h12v-6" fill="none" stroke="#fff" strokeWidth="1.6"/>
   <text x="217" y="39" fontSize="14" fontWeight="600" fill="#fff">Download All</text>
   <text x="217" y="51" fontSize="9" fill="#dce7de">ZIP / 3MF</text>
   <path d="M8 76H352" stroke="#dde4d8"/>
   <text x="22" y="97" fontSize="11" fill="#59665f">Wall preview</text>
   <path d="M269 95V69m-5 6 5-6 5 6" fill="none" stroke="#d77e42" strokeWidth="2"/>
   <rect x="22" y="110" width="316" height="154" rx="5" fill="#f0e5cf"/>
   <circle cx="253" cy="151" r="25" fill="#e6a041"/>
   <path d="M22 204Q99 142 183 207T338 183V264H22Z" fill="#304f4a"/>
   <path d="M22 240Q126 210 211 240T338 231V264H22Z" fill="#a4533b"/>
   <path d="M101 110V264M180 110V264M259 110V264M22 187H338" stroke="#fff" strokeWidth="1.5"/>
  </svg>
  <figcaption>Above the canvas: <strong>Download All</strong>.</figcaption>
 </figure>;
}
export default function GuideProduction({config:c,advanced=false,Step,AssemblyDiagram}){
 const bambu=isBambu(c),layers=layerPlan(c);
 return <>
  <section className="guide-group" id="guide-print" aria-labelledby="guide-print-title">
   <h2 id="guide-print-title">Print</h2>
   <Step id="print-wall" title={bambu?'Prepare and print in Bambu Studio':'Prepare and print in your slicer'} visual={<DownloadWallLocation/>}>
    <p>Once the test tile looks right, use <strong>Download All</strong> to export every tile. On your first export in this session, read the service terms and confirm that you have permission to use the artwork. Free exports are for personal, noncommercial use; selling files or prints requires separate commercial permission. Unzip the download if needed and open each project in turn. Use the same checks below for your test tile.</p>
    {bambu&&<p><strong>In Bambu Studio app:</strong></p>}
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
