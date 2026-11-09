const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
export function createShowcaseQuery(request){
 const cache=new Map();
 return async function({root='movies',fresh=false}={}){
  if(!['movies','series'].includes(root))throw Error('Sección no disponible');const hit=cache.get(root);if(!fresh&&hit&&Date.now()-hit.at<600000)return hit.value;
  const results=await Promise.all([request('home',{root,pageNum:1,fresh}),request('catalogColumns',{root,fresh})].map(promise=>promise.then(value=>({status:'fulfilled',value}),reason=>({status:'rejected',reason}))));
  const home=results[0].status==='fulfilled'?results[0].value:null,columns=results[1].status==='fulfilled'?results[1].value.columns||[]:[];
  if(!home)throw Error('No se pudo cargar el catálogo. Puedes reintentar o explorar las colecciones.');
  const seen=new Set(),items=(home.items||[]).filter(item=>item&&item.id&&!seen.has(String(item.id))&&seen.add(String(item.id))),groups=new Map();
  for(const item of home.items||[]){if(!item||!item.id)continue;const title=item.row||'En el catálogo';if(!groups.has(title))groups.set(title,[]);const row=groups.get(title);if(!row.some(existing=>String(existing.id)===String(item.id)))row.push(item);}
  const rows=Array.from(groups,([title,values])=>({title,items:values.slice(0,12),column:columns.find(column=>fold(column.name)===fold(title))?.id||null})).sort((a,b)=>Number(/prime|hbo|apple|hulu|paramount|netflix/i.test(b.title))-Number(/prime|hbo|apple|hulu|paramount|netflix/i.test(a.title))).slice(0,10);
  const value={root,rows,editorial:items.slice(0,12),columns,metadataIncomplete:results[1].status==='rejected'};cache.set(root,{at:Date.now(),value});return value;
 };
}
