import ActionButton from './ActionButton.jsx';
import {materialKey} from '../lib/filament-usage.mjs';
import {UsageNote,weight,length} from './FilamentUsage.jsx';
export default function TileFilaments({filaments,usage,usageError,onRetry}) {
  return <section className="tile-filaments" aria-label="Filaments used by selected tile">
    <h4>Filaments in this tile</h4>
    {filaments===null?<p className="hint" role="status">Calculating tile usage…</p>:filaments.length?<ul>
      {filaments.map(({color,family,name,surface,backing})=>{const amount=usage?.materials.find(m=>materialKey(m)===materialKey({color,family,name}));return <li key={`${family}|${color}|${name}`}>
        <span className="tile-filament-swatch" style={{background:color}} aria-hidden="true"/>
        <div><strong>{name==='Custom color'?color:name}</strong><span>{family}</span><small>{surface&&backing?'Surface + backing':backing?'Backing':'Surface'}</small>{amount&&<span className="filament-amount">≈ {weight(amount.grams)} · {length(amount.meters)}</span>}</div>
      </li>;})}
    </ul>:null}
    {usage&&<><p className="usage-status calculated" role="status">Calculated · selected tile</p><p className="usage-total">Tile estimate: ≈ {weight(usage.grams)} <span>· {length(usage.meters)}</span></p><UsageNote usage={usage}/></>}
    {usageError&&<div className="tile-usage-error" role="alert"><p>Could not calculate this tile: {usageError}</p><p className="hint">Retry, or choose a coarser Surface detail setting.</p><ActionButton className="text-button" onClick={onRetry} hint="Retry the selected tile’s filament list and usage estimate with the current artwork and settings.">Retry tile calculation</ActionButton></div>}
  </section>;
}
