import {createPosterFrame,preparePoster} from './poster-art.js';
import {allowContent} from './content-filter.js';
const node=(tag,cls,text)=>{const value=document.createElement(tag);value.className=cls;if(text)value.textContent=text;return value;};
export function discoveryFocus(nodes,index,code){
 if(!nodes.length)return 0;index=Math.max(0,Math.min(index,nodes.length-1));const group=el=>Number(el.dataset.navrow||-1),current=nodes[index],row=group(current),same=nodes.filter(el=>group(el)===row),column=same.indexOf(current);
 if(code===37||code===39)return nodes.indexOf(same[Math.max(0,Math.min(same.length-1,column+(code===39?1:-1)))]);
 if(code===38||code===40){const rows=Array.from(new Set(nodes.map(group))).sort((a,b)=>a-b),at=rows.indexOf(row),next=rows[Math.max(0,Math.min(rows.length-1,at+(code===40?1:-1)))],targets=nodes.filter(el=>group(el)===next);return nodes.indexOf(targets[Math.min(column,targets.length-1)]);}
 return index;
}
export function renderDiscovery(panel,data,{browse,period,openItem,search,poster=(image,url)=>window.XuperStandalone.loadPoster(image,url)}){
 const grid=panel.querySelector('.xt-catalog-grid');grid.className='xt-catalog-grid xt-discovery-grid';grid.textContent='';panel.dataset.discovery='true';panel.querySelector('.xt-catalog-filters').hidden=true;panel.querySelector('footer').hidden=true;
 const action=(text,row,callback,cls='')=>{const button=node('button',cls,text);button.dataset.navrow=String(row);button.onclick=callback;return button;};
 const latest=(data.latest||[]).filter(allowContent),editorial=(data.editorial||[]).filter(allowContent),featured=latest[0]||editorial[0];
 const hero=node('section','xt-discovery-hero'),copy=node('div','xt-discovery-copy');hero.appendChild(copy);
 copy.appendChild(node('span','xt-discovery-kicker',latest.length?data.latestTitle:'EXPLORA EL CATÁLOGO'));
 copy.appendChild(node('h2','',featured?.title||(data.root==='series'?'Tu próxima serie':'Tu próxima película')));
 copy.appendChild(node('p','xt-discovery-description',featured?.synopsis?String(featured.synopsis).slice(0,160):[featured?.year,...(featured?.genres||[]).slice(0,2)].filter(Boolean).join(' · ')));
 const heroActions=node('div','xt-discovery-actions');if(featured)heroActions.appendChild(action('Ver ficha',0,()=>openItem(featured),'xt-discovery-primary'));
 heroActions.appendChild(action(data.root==='series'?'Buscar una serie':'Buscar una película',0,search));heroActions.appendChild(action('Catálogo completo',0,()=>browse({})));copy.appendChild(heroActions);
 if(featured?.poster){const art=node('img','xt-discovery-art'+(!featured.landscape&&!featured.backdrop?' xt-discovery-art-portrait':''));art.alt='';preparePoster(art,featured,true);poster(art,art.dataset.poster);hero.appendChild(art);}grid.appendChild(hero);
 const periods=node('nav','xt-discovery-periods');periods.setAttribute('aria-label','Novedades y estrenos');for(const [value,label] of [['recent','Novedades'],['week','Últimos 7 días'],['month','Últimos 30 días']]){const button=action(label,1,()=>period(value));button.classList.toggle('current',value===data.period);button.setAttribute('aria-pressed',String(value===data.period));periods.appendChild(button);}grid.appendChild(periods);
 function shelf(title,items,row){const section=node('section','xt-discovery-section');section.appendChild(node('h2','',title));const track=node('div','xt-discovery-track');section.appendChild(track);items.forEach(item=>{const card=action('',row,()=>openItem(item),'xt-discovery-card');card.dataset.itemId=String(item.id);const {frame,image}=createPosterFrame(item);if(image.dataset.poster)poster(image,image.dataset.poster);card.appendChild(frame);card.appendChild(node('strong','',item.title));card.appendChild(node('small','',[item.year,item.country].filter(Boolean).join(' · ')));track.appendChild(card);});grid.appendChild(section);return section;}
 const current=shelf(data.latestTitle||'Novedades recientes',latest,2);
 if(!latest.length)current.appendChild(node('p','xt-discovery-empty',data.period==='recent'?(data.providerCollection?'No hay novedades disponibles en esta colección.':'El portal no informó novedades con fecha. Puedes explorar el catálogo completo.'):data.datesAvailable?'No hay estrenos de este período en la selección consultada.':'El portal no informa fechas verificables para este período.'));
 current.appendChild(node('p','xt-discovery-note',data.note||''));
 const countries=node('section','xt-discovery-section');countries.appendChild(node('h2','','Explorar por país'));const tiles=node('div','xt-discovery-track xt-discovery-countries');countries.appendChild(tiles);
 const choices=data.countryOptions||{featured:[],all:[]};const countryList=[...(choices.featured||[]),...(choices.all||[]).filter(value=>!(choices.featured||[]).some(item=>item.id===value.id)).slice(0,5)];
 countryList.forEach(country=>{const tile=action('',3,()=>browse({country:country.id}),'xt-discovery-country');tile.disabled=country.available===false;tile.appendChild(node('strong','',country.name));tile.appendChild(node('small','',tile.disabled?'No informado por el portal':data.root==='series'?'Explorar series':'Explorar películas'));tiles.appendChild(tile);});
 countries.appendChild(action('Todos los países',4,()=>browse({},'country'),'xt-discovery-link'));grid.appendChild(countries);
 const genres=node('section','xt-discovery-section');genres.appendChild(node('h2','','Encuentra tu género'));const genreTrack=node('div','xt-discovery-track xt-discovery-genres');genres.appendChild(genreTrack);
 (data.genres||[]).slice(0,16).forEach(genre=>{const value=typeof genre==='object'?genre.id:genre,label=typeof genre==='object'?genre.name:genre;genreTrack.appendChild(action(String(label),5,()=>browse({genre:String(value)})));});genres.appendChild(action('Todos los géneros',5,()=>browse({},'genre'),'xt-discovery-link'));grid.appendChild(genres);
 const collections=(data.columns||[]).slice().sort((a,b)=>Number(/netflix|hbo|disney|prime|apple|hulu|paramount/i.test(b.name))-Number(/netflix|hbo|disney|prime|apple|hulu|paramount/i.test(a.name)));
 if(collections.length){const section=node('section','xt-discovery-section');section.appendChild(node('h2','','Colecciones del portal'));const track=node('div','xt-discovery-track xt-discovery-genres');collections.slice(0,16).forEach(column=>track.appendChild(action(column.name,6,()=>browse({column:String(column.id)}),'xt-discovery-collection')));section.appendChild(track);section.appendChild(action('Todas las colecciones',6,()=>browse({},'column'),'xt-discovery-link'));grid.appendChild(section);}
 if(editorial.length)shelf('Para descubrir',editorial,7);
}
export function scrollDiscovery(panel,element){
 const grid=panel.querySelector('.xt-discovery-grid');if(!grid||!grid.contains(element))return;
 const track=element.closest('.xt-discovery-track');
 for(const box of [track,grid]){if(!box)continue;const rect=element.getBoundingClientRect(),bounds=box.getBoundingClientRect(),scale=bounds.width/box.offsetWidth||1;
  if(rect.left<bounds.left)box.scrollLeft-=(bounds.left-rect.left)/scale+10;else if(rect.right>bounds.right)box.scrollLeft+=(rect.right-bounds.right)/scale+10;
  if(box===grid){if(rect.top<bounds.top)box.scrollTop-=(bounds.top-rect.top)/scale+12;else if(rect.bottom>bounds.bottom)box.scrollTop+=(rect.bottom-bounds.bottom)/scale+12;}
 }
}
