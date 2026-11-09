// Tracks first observation on this TV, never invents a provider addition date.
export function updateCarousel(previous,data,now=Date.now()){
 const safe=item=>{const copy={};for(const key of ['id','title','poster','posterAlternates','landscape','backdrop','type','kind','year','genres','quality','resolution','releaseDate','portalDates','country','score','synopsis','portal','_portal','series'])if(item[key]!==undefined)copy[key]=item[key];return copy;};
 const byId=new Map();for(const item of [...(data.editorial||[]),...[].concat(...(data.rows||[]).map(row=>row.items||[]))])if(item&&item.id&&!byId.has(String(item.id)))byId.set(String(item.id),safe(item));
 const seen=Object.assign(Object.create(null),previous&&previous.seen||{}),initial=!previous,old=previous&&Array.isArray(previous.slots)?previous.slots:[],incoming=[];
 for(const [id,item]of byId){if(!Object.prototype.hasOwnProperty.call(seen,id)){seen[id]=now;if(!initial)incoming.push(Object.assign({},item,{carouselDetectedAt:now}));}}
 let slots;
 if(initial){const order=data.preferred||data.editorial||Array.from(byId.values());slots=order.filter(item=>item&&byId.has(String(item.id))).slice(0,3).map(item=>Object.assign({},safe(item),{carouselDetectedAt:null}));}
 else{const retained=old.map(item=>Object.assign({},byId.get(String(item.id))||item,{carouselDetectedAt:item.carouselDetectedAt||null}));slots=[...incoming,...retained].filter((item,i,list)=>list.findIndex(other=>String(other.id)===String(item.id))===i).slice(0,3);if(slots.length<3)for(const item of byId.values()){if(!slots.some(other=>String(other.id)===String(item.id)))slots.push(Object.assign({},safe(item),{carouselDetectedAt:null}));if(slots.length===3)break;}}
 // Bound detection history; selected cards stay even outside the current sample.
 const entries=Object.entries(seen).sort((a,b)=>b[1]-a[1]).slice(0,20000),bounded=Object.create(null);for(const [id,at]of entries)bounded[id]=at;
 return {version:1,baselineAt:previous&&previous.baselineAt||now,checkedAt:now,seen:bounded,slots};
}
