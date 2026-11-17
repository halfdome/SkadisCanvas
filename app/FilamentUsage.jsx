import ParameterHelp from './ParameterHelp.jsx';
import ActionButton from './ActionButton.jsx';
import {usageAssumptions} from '../lib/filament-usage.mjs';
import {Check,LoaderCircle,Pause,RotateCcw} from 'lucide-react';
export const weight=g=>g>=1000?`${(g/1000).toFixed(2)} kg`:`${g.toFixed(1)} g`;
export const length=m=>`${m.toFixed(1)} m`;
export function UsageNote({usage}){return <p className="usage-note">{usageAssumptions}{usage?.materials.some(m=>m.assumedDensity)&&' Custom filaments assume PLA density (1.24 g/cm³) and 1.75 mm diameter.'}</p>;}
export function UsageStatus({estimate,compact=false}){
 const working=['pending','calculating'].includes(estimate.phase);
 const text=compact&&estimate.phase==='paused'?'Calculation paused':compact&&estimate.phase==='error'?'Calculation failed':estimate.text;
 return <p className={`usage-status ${estimate.phase}${compact?' compact':''}`} role="status" aria-atomic="true">{working?<LoaderCircle size={14} className="usage-spinner" aria-hidden="true"/>:estimate.phase==='calculated'?<Check size={14} aria-hidden="true"/>:null}{text}</p>;
}
export function UsageAction({estimate,compact=false}){
 const working=['pending','calculating'].includes(estimate.phase);
 if(estimate.phase==='calculated'||estimate.phase==='unavailable')return null;
 const label=working?'Pause calculation':estimate.phase==='paused'?'Resume calculation':'Retry calculation';
 return <ActionButton className={compact?'rail-estimate':'text-button'} aria-label={label} hint={working?'Pause this estimate. A design change starts a fresh calculation automatically.':'Calculate model usage for the current design. Estimates update automatically after relevant changes.'} onClick={working?estimate.cancel:estimate.retry}>{working?<Pause size={13}/>:<RotateCcw size={13}/>} {!compact&&label}</ActionButton>;
}
export default function FilamentUsage({usage,total,estimate}){
 const working=['pending','calculating'].includes(estimate.phase);
 return <section className="wall-usage" aria-label="Whole canvas filament estimate" aria-busy={working}><div className="usage-heading"><h4>Whole canvas · {total} {total===1?'tile':'tiles'}</h4><ParameterHelp label="Filament estimate" text={usageAssumptions}/><UsageAction estimate={estimate}/></div>
 <UsageStatus estimate={estimate}/>
 {usage&&<><p className="usage-total">≈ {weight(usage.grams)} <span>· {length(usage.meters)} total filament</span></p><ul className="usage-materials">{usage.materials.filter(m=>m.volume>1e-6).map(m=><li key={JSON.stringify([m.family,m.color,m.name])}><i style={{background:m.color}}/><div><strong>{m.name==='Custom color'?m.color:m.name}</strong><small>{m.family}</small></div><span>≈ {weight(m.grams)}<small>{length(m.meters)}</small></span></li>)}</ul><UsageNote usage={usage}/></>}
 <p className="hint">Updates automatically when artwork, board, print layers or filaments change.</p>
 </section>;
}
