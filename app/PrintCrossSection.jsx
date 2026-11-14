import {layerPlan} from '../lib/layers.mjs';
export default function PrintCrossSection({config:c}) {
  const {depth=0,backing=0,valid=false,full=false}=layerPlan(c)??{};
  return <div className="layer-panel"><span className="eyebrow">PRINT CROSS-SECTION</span>{valid?<>
    <div className="layer-diagram" role="img" aria-label={`${c.faceDown?'Face-down':'Face-up'}: ${c.colorLayers} colored ${c.colorLayers===1?'layer':'layers'}, ${depth.toFixed(2)} mm; ${full?'color through the full thickness.':`backing ${backing.toFixed(2)} mm. Color prints ${c.faceDown?'first':'last'}.`}`}>
      <div className={'layer-stack '+(c.faceDown?'face-down':'face-up')}>
        {!full&&<div className="backing" style={{backgroundColor:c.backing,height:`${backing/c.thickness*100}%`}}/>}
        <div className="color-layer" style={{height:`${depth/c.thickness*100}%`}}>{Array.from({length:Math.min(c.colorLayers,32)},(_,layer)=><div className="color-stratum" key={layer}>{c.palette.map((color,i)=><span key={i} style={{background:color}}/>)}</div>)}</div>
      </div><div className="build-plate"/>
    </div>
    <div className="layer-labels">{!full&&<span>Backing · {backing.toFixed(2)} mm</span>}<span>{c.colorLayers} colored {c.colorLayers===1?'layer':'layers'} · {depth.toFixed(2)} mm</span></div>
    <p>{full?'Artwork colors run through the full tile thickness.':c.faceDown?'Color prints first, against the build plate.':'Backing prints first; color forms the top surface.'}</p>
  </>:<p className="hint">Set valid layer and board thicknesses to preview the cross-section.</p>}</div>;
}
