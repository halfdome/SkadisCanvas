import {materialKey} from '../lib/filament-usage.mjs';
import {UsageNote,weight,length} from './FilamentUsage.jsx';
export default function TileFilaments({filaments,usage,usageError}) {
  return <section className="tile-filaments" aria-label="Filaments used by selected tile">
    <h4>Filaments in this tile</h4>
    {filaments===null?<p className="hint" role="status">Checking tile filaments…</p>:filaments.length?<ul>
      {filaments.map(({color,family,name,surface,backing})=>{const amount=usage?.materials.find(m=>materialKey(m)===materialKey({color,family,name}));return <li key={`${family}|${color}|${name}`}>
        <span className="tile-filament-swatch" style={{background:color}} aria-hidden="true"/>
        <div><strong>{name==='Custom color'?color:name}</strong><span>{family}</span><small>{surface&&backing?'Surface + backing':backing?'Backing':'Surface'}</small>{amount&&<span className="filament-amount">≈ {weight(amount.grams)} · {length(amount.meters)}</span>}</div>
      </li>;})}
    </ul>:<p className="hint" role="status">Tile filaments unavailable.</p>}
    {usage&&<><p className="usage-total">Tile estimate: ≈ {weight(usage.grams)} <span>· {length(usage.meters)}</span></p><UsageNote usage={usage}/></>}
    {usageError&&<p className="hint" role="status">Filament estimate unavailable. Try a coarser surface detail.</p>}
  </section>;
}
