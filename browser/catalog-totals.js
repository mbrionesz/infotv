// Compare scopes, never add overlapping portal collections or expose session URLs.
export async function compareCatalogTotals(call,root='series'){
 if(!['movies','series','kids','anime'].includes(root))throw new Error('Catálogo no válido');
 const metadata=await call('catalogColumns',{root});
 const columns=(metadata.columns||[]).slice().sort((a,b)=>Number(/netflix/i.test(b.name))-Number(/netflix/i.test(a.name))).slice(0,4);
 const scopes=[{id:'',name:'Catálogo general'},...columns],results=[];
 for(const scope of scopes){try{const page=await call('catalogBrowse',{root,pageNum:1,pageSize:36,filters:{column:scope.id}});const ids=(page.items||[]).map(item=>String(item.id));const first=results[0];results.push({collection:scope.name,column:scope.id||null,source:page.source||null,totalField:page.totalField||null,reportedTotal:page.total??null,sampleCount:ids.length,uniqueSampleCount:new Set(ids).size,overlapWithGeneralSample:first?ids.filter(id=>first._ids.includes(id)).length:null,_ids:ids});}catch(error){results.push({collection:scope.name,error:String(error.message||error),_ids:[]});}}
 return {root,checkedAt:new Date().toISOString(),results:results.map(({_ids,...result})=>result),note:'Totales declarados por cada ruta. Las colecciones pueden solaparse; no se suman ni representan títulos únicos verificados.'};
}
