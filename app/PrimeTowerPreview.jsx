import {plateLayout} from '../lib/printers.mjs';
function TowerExample({wall,tower,active,config,limits}){
  let layout;try{layout=plateLayout({...config,primeTowerStyle:wall?'wall':'standard'});}catch{}
  const t=layout?.tower,scale=limits?Math.min(140/limits.width,98/limits.depth):1;
  const x=v=>5+(140-(limits?.width??140)*scale)/2+v*scale,y=(v,h)=>103-(v+h)*scale;

  return <figure className={'tower-example'+(active?' active':'')}>
    <svg viewBox="0 0 150 108" role="img" aria-label={wall?'Wall-style prime tower: a wide, shallow rectangle behind the tile. Top view schematic.':'Standard prime tower: a compact square beside the tile. Top view schematic.'}>
      <rect x={layout?x(0):5} y={layout?y(0,limits.depth):5} width={layout?limits.width*scale:140} height={layout?limits.depth*scale:98} rx="5" fill="#fff" stroke="#b8c5b7"/>
      {layout&&limits?<>
        <rect x={x(layout.x)} y={y(layout.y,config.height)} width={config.width*scale} height={config.height*scale} rx="1" fill="#dce7de"/>
        <text x={x(layout.x+config.width/2)} y={y(layout.y,config.height/2)} textAnchor="middle">Tile</text>
        {t&&<rect x={x(t.x-t.brim)} y={y(t.y-t.brim-(t.frontPad??0),t.height+2*t.brim+(t.frontPad??0))} width={(t.width+2*t.brim)*scale} height={(t.height+2*t.brim+(t.frontPad??0))*scale} rx="1" fill="#df9360"/>}
      </>:<g opacity=".7">      {wall?<><rect x="24" y="17" width="102" height="14" rx="2" fill="#df9360"/><path d="M28 21h94M28 26h94" stroke="#ad6332"/><rect x="32" y="43" width="86" height="48" rx="3" fill="#dce7de"/><text x="75" y="72" textAnchor="middle">Tile</text></>:<><rect x="17" y="19" width="39" height="39" rx="4" fill="#df9360"/><path d="M22 24h29v29H22z" fill="none" stroke="#ad6332"/><rect x="68" y="32" width="62" height="59" rx="3" fill="#dce7de"/><text x="99" y="67" textAnchor="middle">Tile</text></>}</g>}

    </svg>
    <figcaption><strong>{wall?'Wall-style':'Standard'}</strong><span>{wall?'Wide and shallow':'Square with reinforced walls'}</span>{tower&&<small>Reserved footprint: {Math.round(tower.width+2*tower.brim)} × {Math.round(tower.height+2*tower.brim+(tower.frontPad??0))} mm</small>}</figcaption>
  </figure>;
}
export default function PrimeTowerPreview({config,style,placement,limits}){
  const active=placement?.tower;
  return <div className="tower-preview"><div className="tower-examples">
    {style!=='wall'&&<TowerExample config={config} limits={limits} tower={limits?.tower} active={!!active&&!active.compact}/>}
    {style!=='standard'&&<TowerExample config={config} limits={limits} wall tower={limits?.compactTower} active={!!active?.compact}/>}
  </div><p className="hint">{!limits?.towerRequired?'No prime tower needed for one filament.':!placement?'Adjust the board size or tower style to fit the plate.':style==='auto'?`Using ${active?.compact?'wall-style':'standard'} for this layout.`:`${style==='wall'?'Wall-style':'Standard'} is preserved in the export.`} <span className="tower-schematic-note">Top view; orange marks the reserved tower footprint. Minimum gap: 3 mm beyond its reserved footprint. Final tower size is calculated by the slicer.</span></p></div>;
}
