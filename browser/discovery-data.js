const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const keyOf=value=>typeof value==='object'?String(value.id):String(value);
const labelOf=value=>typeof value==='object'?String(value.name):String(value);
const preferred=[{name:'Turquía',aliases:['turkey','turkiye','turquia','tr','tur']},{name:'Corea del Sur',aliases:['korea','south korea','korea republic','corea del sur','kr','kor']},{name:'Estados Unidos',aliases:['united states','united states of america','usa','us','estados unidos']}];
export function countryChoices(values=[]){
 const seen=new Set(),all=values.filter(value=>{const key=keyOf(value);if(!key||seen.has(key))return false;seen.add(key);return true;});
 const featured=preferred.map(country=>{const match=all.find(value=>country.aliases.includes(fold(labelOf(value)))||country.aliases.includes(fold(keyOf(value))));return {id:match?keyOf(match):'',name:country.name,available:!!match};});
 return {featured,all:all.map(value=>({id:keyOf(value),name:preferred.find(country=>country.aliases.includes(fold(labelOf(value)))||country.aliases.includes(fold(keyOf(value))))?.name||labelOf(value)})).sort((a,b)=>a.name.localeCompare(b.name,'es'))};
}
export function discoveryCountries(values=[],items=[]){
 const countries=values.slice();for(const preferredCountry of preferred){if(countries.some(value=>preferredCountry.aliases.includes(fold(keyOf(value)))||preferredCountry.aliases.includes(fold(labelOf(value)))))continue;const observed=items.find(item=>preferredCountry.aliases.includes(fold(item.country)));if(observed)countries.push(String(observed.country).trim());}return countryChoices(countries);
}
export function dateKey(now=Date.now()){const date=new Date(now);return [date.getFullYear(),('0'+(date.getMonth()+1)).slice(-2),('0'+date.getDate()).slice(-2)].join('-');}
export function releaseDay(item){const value=String(item.releaseDate||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';const date=new Date(value+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value?value:'';}
export function recentReleases(items,period,now=Date.now()){
 const days=period==='week'?7:30,end=dateKey(now),start=new Date(now);start.setDate(start.getDate()-(days-1));const from=dateKey(start);
 return items.filter(item=>{const date=releaseDay(item);return date&&date>=from&&date<=end;}).slice().sort((a,b)=>releaseDay(b).localeCompare(releaseDay(a)));
}
export function createDiscoveryQuery(request,now=Date.now){
 const cache=new Map();
 return async function discover({root='movies',period='recent',fresh=false}={}){
  if(!['movies','series'].includes(root))throw new Error('Sección de descubrimiento no disponible');
  if(!['recent','week','month'].includes(period))period='recent';
  const key=[root,period,dateKey(now())].join(':');const hit=cache.get(key);if(!fresh&&hit&&now()-hit.at<600000)return Object.assign({},hit.data,{cached:true});
  const begun=now(),errors=[];const safe=async(method,payload,maxMs=9000,optional=false)=>{let timer;try{return await Promise.race([request(method,payload),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('discovery-timeout')),Math.max(1,Math.min(maxMs,begun+21000-now())));})]);}catch(_){if(!optional)errors.push(method);return null;}finally{clearTimeout(timer);}};
  const [columns,facets,home,composite]=await Promise.all([safe('catalogColumns',{root,fresh:true}),safe('catalogFilters',{root,fresh:true}),safe('home',{root,pageNum:1}),safe('portalHome',{root},3000,true)]);
  if(!columns&&!facets&&!home&&!composite)throw new Error('No se pudo consultar el catálogo del portal.');
  const novelty=(columns?.columns||[]).find(column=>/novedad|estreno|reciente|recent|new.?release|new.?arrival|ultim/.test(fold(column.name)));
  let sample=[],providerCollection=false;
  if(novelty){for(let pageNum=1;pageNum<=(period==='recent'?1:3);pageNum++){if(now()-begun>=18000)break;const page=await safe('catalogBrowse',{root,filters:{column:String(novelty.id)},pageNum,pageSize:24});if(!page)break;sample.push(...(page.items||[]));providerCollection=true;if(!page.hasMore)break;}}
  const editorialSeen=new Set();const editorial=[...(home?.items||[]),...(composite?.items||[])].filter(item=>item&&item.id&&!editorialSeen.has(String(item.id))&&editorialSeen.add(String(item.id)));
  if(!sample.length&&!providerCollection)sample=editorial.slice();
  const seen=new Set();sample=sample.filter(item=>item&&item.id&&!seen.has(String(item.id))&&seen.add(String(item.id)));
  const releases=recentReleases(sample,period==='recent'?'month':period,now());
  const dates=sample.filter(releaseDay).length;
  const latest=period==='recent'?(providerCollection?sample:releases):releases;
  const title=period==='week'?'Estrenos de los últimos 7 días':period==='month'?'Estrenos de los últimos 30 días':providerCollection?'Novedades recientes':'Estrenos recientes';
  const data={root,period,checkedAt:now(),day:dateKey(now()),latest:latest.slice(0,16),editorial:editorial.slice(0,12),portalEditorial:(composite?.items||[]).filter(item=>!(home?.items||[]).some(existing=>String(existing.id)===String(item.id))).slice(0,12),latestTitle:title,
   countryOptions:discoveryCountries(facets?.countries||[],editorial),genres:facets?.genres||[],columns:columns?.columns||[],shelves:composite?.shelves||[],sampled:sample.length,providerCollection,datesAvailable:dates>0,
   note:period!=='recent'?'Fechas de estreno informadas · '+sample.length+' títulos consultados; no es todo el catálogo.':providerCollection?'Colección de novedades del portal.':'Estrenos según fechas disponibles en la selección consultada.',metadataIncomplete:errors.length>0};
  cache.set(key,{at:now(),data});while(cache.size>12)cache.delete(cache.keys().next().value);return data;
 };
}
