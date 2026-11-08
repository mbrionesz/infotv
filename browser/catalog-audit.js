// Opt-in metadata checks in the user's TV session. Never resolves media URLs.
export function createCatalogAudit(core,{now=Date.now}={}){
 let active=null,last=null;
 const request=(method,payload)=>new Promise((resolve,reject)=>core.call(method,payload,(error,result)=>error?reject(error):resolve(result)));
 const option=value=>typeof value==='object'&&value?{id:String(value.id),name:String(value.name||value.id)}:{id:String(value),name:String(value)};
 return {cancel(){if(active)active.cancelled=true;},snapshot(){return last;},async run({root='series',maxChecks=500,budgetMs=240000,onProgress=()=>{}}={}){
  if(active)throw new Error('Ya hay una auditoría de catálogo en curso');
  if(!['movies','series','featured','kids','anime'].includes(root))throw new Error('Sección no válida');
  const state={cancelled:false},started=now();active=state;
  const report=last={root,scope:'opciones individuales y combinaciones representativas; primera página',entries:[],complete:false,cancelled:false,metadataErrors:[],certifiesContents:false};
  try{
   const metadata=await Promise.all(['catalogColumns','catalogFilters'].map(method=>request(method,{root,fresh:true}).catch(()=>{report.metadataErrors.push(method);return {};})));
   const columns=(metadata[0].columns||[]).map(option),facets=metadata[1];
   const groups=[['genre',facets.genres||[]],['year',facets.years||[]],['country',facets.countries||[]]];
   const tasks=[{kind:'root',name:'Todos',filters:{}}];
   columns.forEach(value=>tasks.push({kind:'category',name:value.name,filters:{column:value.id}}));
   groups.forEach(([key,values])=>values.map(option).filter(value=>value.id).forEach(value=>tasks.push({kind:key,name:value.name,filters:{[key]:value.id}})));
   const sample={};groups.forEach(([key,values])=>{if(values.length)sample[key]=option(values[0]).id;});
   if(Object.keys(sample).length>1){tasks.push({kind:'combined',name:'Filtros combinados',filters:sample});columns.forEach(value=>tasks.push({kind:'combined-category',name:value.name,filters:Object.assign({column:value.id},sample)}));}
   const count=Math.min(500,Math.max(1,Number(maxChecks)||500)),budget=Math.min(480000,Math.max(1000,Number(budgetMs)||240000));
   report.planned=tasks.length;report.truncated=tasks.length>count;
   for(const task of tasks.slice(0,count)){
    if(state.cancelled||now()-started>=budget)break;
    const entry={kind:task.kind,name:String(task.name).slice(0,100),filters:task.filters};
    try{const result=await request('catalogBrowse',{root,filters:task.filters,pageNum:1,pageSize:36,fresh:true});entry.state=(result.items||[]).length?'respondió':'sin resultados';entry.items=(result.items||[]).length;entry.total=result.total;entry.hasMore=!!result.hasMore;}
    catch(error){entry.state='error';entry.code=String(error.portalCode||'consulta rechazada o sin respuesta').slice(0,80);}
    report.entries.push(entry);try{onProgress(entry);}catch(_){}
   }
   report.cancelled=state.cancelled;report.elapsedMs=now()-started;report.complete=!report.metadataErrors.length&&!report.truncated&&report.entries.length===tasks.length&&!state.cancelled;
   report.errors=report.entries.filter(entry=>entry.state==='error').length;return report;
  }finally{active=null;}
 }};
}
