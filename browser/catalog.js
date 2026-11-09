import {catalogFocus} from './catalog-navigation.js';
import {allowContent} from './content-filter.js';
import {openKeyboard} from './keyboard.js';
export function createCatalog(core){
  let panel=null,active=false,root='movies',remotePage=1,offset=0,items=[],total=0,loaded=0,hasMore=true,loading=false,run=0,keyboard=null,filterTimer=null;
  let failedPage=null,suspended=false,filterMenu=null,fullCatalog=true,totalKnown=false,localFilter=false;
  let focus=0,searchMode=false,posterObserver=null,focusNodes=[],selectedNode=null,previousRow=-1;const filters={text:'',column:'',genre:'',year:'',country:'',resolution:''};
  function status(text){if(panel)panel.querySelector('.xt-catalog-status').textContent=text;}
  function query(fetchPage=false){
    const token=++run;loading=true;status(fetchPage?'Consultando catálogo…':'Filtrando…');
    panel.querySelectorAll('footer button').forEach(button=>button.disabled=true);
    core.call(fullCatalog?'catalogFullPage':searchMode?'catalogSearch':fetchPage?'catalogPage':'catalogQuery',{root,search:searchMode,pageNum:fullCatalog?Math.floor(offset/36)+1:remotePage,offset,limit:36,filters:Object.assign({},filters)},(error,result)=>{
      if(!active||run!==token)return;loading=false;
      // A failed category/filter must never silently become an editorial feed.
      if(error&&!['explore','popular'].includes(root)&&fullCatalog&&offset===0&&!searchMode&&!Object.keys(filters).some(key=>!!filters[key])){fullCatalog=false;query(true);return;}
      panel.querySelector('.xt-catalog-retry').hidden=!error;if(error){failedPage=fetchPage?remotePage:null;panel.querySelector('.xt-catalog-prev').disabled=offset===0;status('No se pudo cargar. Puedes reintentar o volver. '+(error.message||String(error)));refreshControls();mark();return;}
      if(result.resolvedColumn&&!filters.column)filters.column=result.resolvedColumn;
      items=(result.items||[]).filter(allowContent);total=result.total||0;loaded=result.loaded||0;if(fetchPage||fullCatalog)hasMore=!!result.hasMore;
      totalKnown=!!result.totalKnown;localFilter=!!result.localFilter;
      render(result.facets||{});status(fullCatalog?((searchMode?'Búsqueda del proveedor':'Catálogo completo')+' · Página '+(Math.floor(offset/36)+1)+' · '+(totalKnown?total+' títulos según el portal':'Total no informado')+(localFilter?' · Filtro sobre esta página':'')+(result.metadataUnavailable?' · Algunos filtros no están disponibles':'')+(result.repeatedPage?' · El servidor repitió la página; no hay avance':'')):('Vista de portada · '+total+' resultados · '+loaded+' títulos cargados'+(hasMore&&!searchMode?' · puedes cargar más':'')));
    });
  }
  function search(){if(keyboard)return;keyboard=openKeyboard({title:'Buscar en '+({movies:'Películas',series:'Series',kids:'Infantil',anime:'Anime',featured:'Destacados'}[root]||'Catálogo'),value:filters.text,onChange:value=>{if(!active)return;filters.text=value;searchMode=false;offset=0;clearTimeout(filterTimer);filterTimer=setTimeout(()=>query(),400);},onSubmit:()=>{if(active&&filters.text.trim().length>=2){clearTimeout(filterTimer);searchMode=true;filters.column=filters.genre=filters.year=filters.country='';offset=0;query();}},onClose:()=>{keyboard=null;}});}
  function chooseSearch(){
    open('movies');
    const popup=document.createElement('div');popup.className='xt-filter-menu';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Elegir búsqueda');
    const title=document.createElement('h2');title.textContent='¿Qué quieres buscar?';popup.appendChild(title);
    const buttons=[['Películas','movies'],['Series','series']].map(([label,kind])=>{const button=document.createElement('button');button.textContent=label;button.onclick=()=>{filterMenu=null;popup.remove();open(kind);search();};popup.appendChild(button);return button;});
    panel.appendChild(popup);filterMenu={node:popup,buttons,index:0};buttons[0].classList.add('selected');
  }
  function controls(){return focusNodes;}
  function refreshControls(){focusNodes=Array.from(panel.querySelectorAll('button,select')).filter(node=>!node.disabled&&!node.hidden);previousRow=-1;}
  function mark(){
    const nodes=controls();focus=Math.max(0,Math.min(focus,nodes.length-1));const next=nodes[focus];
    if(next!==selectedNode){if(selectedNode)selectedNode.classList.remove('selected');if(next)next.classList.add('selected');selectedNode=next;}
    if(next&&next.classList.contains('xt-catalog-card')){
      const row=Number(next.dataset.row);if(row!==previousRow){
        previousRow=row;const grid=panel.querySelector('.xt-catalog-grid'),top=next.offsetTop,bottom=top+next.offsetHeight;
        if(top<grid.scrollTop)grid.scrollTop=top;else if(bottom>grid.scrollTop+grid.clientHeight)grid.scrollTop=bottom-grid.clientHeight;
      }
    }
  }
  function render(facets){
    const old=controls()[focus],oldFilter=old&&old.dataset.filter,oldClass=old&&!old.classList.contains('xt-catalog-card')?old.className:null;
    const grid=panel.querySelector('.xt-catalog-grid');if(posterObserver)posterObserver.disconnect();grid.textContent='';
    for(const item of items){
      const card=document.createElement('button');card.setAttribute('aria-label',item.title||'Ver detalle');card.className='xt-catalog-card';card.dataset.row=String(Math.floor(grid.children.length/6));
      const image=document.createElement('img');image.alt='';image.decoding='async';
      const title=document.createElement('strong');title.textContent=item.title;
      const meta=document.createElement('small');meta.textContent=[item.year,item.country,item.resolution||item.quality].filter(Boolean).join(' · ');
      card.appendChild(image);card.appendChild(title);card.appendChild(meta);grid.appendChild(card);
      if(item.poster){image.dataset.poster=item.poster;if(posterObserver)posterObserver.observe(image);else window.XuperStandalone.loadPoster(image,item.poster);}
      card.onclick=()=>{if(root==='series'&&!item.type&&!item.kind)item.kind='serie';suspend();if(window.__xuper){const index=__xuper.vod.findIndex(row=>row.id===item.id);if(index<0){item._portal=!item.streamUrl;__xuper.vod.push(item);__xuper.openDetail(__xuper.vod.length-1);}else __xuper.openDetail(index);}};
    }
    if(!items.length){const empty=document.createElement('div');empty.className='xt-catalog-empty';empty.innerHTML=fullCatalog&&localFilter?'<h2>Sin coincidencias en esta página</h2><p>Prueba Siguiente o selecciona Quitar filtros.</p>':'<h2>No encontramos títulos</h2><p>Prueba otra búsqueda o selecciona Quitar filtros.</p>';grid.appendChild(empty);}
    for(const [key,list] of [['column','columns'],['genre','genres'],['year','years'],['country','countries'],['resolution','resolutions']]){
      const select=panel.querySelector('[data-filter="'+key+'"]');select.textContent='';
      const values=(facets[list]||[]).slice().sort((a,b)=>String(typeof a==='object'?a.name:a).localeCompare(String(typeof b==='object'?b.name:b),'es',{numeric:true}));if(filters[key]&&!values.some(value=>(typeof value==='object'?value.id:value)===filters[key]))values.unshift(key==='column'?{id:filters[key],name:filters[key]}:filters[key]);
      for(const value of ['',...values]){const option=document.createElement('option');option.value=typeof value==='object'?value.id:value;option.textContent=(typeof value==='object'?value.name:value)||select.dataset.label;select.appendChild(option);}
      select.value=filters[key];select.hidden=key==='column'&&!fullCatalog;select.disabled=!values.length||fullCatalog&&key!=='resolution'&&searchMode;
    }
    panel.querySelector('.xt-catalog-prev').disabled=offset===0;panel.querySelector('.xt-catalog-next').disabled=fullCatalog?!hasMore:offset+36>=total;
    panel.querySelector('.xt-catalog-more').hidden=fullCatalog;panel.querySelector('.xt-catalog-more').disabled=!hasMore||searchMode;refreshControls();if(oldFilter)focus=controls().findIndex(node=>node.dataset.filter===oldFilter);else if(oldClass){const same=controls().indexOf(old);if(same>=0)focus=same;}mark();
  }
  function open(kind='movies'){
    if(panel)close();root=kind;items=[];failedPage=null;remotePage=1;offset=0;focus=0;hasMore=true;searchMode=false;fullCatalog=true;Object.keys(filters).forEach(key=>filters[key]='');active=true;
    panel=document.createElement('section');panel.id='xt-catalog';panel.className='xt-panel';
    panel.dataset.root=root;panel.innerHTML='<header><div><span class="xt-eyebrow">TU BIBLIOTECA</span><h1></h1></div><div><button class="xt-catalog-retry" hidden>Reintentar</button><button class="xt-catalog-search">Buscar</button><button class="xt-catalog-clear">Quitar filtros</button></div></header><nav class="xt-catalog-destinations" aria-label="Secciones del catálogo"><button data-root="movies">Películas</button><button data-root="series">Series</button><button data-root="explore">Explorar</button><button data-root="popular">Populares</button></nav><div class="xt-catalog-filters"><select data-filter="column" data-label="Todas las categorías"></select><select data-filter="genre" data-label="Género"></select><select data-filter="year" data-label="Año"></select><select data-filter="country" data-label="País"></select><select data-filter="resolution" data-label="Resolución · página"></select></div><p class="xt-catalog-status" role="status"></p><div class="xt-catalog-grid"></div><footer><button class="xt-catalog-prev">Anterior</button><button class="xt-catalog-next">Siguiente</button><button class="xt-catalog-more">Explorar más</button><span>OK Elegir · Flechas Navegar · Volver Inicio</span></footer>';
    panel.querySelector('h1').textContent=({movies:'Películas',series:'Series',anime:'Anime',kids:'Infantil',featured:'Destacados',explore:'Explorar',popular:'Búsquedas populares'})[root]||'Catálogo';
    panel.querySelectorAll('[data-root]').forEach(button=>{button.classList.toggle('current',button.dataset.root===root);button.onclick=()=>open(button.dataset.root);});
    document.getElementById('app').appendChild(panel);panel.querySelector('.xt-catalog-search').onclick=search;panel.querySelector('.xt-catalog-clear').onclick=()=>{Object.keys(filters).forEach(key=>filters[key]='');searchMode=false;offset=0;query();};
    if(window.IntersectionObserver)posterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){window.XuperStandalone.loadPoster(entry.target,entry.target.dataset.poster);posterObserver.unobserve(entry.target);}}),{root:panel.querySelector('.xt-catalog-grid')});
    panel.querySelectorAll('select').forEach(node=>{node.disabled=true;node.onchange=()=>{filters[node.dataset.filter]=node.value;if(node.dataset.filter==='column')filters.resolution='';if(node.dataset.filter!=='resolution')offset=0;query();};});
    panel.querySelector('.xt-catalog-prev').onclick=()=>{if(loading)return;offset=Math.max(0,offset-36);query();};
    panel.querySelector('.xt-catalog-next').onclick=()=>{if(loading)return;offset+=36;query();};
    panel.querySelector('.xt-catalog-more').onclick=()=>{if(loading)return;remotePage++;query(true);};panel.querySelector('.xt-catalog-retry').onclick=()=>{if(loading)return;if(failedPage!==null){remotePage=failedPage;query(true);}else query();};panel.querySelectorAll('footer button').forEach(button=>button.disabled=true);selectedNode=null;refreshControls();mark();query(true);
  }
  function suspend(){run++;loading=false;suspended=true;active=false;panel.hidden=true;}
  function resume(){if(!suspended||!panel)return false;suspended=false;active=true;panel.hidden=false;mark();return true;}
  function close(){suspended=false;filterMenu=null;active=false;run++;if(posterObserver)posterObserver.disconnect();posterObserver=null;if(keyboard)keyboard.close();keyboard=null;clearTimeout(filterTimer);if(panel)panel.remove();panel=null;}
  function handle(event){
    if(!active)return false;if([447,448,449].includes(event.keyCode))return false;
    if(keyboard){keyboard.handle(event);return true;}
    const code=event.keyCode;
    if(filterMenu){
      if([10009,461,27].includes(code)){filterMenu.node.remove();filterMenu=null;return true;}
      if(code===38||code===40)filterMenu.index=Math.max(0,Math.min(filterMenu.buttons.length-1,filterMenu.index+(code===40?1:-1)));
      if(code===13){filterMenu.buttons[filterMenu.index].click();return true;}
      filterMenu.buttons.forEach((b,i)=>b.classList.toggle('selected',i===filterMenu.index));filterMenu.buttons[filterMenu.index].scrollIntoView({block:'nearest'});return true;
    }
    if([10009,461,27].includes(code)){close();return true;}if(code===404){search();return true;}
    const nodes=controls();const node=nodes[focus];
    if(code===13&&node){if(node.tagName==='SELECT'){const popup=document.createElement('div');popup.className='xt-filter-menu';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',node.dataset.label);const heading=document.createElement('h2');heading.textContent=node.dataset.label;popup.appendChild(heading);const buttons=Array.from(node.options).map((option,index)=>{const b=document.createElement('button');b.textContent=option.textContent;b.onclick=()=>{node.selectedIndex=index;popup.remove();filterMenu=null;node.onchange();};popup.appendChild(b);return b;});panel.appendChild(popup);filterMenu={node:popup,buttons,index:Math.max(0,node.selectedIndex)};buttons.forEach((b,i)=>b.classList.toggle('selected',i===filterMenu.index));}else if(!node.disabled)node.click();return true;}
    focus=catalogFocus(nodes,focus,code);
    mark();return true;
  }
  return {open,close,resume,search,chooseSearch,handle,get active(){return active;}};
}
