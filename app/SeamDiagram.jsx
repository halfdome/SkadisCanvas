export default function SeamDiagram({shared}){
  return <svg className="seam-diagram" viewBox="0 0 156 120" role="img" aria-label={shared?'Shared edge slots example: a vertical slot crosses the horizontal seam between upper and lower tiles.':'Inset slots example: vertical slots sit inside the upper and lower tiles, away from the horizontal seam.'}>
    <rect x="12" y="4" width="132" height="48" rx="4" fill="#dce7de"/>
    <rect x="12" y="56" width="132" height="48" rx="4" fill="#dce7de"/>
    <path d="M8 54H148" stroke="#c9834b" strokeDasharray="3 3"/>
    {(shared?[40]:[12,68]).map(y=><rect key={y} x="73" y={y} width="10" height="28" rx="5" fill="#fafbf7" stroke="#7a9183"/>)}
    <text x="78" y="118" textAnchor="middle" fill="#59655e" fontSize="10">Tile seam · schematic</text>
  </svg>;
}
