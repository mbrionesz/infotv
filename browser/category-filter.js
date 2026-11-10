const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const aliases={accion:'action',aventura:'adventure',aventuras:'adventure',comedia:'comedy',terror:'horror',suspenso:'thriller',suspense:'thriller',romantico:'romance',romantica:'romance',familia:'family',fantastico:'fantasy',fantasia:'fantasy',animacion:'animation',documental:'documentary','ciencia ficcion':'science fiction','sci-fi':'science fiction',crimen:'crime',historia:'history',guerra:'war',occidental:'western',biografia:'biography'};
const country=value=>{const key=fold(value);return /^(turkey|turkiye|turquia|tr|tur)$/.test(key)?'turkey':/^(united states(?: of america)?|usa|us|estados unidos)$/.test(key)?'us':/^(korea|south korea|korea republic|corea del sur|kr|kor)$/.test(key)?'korea':key;};
const genre=value=>aliases[fold(value)]||fold(value);
export function collectionMatch(item,filters){
 const genres=Array.isArray(item.genres)?item.genres:[];
 if(filters.genre&&!genres.some(value=>genre(value)===genre(filters.genre)))return false;
 if(filters.year&&String(item.year||'').slice(0,4)!==String(filters.year))return false;
 if(filters.country&&country(item.country)!==country(filters.country))return false;
 if(filters.text&&!fold(item.title+' '+(item.alias||'')).includes(fold(filters.text)))return false;
 return true;
}
export function createCollectionFilter(request,now=Date.now){
 const scopes=new Map();
 return async function query({root,filters={},pageNum=1,fresh=false}){
  const size=36,page=Math.max(1,Number(pageNum)||1),start=(page-1)*size,key=JSON.stringify([root,filters.column,filters.genre||'',filters.year||'',filters.country||'',filters.text||'']);
  let state=scopes.get(key);if(fresh||!state||now()-state.at>600000||start<state.base){state={at:now(),next:1,base:0,matches:[],seen:new Set(),signatures:new Set(),ended:false,scanned:0,missing:0,source:null};scopes.delete(key);scopes.set(key,state);while(scopes.size>2)scopes.delete(scopes.keys().next().value);}
  if(state.busy){await state.busy;return query({root,filters,pageNum});}let release;state.busy=new Promise(resolve=>release=resolve);
  try{
  if(!state.matchFilters){const metadata=await request('catalogFilters',{root}).catch(()=>null);state.matchFilters=Object.assign({},filters);for(const [key,list] of [['genre','genres'],['year','years'],['country','countries']]){const option=(metadata?.[list]||[]).find(value=>typeof value==='object'&&String(value.id)===String(filters[key]));if(option)state.matchFilters[key]=option.name;}}
  let batches=0;const begun=now();
  while(!state.ended&&state.base+state.matches.length<start+size+1&&batches<3&&now()-begun<10000){
   const result=await request('catalogBrowse',{root,pageNum:state.next,pageSize:size,filters:{column:filters.column}});const rows=result.items||[],signature=JSON.stringify(rows.map(item=>String(item.id)));
   if(!rows.length||state.signatures.has(signature)){state.ended=true;break;}state.signatures.add(signature);state.source=result.source;state.next++;batches++;
   for(const item of rows){const id=String(item.id);if(state.seen.has(id))continue;state.seen.add(id);state.scanned++;if(filters.genre&&!(item.genres||[]).length||filters.year&&!/^\d{4}$/.test(String(item.year||'')))state.missing++;if(collectionMatch(item,state.matchFilters))state.matches.push(item);}
   if(!result.hasMore)state.ended=true;
  }
  const offset=start-state.base,items=state.matches.slice(offset,offset+size),totalFound=state.base+state.matches.length;
  const scanPending=!state.ended&&items.length<size;
  const response={items,total:state.ended&&!state.missing?totalFound:null,hasMore:!state.ended||totalFound>start+size,source:state.source,collectionFiltered:true,scanPending,scanned:state.scanned,matched:totalFound,missingMetadata:state.missing};
  // Keep recent result pages; older Back requests restart a correctly scoped scan.
  if(offset>360){const remove=Math.floor((offset-180)/size)*size;state.matches.splice(0,remove);state.base+=remove;}
  return response;
  }finally{state.busy=null;release();}
 };
}
const genreNames={action:'Acción',adventure:'Aventura',comedy:'Comedia',horror:'Terror',thriller:'Suspenso',romance:'Romance',family:'Familia',fantasy:'Fantasía',animation:'Animación',documentary:'Documental','science fiction':'Ciencia ficción',crime:'Crimen',history:'Historia',war:'Guerra',western:'Western',biography:'Biografía',drama:'Drama'};
export function genreLabel(value){return genreNames[genre(value)]||String(value);}
