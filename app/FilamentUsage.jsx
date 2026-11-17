import ParameterHelp from './ParameterHelp.jsx';
import ActionButton from './ActionButton.jsx';
import {usageAssumptions} from '../lib/filament-usage.mjs';
export const weight=g=>g>=1000?`${(g/1000).toFixed(2)} kg`:`${g.toFixed(1)} g`;
export const length=m=>`${m.toFixed(1)} m`;
export function UsageNote({usage}){return <p className="usage-note">{usageAssumptions}{usage?.materials.some(m=>m.assumedDensity)&&' Custom filaments assume PLA density (1.24 g/cm³) and 1.75 mm diameter.'}</p>;}
export default function FilamentUsage({usage,total,status,onEstimate,onCancel,disabled}){
 return <section className="wall-usage" aria-label="Whole canvas filament estimate"><div className="usage-heading"><h4>Whole canvas · {total} {total===1?'tile':'tiles'}</h4><ParameterHelp label="Filament estimate" text={usageAssumptions}/>{status?<ActionButton className="text-button" hint="Stop the whole-canvas estimate. Your design stays unchanged." onClick={onCancel}>Cancel estimate</ActionButton>:<ActionButton className="text-button" hint="Calculate the model filament needed for every tile, using its actual artwork, holes, backing and spacers." disabled={disabled} onClick={onEstimate}>{usage?'Recalculate estimate':'Estimate whole canvas'}</ActionButton>}</div>
 {status&&<p role="status">{status}</p>}
 {usage&&<><p className="usage-total">≈ {weight(usage.grams)} <span>· {length(usage.meters)} total filament</span></p><ul className="usage-materials">{usage.materials.filter(m=>m.volume>1e-6).map(m=><li key={JSON.stringify([m.family,m.color,m.name])}><i style={{background:m.color}}/><div><strong>{m.name==='Custom color'?m.color:m.name}</strong><small>{m.family}</small></div><span>≈ {weight(m.grams)}<small>{length(m.meters)}</small></span></li>)}</ul><UsageNote usage={usage}/></>}
 {!usage&&!status&&<p className="hint">A per-filament estimate for all tiles, including the backing.</p>}
 </section>;
}
