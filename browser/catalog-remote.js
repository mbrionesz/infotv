import {createCatalogIndex} from './catalog-index.js';
export function createRemoteCatalog(request){
 const pages=new Map();
 return async function query(payload){
  const root=payload.root||'movies',filters=payload.filters||{},search=!!payload.search;
  const page=Math.max(1,Number(payload.pageNum)||1),size=36;
  const remoteFilters={column:filters.column||'',genre:filters.genre||'',year:filters.year||'',country:filters.country||''};
  const result=await request(search?'catalogSearchPage':'catalogBrowse',search?{root,text:filters.text,pageNum:page,pageSize:size}:{root,filters:remoteFilters,pageNum:page,pageSize:size});
  const scope=JSON.stringify([root,search?String(filters.text||''):remoteFilters,search]);
  const signature=JSON.stringify((result.items||[]).map(item=>String(item.id)));
  const repeatedPage=page>1&&(result.items||[]).length>0&&pages.get(scope+':'+(page-1))===signature;
  pages.set(scope+':'+page,signature);while(pages.size>128)pages.delete(pages.keys().next().value);
  const metadata=await Promise.all(['catalogColumns','catalogFilters'].map(method=>request(method,{root}).catch(()=>null)));
  const index=createCatalogIndex();index.add(root,result.items||[]);
  const localFilters={resolution:filters.resolution||'',text:search?'':filters.text||''};
  const current=index.query(root,{limit:60,filters:localFilters});
  return {fullCatalog:true,remoteSearch:search,items:current.items,total:result.total,totalKnown:result.total!==null&&result.total!==undefined,
   loaded:(result.items||[]).length,pageNum:page,hasMore:!!result.hasMore&&!repeatedPage,repeatedPage,
   localFilter:!!(localFilters.resolution||localFilters.text),
   facets:Object.assign({},current.facets,metadata[1]||{},{columns:metadata[0]&&metadata[0].columns||[]}),
   metadataUnavailable:metadata.some(value=>!value)};
 };
}
