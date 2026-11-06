const fold=value=>String(value||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function resolutionOf(item){const value=String(item.resolution||item.quality||'');if(/4k|uhd|2160/i.test(value))return '4K UHD';if(/1080|full.?hd|fhd/i.test(value))return '1080p';if(/720/i.test(value))return '720p';return /^\d{1,2}$/.test(value)?'':value;}
export function createCatalogIndex(){
  const roots=new Map();
  function bucket(root){if(!roots.has(root))roots.set(root,new Map());return roots.get(root);}
  function add(root,items){
    const data=bucket(root);let added=0;
    for(const item of items||[]){if(!item||!item.id)continue;if(!data.has(String(item.id)))added++;data.set(String(item.id),item);}
    return added;
  }
  function query(root,{offset=0,limit=36,filters={}}={}){
    const data=bucket(root),matches=[],facets={genres:new Set(),years:new Set(),countries:new Set(),resolutions:new Set()};
    const needle=fold(filters.text);
    for(const item of data.values()){
      const genres=Array.isArray(item.genres)?item.genres:[];
      const resolution=resolutionOf(item);
      genres.forEach(value=>value&&facets.genres.add(value));
      if(item.year&&/^\d{4}$/.test(String(item.year)))facets.years.add(String(item.year));
      if(item.country)facets.countries.add(item.country);if(resolution)facets.resolutions.add(String(resolution));
      if(needle&&fold(item.title+' '+(item.alias||'')).indexOf(needle)<0)continue;
      if(filters.genre&&!genres.includes(filters.genre))continue;
      if(filters.year&&String(item.year)!==filters.year)continue;
      if(filters.country&&item.country!==filters.country)continue;
      if(filters.resolution&&String(resolution)!==filters.resolution)continue;
      matches.push(item);
    }
    const start=Math.max(0,Number(offset)||0),size=Math.min(60,Math.max(1,Number(limit)||36));
    return {items:matches.slice(start,start+size),total:matches.length,loaded:data.size,offset:start,
      facets:Object.keys(facets).reduce((out,key)=>{out[key]=Array.from(facets[key]).sort();return out;},{})};
  }
  return {add,query};
}
