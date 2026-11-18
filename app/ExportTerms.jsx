'use client';
import {useEffect,useRef,useState} from 'react';
import {termsSections,TERMS_VERSION} from '../lib/provenance.mjs';
export default function ExportTerms({onClose,onAccept}){
 const dialog=useRef(null),[accepted,setAccepted]=useState(false);
 useEffect(()=>{const node=dialog.current;node.showModal();return()=>node.close();},[]);
 return <dialog ref={dialog} className="export-terms" onCancel={event=>{event.preventDefault();onClose();}} aria-labelledby="export-terms-title">
  <div className="export-terms-heading"><h2 id="export-terms-title">{onAccept?'Before your first export':'Service terms'}</h2><button onClick={onClose} aria-label="Close service terms">×</button></div>
  <p className="hint">Free for personal use · Commercial use requires separate permission</p>
  <div className="export-terms-body" tabIndex={0}>{termsSections.map(([title,text])=><section key={title}><h3>{title}</h3><p>{text}</p></section>)}<p className="hint">Terms version {TERMS_VERSION}</p><p><a href="/licenses/BambuStudio-AGPL-3.0.txt" target="_blank" rel="noreferrer">Bambu Studio upstream license</a></p></div>
  {onAccept?<><label className="export-terms-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>I agree to these service terms and have permission to use my artwork.</label><div className="export-terms-actions"><button onClick={onClose}>Cancel</button><button className="primary" disabled={!accepted} onClick={()=>onAccept(new Date().toISOString())}>Agree and download</button></div></>:<div className="export-terms-actions"><button onClick={onClose}>Close</button></div>}
 </dialog>;
}
