import ParameterHelp from './ParameterHelp.jsx';
import {weight,UsageStatus,UsageAction} from './FilamentUsage.jsx';
export function MatchedPalette({sources,filaments,count,usage,estimate}){
 const ordered=[...filaments].sort((a,b)=>{
  const rank=f=>{const i=sources.findIndex(s=>f.sourceIndices.includes(s.index));return i<0?Infinity:i;};
  return rank(a)-rank(b);
 });
 return <aside className="palette-rail mapping-rail" aria-label="Source colors and matched filaments">
  <h3>Color mapping <span>{sources.length} → {count}</span><UsageAction estimate={estimate} compact/><ParameterHelp label="Canvas color mapping" text="Each row pairs source image colors with their matched filament. Multiple source colors can share a filament; its combined usage is shown once. Image percentages describe the original artwork. Usage updates automatically for the cropped whole canvas, excluding purge, prime tower and supports."/></h3>
  <p className="rail-caption">Whole-canvas estimate</p><UsageStatus estimate={estimate} compact/>
  {usage&&<p className="rail-total">≈ {weight(usage.grams)} total</p>}
  <div className="mapping-labels"><span>Source colors</span><span>Matched filament</span></div>
  <ul>{ordered.map(f=><li className={`mapping-row ${f.sourceIndices.length?'':'backing-only'}`} key={JSON.stringify([f.family,f.color,f.name])}>
   <div className="mapping-sources">{f.sourceIndices.length?sources.filter(s=>f.sourceIndices.includes(s.index)).map(s=><div className="mapping-source" key={s.index}><i style={{background:s.color}}/><div><strong>{s.color.toUpperCase()}</strong>{s.share!==null&&<small>{(s.share*100).toFixed(1)}% of image</small>}</div></div>):<small>Backing</small>}</div>
   <span className="mapping-arrow" aria-hidden="true">→</span>
   <div className="mapping-filament"><div className="mapping-swatch-name"><i style={{background:f.color}}/><strong>{f.name==='Custom color'?f.color:f.name}</strong></div><small>{f.family.replace(/^Bambu /,'')}{f.backing&&f.sourceIndices.length?' · includes backing':''}</small><span className="rail-amount">{usage?`≈ ${weight(f.amount?.grams||0)}`:'— g'}</span></div>
  </li>)}</ul>
 </aside>;
}
