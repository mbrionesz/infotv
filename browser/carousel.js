const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function carouselItems(data={}){
 const fresh=(data.rows||[]).filter(row=>/novedad|recient|recent|new release|new arrival|ultimo estreno/.test(fold(row.title)));
 const unique=values=>{const seen=new Set();return values.filter(item=>item&&item.id&&!seen.has(String(item.id))&&seen.add(String(item.id)));};
 const incoming=unique([].concat(...fresh.map(row=>row.items||[])));
 if(incoming.length)return {label:'Novedades del portal',basis:'provider-collection',items:incoming.slice(0,8)};
 const items=unique(data.editorial||[]),dated=items.filter(item=>/^\d{4}-\d{2}-\d{2}/.test(String(item.releaseDate||''))&&Number.isFinite(Date.parse(item.releaseDate)));
 if(dated.length>=2)return {label:'Estrenos · fecha de estreno',basis:'release-date',items:dated.sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate)).slice(0,8)};
 return {label:'Selecciones del portal',basis:'provider-order',items:items.slice(0,8)};
}
