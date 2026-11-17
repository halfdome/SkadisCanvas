import {hasSpacers,boardDepth} from '../lib/board-designs.mjs';
import {layerPlan} from '../lib/layers.mjs';
export default function PrintCrossSection({config:c,colors=null}) {
  const {depth=0,backing=0,valid=false,full=false}=layerPlan(c)??{};
  return <div className="layer-panel"><span className="eyebrow">PRINT CROSS-SECTION</span>{valid?<>
    <div className="layer-diagram" role="img" aria-label={`${c.faceDown?'Face-down':'Face-up'}: ${c.colorLayers} colored ${c.colorLayers===1?'layer':'layers'}, ${depth.toFixed(2)} mm; ${full?'color through the full thickness.':`backing ${backing.toFixed(2)} mm. Color prints ${c.faceDown?'first':'last'}.`}`}>
      {hasSpacers(c)&&<div className="spacer-stack" style={{height:`${Math.min(90,c.spacerHeight*4)}px`}}><i style={{width:`${c.spacerDiameter*2}px`,background:c.backing}}/><span>{c.spacerHeight} mm spacers</span><i style={{width:`${c.spacerDiameter*2}px`,background:c.backing}}/></div>}
      <div className={'layer-stack '+(c.faceDown?'face-down':'face-up')}>
        {!full&&<div className="backing" style={{backgroundColor:c.backing,height:`${backing/c.thickness*100}%`}}/>}
        <div className="color-layer" style={{height:`${depth/c.thickness*100}%`}}>{Array.from({length:Math.min(c.colorLayers,32)},(_,layer)=><div className="color-stratum" key={layer}>{(colors?.length?colors:['#dfe4db']).map((color,i)=><span key={i} style={{background:color}}/>)}</div>)}</div>
      </div><div className="build-plate"/>
    </div>
    <p className="tile-color-status">{colors===null?'Checking selected tile colors…':colors.length?`${colors.length} surface filament ${colors.length===1?'color':'colors'} in selected tile`:'Tile colors unavailable'}</p><div className="layer-labels">{!full&&<span>Backing · {backing.toFixed(2)} mm</span>}<span>{c.colorLayers} colored {c.colorLayers===1?'layer':'layers'} · {depth.toFixed(2)} mm</span></div>
    <p>{hasSpacers(c)?`Total depth: ${boardDepth(c).toFixed(2)} mm. Spacers use the backing filament. `:''}{full?'Artwork colors run through the full tile thickness.':c.faceDown?'Color prints first, against the build plate.':'Backing prints first; color forms the top surface.'}</p>
  </>:<p className="hint">Set valid layer and board thicknesses to preview the cross-section.</p>}</div>;
}
