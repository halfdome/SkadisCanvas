// Inputs consumed by artwork sampling, board geometry and model-use estimation.
// Tower/bed allowances are excluded: the estimate does not include purge or tower.
const usageFields=['printer','boardDesign','cols','rows','width','height','gap','thickness','edgeSlots','slotWidth','slotHeight','pitch','spacerHeight','spacerDiameter','backLabel','layerHeight','colorLayers','pixel','faceDown','fit','zoom','panX','panY','palette','sourcePalette','filaments','backing','backingFilament'];
export const usageConfigKey=config=>JSON.stringify(Object.fromEntries(usageFields.map(key=>[key,config[key]])));

// One cancellable calculation. Cleanup invalidates sampling, queued worker
// messages and errors as well as terminating the worker itself.
export function startUsageCalculation({config,image,sampleTile,createWorker,onChange,delay=450}){
  let active=true,worker;
  const publish=state=>{if(active)onChange(state);};
  const fail=message=>{publish({phase:'error',text:`Estimate unavailable: ${message}`});active=false;worker?.terminate();};
  publish({phase:'pending',text:'Calculating… waiting for changes to settle.'});
  const timer=setTimeout(async()=>{
    try{
      const samples=[],total=config.cols*config.rows;
      publish({phase:'calculating',text:'Calculating… sampling artwork.'});
      for(let i=0;i<total;i++){
        if(!active)return;
        const col=i%config.cols,row=Math.floor(i/config.cols);
        samples.push({col,row,...sampleTile(image,config,col,row)});
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(!active)return;
      worker=createWorker();
      worker.onmessage=({data})=>{
        if(!active)return;
        if(data.usageProgress)publish({phase:'calculating',text:`Calculating… tile ${data.usageProgress} of ${data.total}.`});
        if(data.usage){publish({phase:'calculated',text:'Calculated · up to date',usage:data.usage});active=false;worker.terminate();}
        else if(data.error)fail(data.error);
      };
      worker.onerror=()=>fail('Try a coarser surface detail.');
      worker.postMessage({config,samples,mode:'usage'});
    }catch(error){fail(error.message);}
  },delay);
  return()=>{active=false;clearTimeout(timer);worker?.terminate();};
}
