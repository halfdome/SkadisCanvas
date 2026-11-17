export default function ExportTileLocation(){
 return <figure className="export-location-example">
  <svg viewBox="0 0 320 340" role="img" aria-label="Select a tile in the canvas. Beneath the canvas, the Selected tile panel contains Export tile. Open it and choose Download tile R01-C01. Illustrated example.">
   <text x="12" y="20" fontSize="14" fontWeight="600" fill="#304f4a">1  Select a tile in the canvas</text>
   <rect x="12" y="32" width="296" height="92" rx="5" fill="#f0e5cf"/>
   <path d="M12 86Q85 42 160 89T308 70V124H12Z" fill="#304f4a"/>
   <path d="M12 110Q115 85 197 112T308 103V124H12Z" fill="#a4533b"/>
   <path d="M111 32V124M210 32V124M12 78H308" stroke="#fff" strokeWidth="2"/>
   <rect x="14" y="34" width="95" height="42" rx="3" fill="none" stroke="#d77e42" strokeWidth="4"/>
   <path d="M60 128V145m-5-5 5 5 5-5" fill="none" stroke="#748477" strokeWidth="2"/>
   <rect x="12" y="153" width="296" height="177" rx="7" fill="#fff" stroke="#b4c1b4"/>
   <text x="26" y="175" fontSize="11" letterSpacing="1" fill="#59665f">SELECTED TILE</text>
   <text x="26" y="198" fontSize="17" fontWeight="600" fill="#263a35">R01 / C01</text>
   <rect x="23" y="210" width="175" height="38" rx="6" fill="#fff5e9" stroke="#d77e42" strokeWidth="2"/>
   <path d="M39 218v16m-5-5 5 5 5-5m-12 5v5h14v-5" fill="none" stroke="#304f4a" strokeWidth="1.6"/>
   <text x="56" y="235" fontSize="16" fontWeight="600" fill="#263a35">Export tile</text>
   <path d="m177 234 5-5 5 5" fill="none" stroke="#304f4a" strokeWidth="1.6"/>
   <circle cx="220" cy="229" r="12" fill="#d77e42"/><text x="220" y="234" fontSize="13" textAnchor="middle" fill="#fff">2</text>
   <rect x="24" y="256" width="270" height="31" rx="4" fill="#e9f1e6"/>
   <text x="35" y="277" fontSize="14" fontWeight="600" fill="#263a35">Download tile R01-C01</text>
   <text x="35" y="311" fontSize="13" fill="#59665f">Download blank tile</text>
  </svg>
  <figcaption>Below the canvas: <strong>Export tile</strong> → <strong>Download tile</strong>.</figcaption>
 </figure>;
}
