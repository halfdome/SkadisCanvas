export default function PrintCrossSection({config:c}) {
  const depth=c.layerHeight*c.colorLayers, backing=c.thickness-depth;
  const valid=Number.isFinite(depth)&&depth>0&&backing>0&&Number.isInteger(c.colorLayers)&&c.colorLayers<=10;
  return <div className="layer-panel"><span className="eyebrow">PRINT CROSS-SECTION</span>{valid?<>
    <div className="layer-diagram" role="img" aria-label={`${c.faceDown?'Face-down':'Face-up'}: ${c.colorLayers} colored ${c.colorLayers===1?'layer':'layers'}, ${depth.toFixed(2)} mm; backing ${backing.toFixed(2)} mm. Color prints ${c.faceDown?'first':'last'}.`}>
      <div className={'layer-stack '+(c.faceDown?'face-down':'face-up')}>
        <div className="backing" style={{backgroundColor:c.backing,height:`${backing/c.thickness*100}%`}}/>
        <div className="color-layer" style={{height:`${depth/c.thickness*100}%`}}>{Array.from({length:c.colorLayers},(_,layer)=><div className="color-stratum" key={layer}>{c.palette.map((color,i)=><span key={i} style={{background:color}}/>)}</div>)}</div>
      </div><div className="build-plate"/>
    </div>
    <div className="layer-labels"><span>Backing · {backing.toFixed(2)} mm</span><span>{c.colorLayers} colored {c.colorLayers===1?'layer':'layers'} · {depth.toFixed(2)} mm</span></div>
    <p>{c.faceDown?'Color prints first, against the build plate.':'Backing prints first; color forms the top surface.'}</p>
  </>:<p className="hint">Set valid layer and board thicknesses to preview the cross-section.</p>}</div>;
}
