import {useEffect,useRef,useState} from 'react';
import GeometryWorker from '../lib/export-worker.mjs?worker';
import {sampleTile} from '../lib/image.mjs';
import {startUsageCalculation,usageConfigKey} from '../lib/usage-calculation.mjs';

export default function useAutomaticUsage(config,image,error){
  const key=usageConfigKey(config),[attempt,retry]=useState(0),[result,setResult]=useState(null),stop=useRef(null);
  useEffect(()=>{
    if(!image||error)return;
    const input={key,image,attempt};
    const cleanup=startUsageCalculation({config:structuredClone(config),image,sampleTile,createWorker:()=>new GeometryWorker(),onChange:state=>setResult({...input,...state})});
    stop.current=cleanup;
    return cleanup;
  },[key,image,error,attempt]);
  const current=result?.key===key&&result?.image===image&&result?.attempt===attempt;
  const state=error?{phase:'unavailable',text:'Fix the design settings to calculate usage.'}:!image?{phase:'unavailable',text:'Waiting for artwork…'}:current?result:{phase:'pending',text:'Calculating… waiting for changes to settle.'};
  return {...state,retry:()=>retry(n=>n+1),cancel:()=>{stop.current?.();setResult({key,image,attempt,phase:'paused',text:'Calculation paused. Resume, or change the design to calculate automatically.'});}};
}
