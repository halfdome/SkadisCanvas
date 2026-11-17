export default function TileFilaments({filaments}) {
  return <section className="tile-filaments" aria-label="Filaments used by selected tile">
    <h4>Filaments in this tile</h4>
    {filaments===null?<p className="hint" role="status">Checking tile filaments…</p>:filaments.length?<ul>
      {filaments.map(({color,family,name,surface,backing})=><li key={`${family}|${color}|${name}`}>
        <span className="tile-filament-swatch" style={{background:color}} aria-hidden="true"/>
        <div><strong>{name==='Custom color'?color:name}</strong><span>{family}</span><small>{surface&&backing?'Surface + backing':backing?'Backing':'Surface'}</small></div>
      </li>)}
    </ul>:<p className="hint" role="status">Tile filaments unavailable.</p>}
  </section>;
}
