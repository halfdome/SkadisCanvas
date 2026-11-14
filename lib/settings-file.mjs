export async function saveSettingsAs(config,host=window) {
  const text=JSON.stringify({version:1,config},null,2);
  if(typeof host.showSaveFilePicker==='function') {
    try {
      const handle=await host.showSaveFilePicker({suggestedName:'skadis-project.json',types:[{description:'SKÅDIS project settings',accept:{'application/json':['.json']}}]});
      const writable=await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return 'saved';
    } catch(error) {if(error.name==='AbortError')return 'cancelled';throw error;}
  }
  const url=host.URL.createObjectURL(new Blob([text],{type:'application/json'}));
  const a=host.document.createElement('a');a.href=url;a.download='skadis-project.json';a.click();
  host.setTimeout(()=>host.URL.revokeObjectURL(url),30000);
  return 'download';
}
