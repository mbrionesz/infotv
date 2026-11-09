import {createCollectionFilter} from './category-filter.js';
import {createCatalogIndex} from './catalog-index.js';
export function createRemoteCatalog(request){
 const pages=new Map(),collectionFilter=createCollectionFilter(request);
 return async function query(payload){
  const root=payload.root||'movies',filters=payload.filters||{},search=!!payload.search;
  if(root==='all'){
   const results=await Promise.all(['movies','series'].map(kind=>query(Object.assign({},payload,{root:kind,pageSize:18,filters:Object.assign({},filters,{column:'',shelve:'',person:''})})).then(value=>({value}),error=>({error}))));
   const good=results.filter(result=>result.value).map(result=>result.value);if(!good.length)throw results[0].error;
   const merged=[],seen=new Set();for(let i=0;i<18;i++)for(const result of good){const item=result.items[i];if(item&&!seen.has(String(item.id))){seen.add(String(item.id));merged.push(item);}}
   const facets={columns:[]};for(const name of ['genres','years','countries','resolutions'])facets[name]=Array.from(new Map([].concat(...good.map(result=>result.facets[name]||[])).map(value=>[typeof value==='object'?String(value.id):String(value),value])).values());
   return {fullCatalog:true,items:merged,loaded:merged.length,total:good.reduce((sum,result)=>sum+(result.total||0),0),totalKnown:good.length===2&&good.every(result=>result.totalKnown),hasMore:good.some(result=>result.hasMore),metadataUnavailable:good.length<2||good.some(result=>result.metadataUnavailable),facets,source:'movies+series',collectionName:good.length<2?'Todo · una sección no respondió':'Todo · películas y series'};
  }
  const page=Math.max(1,Number(payload.pageNum)||1),size=Math.min(36,Number(payload.pageSize)||36);
  const remoteFilters={column:filters.column||'',genre:filters.genre||'',year:filters.year||'',country:filters.country||''};
  const scoped=!!(filters.column&&(filters.genre||filters.year||filters.country||filters.text));
  const result=scoped?await collectionFilter(payload):filters.person?await request('portalPersonItems',{root,personId:filters.person,pageNum:page,pageSize:size}):filters.shelve?await request('portalShelve',{root,shelveId:filters.shelve,pageNum:page,pageSize:size}):await request(search?'catalogSearchPage':'catalogBrowse',search?{root,text:filters.text,pageNum:page,pageSize:size}:{root,filters:remoteFilters,pageNum:page,pageSize:size});
  const scope=JSON.stringify([root,size,search?String(filters.text||''):[remoteFilters,filters.person||'',filters.shelve||''],search]);
  const signature=JSON.stringify((result.items||[]).map(item=>String(item.id)));
  const repeatedPage=page>1&&(result.items||[]).length>0&&pages.get(scope+':'+(page-1))===signature;
  pages.set(scope+':'+page,signature);while(pages.size>128)pages.delete(pages.keys().next().value);
  const metadata=await Promise.all(['catalogColumns','catalogFilters'].map(method=>request(method,{root}).catch(()=>null)));
  const index=createCatalogIndex();index.add(root,result.items||[]);
  const localFilters={resolution:filters.resolution||'',text:scoped||search?'':filters.text||''};
  const current=index.query(root,{limit:size,filters:localFilters});
  return {fullCatalog:true,remoteSearch:search,collectionFiltered:!!result.collectionFiltered,scanPending:!!result.scanPending,scanned:result.scanned||0,matched:result.matched||0,missingMetadata:result.missingMetadata||0,collectionName:result.collectionName||(filters.person?'Filmografía':''),externalCollection:!!(filters.person||filters.shelve),categoryFallback:result.categoryFallback||null,countryRequested:result.countryRequested||null,countryUsed:result.countryUsed||null,countryAlternativeSource:result.countryAlternativeSource||null,resolvedColumn:result.resolvedColumn||null,source:result.source||null,totalField:result.totalField||null,items:current.items,total:result.total,totalKnown:result.total!==null&&result.total!==undefined,
   loaded:(result.items||[]).length,pageNum:page,hasMore:!!result.hasMore&&!repeatedPage&&((result.items||[]).length>0||!!result.scanPending),repeatedPage,
   localFilter:!!(localFilters.resolution||localFilters.text||result.typeFiltered),
   facets:Object.assign({},current.facets,metadata[1]||{},{columns:metadata[0]&&metadata[0].columns||[]}),
   metadataUnavailable:metadata.some(value=>!value)};
 };
}
