import {qualityLabel} from './title-info.js';
import {genreLabel} from './category-filter.js';
import {createPosterFrame,preparePoster} from './poster-art.js';
import {allowContent} from './content-filter.js';
const node=(tag,cls,text)=>{const value=document.createElement(tag);value.className=cls;if(text)value.textContent=text;return value;};
export function discoveryFocus(nodes,index,code){
 if(!nodes.length)return 0;index=Math.max(0,Math.min(index,nodes.length-1));const group=el=>Number(el.dataset.navrow||-1),current=nodes[index],row=group(current),same=nodes.filter(el=>group(el)===row),column=same.indexOf(current);
 if(code===37||code===39)return nodes.indexOf(same[Math.max(0,Math.min(same.length-1,column+(code===39?1:-1)))]);
 if(code===38||code===40){const rows=Array.from(new Set(nodes.map(group))).sort((a,b)=>a-b),at=rows.indexOf(row),next=rows[Math.max(0,Math.min(rows.length-1,at+(code===40?1:-1)))],targets=nodes.filter(el=>group(el)===next);return nodes.indexOf(targets[Math.min(column,targets.length-1)]);}
 return index;
}
export function renderDiscovery(panel,data,{browse,openItem,search,poster=(image,url)=>window.XuperStandalone.loadPoster(image,url)}){
 const grid=panel.querySelector('.xt-catalog-grid');grid.className='xt-catalog-grid xt-discovery-grid';grid.textContent='';panel.dataset.discovery='true';panel.querySelector('.xt-catalog-filters').hidden=true;panel.querySelector('footer').hidden=true;
 const action=(text,row,callback,cls='')=>{const button=node('button',cls,text);button.dataset.navrow=String(row);button.onclick=callback;return button;};
 const editorial=(data.editorial||[]).filter(allowContent),featured=editorial[0];
 const hero=node('section','xt-discovery-hero'),copy=node('div','xt-discovery-copy');hero.appendChild(copy);
 copy.appendChild(node('span','xt-discovery-kicker',data.root==='series'?'SERIES':data.root==='all'?'PELÍCULAS Y SERIES':'PELÍCULAS'));
 copy.appendChild(node('h2','',featured?.title||'Encuentra tu próxima historia'));
 copy.appendChild(node('p','xt-discovery-description',featured?.synopsis?String(featured.synopsis).slice(0,150):[featured?.year,...(featured?.genres||[]).slice(0,2).map(genreLabel)].filter(Boolean).join(' · ')));
 const actions=node('div','xt-discovery-actions');if(featured)actions.appendChild(action('Más información',0,()=>openItem(featured),'xt-discovery-primary'));actions.appendChild(action('Explorar catálogo',0,()=>browse({})));copy.appendChild(actions);
 if(featured?.poster){const art=node('img','xt-discovery-art'+(!featured.landscape&&!featured.backdrop?' xt-discovery-art-portrait':''));art.alt='';preparePoster(art,featured,true);poster(art,art.dataset.poster);hero.appendChild(art);}grid.appendChild(hero);
 const rows=(data.rows||[]).length?data.rows:[{title:'En el catálogo',items:editorial}];
 rows.slice(0,10).forEach((row,index)=>{const items=(row.items||[]).filter(allowContent);if(!items.length)return;const section=node('section','xt-discovery-section'),head=node('div','xt-showcase-row-head');head.appendChild(node('h2','',row.title));if(row.column)head.appendChild(action('Ver todo',index+1,()=>browse({column:String(row.column)}),'xt-showcase-all'));section.appendChild(head);const track=node('div','xt-discovery-track');section.appendChild(track);
 for(const item of items){const card=action('',index+1,()=>openItem(item),'xt-discovery-card');card.dataset.itemId=String(item.id);const {frame,image}=createPosterFrame(item);if(image.dataset.poster)poster(image,image.dataset.poster);card.appendChild(frame);card.appendChild(node('strong','',item.title));card.appendChild(node('small','',[item.year,qualityLabel(item)].filter(Boolean).join(' · ')));track.appendChild(card);}grid.appendChild(section);});
 if(!editorial.length&&!rows.some(row=>(row.items||[]).length)){const empty=node('section','xt-discovery-empty','No se pudo obtener una selección. Puedes explorar el catálogo o buscar un título.');empty.appendChild(action('Explorar catálogo',1,()=>browse({})));grid.appendChild(empty);}
}

export function scrollDiscovery(panel,element){
 const grid=panel.querySelector('.xt-discovery-grid');if(!grid||!grid.contains(element))return;
 const track=element.closest('.xt-discovery-track');
 for(const box of [track,grid]){if(!box)continue;const rect=element.getBoundingClientRect(),bounds=box.getBoundingClientRect(),scale=bounds.width/box.offsetWidth||1;
  if(rect.left<bounds.left)box.scrollLeft-=(bounds.left-rect.left)/scale+10;else if(rect.right>bounds.right)box.scrollLeft+=(rect.right-bounds.right)/scale+10;
  if(box===grid){if(rect.top<bounds.top)box.scrollTop-=(bounds.top-rect.top)/scale+12;else if(rect.bottom>bounds.bottom)box.scrollTop+=(rect.bottom-bounds.bottom)/scale+12;}
 }
}
