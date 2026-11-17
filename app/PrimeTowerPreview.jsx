function TowerExample({wall,tower,active}){
  return <figure className={'tower-example'+(active?' active':'')}>
    <svg viewBox="0 0 150 108" role="img" aria-label={wall?'Wall-style prime tower: a wide, shallow rectangle behind the tile. Top view schematic.':'Standard prime tower: a compact square beside the tile. Top view schematic.'}>
      <rect x="5" y="5" width="140" height="98" rx="5" fill="#fff" stroke="#b8c5b7"/>
      {wall?<><rect x="24" y="17" width="102" height="14" rx="2" fill="#df9360"/><path d="M28 21h94M28 26h94" stroke="#ad6332"/><rect x="32" y="43" width="86" height="48" rx="3" fill="#dce7de"/><text x="75" y="72" textAnchor="middle">Tile</text></>:<><rect x="17" y="19" width="39" height="39" rx="4" fill="#df9360"/><path d="M22 24h29v29H22z" fill="none" stroke="#ad6332"/><rect x="68" y="32" width="62" height="59" rx="3" fill="#dce7de"/><text x="99" y="67" textAnchor="middle">Tile</text></>}
    </svg>
    <figcaption><strong>{wall?'Wall-style':'Standard'}</strong><span>{wall?'Wide and shallow':'Square with reinforced walls'}</span>{tower&&<small>Reserved footprint: {Math.round(tower.width)} × {Math.round(tower.height)} mm</small>}</figcaption>
  </figure>;
}
export default function PrimeTowerPreview({style,placement,limits}){
  const active=placement?.tower;
  return <div className="tower-preview"><div className="tower-examples">
    {style!=='wall'&&<TowerExample tower={limits?.tower} active={!!active&&!active.compact}/>}
    {style!=='standard'&&<TowerExample wall tower={limits?.compactTower} active={!!active?.compact}/>}
  </div><p className="hint">{!limits?.towerRequired?'No prime tower needed for one filament.':!placement?'Adjust the board size or tower style to fit the plate.':style==='auto'?`Using ${active?.compact?'wall-style':'standard'} for this layout.`:`${style==='wall'?'Wall-style':'Standard'} is preserved in the export.`} <span className="tower-schematic-note">Top-view examples; orange marks the prime tower. Actual size is calculated by the slicer.</span></p></div>;
}
