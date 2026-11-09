import {createCarouselAuto} from './carousel-auto.js';
import {qualityLabel} from './title-info.js';
import {genreLabel} from './category-filter.js';
import {createPosterFrame} from './poster-art.js';
import {countryChoices,dateKey} from './discovery-data.js';
import {renderDiscovery,discoveryFocus,scrollDiscovery} from './catalog-discovery.js';
import {catalogFocus} from './catalog-navigation.js';
import {allowContent} from './content-filter.js';
import {openKeyboard} from './keyboard.js';
export function createCatalog(core){
  let carouselAuto=null;function stopCarousel(){if(carouselAuto)carouselAuto.stop();carouselAuto=null;}
  const showcases=new Map();let latestFacets={},lastResult=null;
  let scanPending=false,collectionFiltered=false,scanned=0,matched=0,missingMetadata=0,filterPanelOpen=false,draftFilters=null,focusResults=false;
  let panel=null,active=false,root='movies',remotePage=1,offset=0,items=[],total=0,loaded=0,hasMore=true,loading=false,run=0,keyboard=null,filterTimer=null;
  let discoveryMode=false,discoveryPeriod='recent',discoveryTimer=null,discoveryCheckedAt=0,discoveryDay='',pendingFilter='';
  let failedPage=null,suspended=false,filterMenu=null,fullCatalog=true,totalKnown=false,localFilter=false;
  let focus=0,searchMode=false,posterObserver=null,focusNodes=[],selectedNode=null,previousRow=-1;const filters={text:'',column:'',genre:'',year:'',country:'',resolution:'',shelve:'',person:''};
  function status(text){if(panel)panel.querySelector('.xt-catalog-status').textContent=text;}
  function query(fetchPage=false,force=false){
    if(panel.dataset.customTitle&&!filters.person){panel.querySelector('h1').textContent=root==='series'?'Series':root==='movies'?'Películas':'Catálogo';delete panel.dataset.customTitle;}
    const token=++run;loading=true;status(fetchPage?'Consultando catálogo…':'Filtrando…');
    panel.querySelectorAll('footer button').forEach(button=>button.disabled=true);
    core.call(discoveryMode?'catalogDiscover':fullCatalog?'catalogFullPage':searchMode?'catalogSearch':fetchPage?'catalogPage':'catalogQuery',{root,period:discoveryPeriod,fresh:force,search:searchMode,pageNum:fullCatalog?Math.floor(offset/36)+1:remotePage,offset,limit:36,filters:Object.assign({},filters)},(error,result)=>{
      if(!active||run!==token)return;loading=false;
      // A failed category/filter must never silently become an editorial feed.
      if(error&&!discoveryMode&&root!=='all'&&!['explore','popular'].includes(root)&&fullCatalog&&offset===0&&!searchMode&&!Object.keys(filters).some(key=>!!filters[key])){fullCatalog=false;query(true);return;}
      panel.querySelector('.xt-catalog-retry').hidden=!error;if(error){failedPage=fetchPage?remotePage:null;panel.querySelector('.xt-catalog-prev').disabled=offset===0;status('No se pudo cargar. Puedes reintentar o volver. '+(error.message||String(error)));refreshControls();mark();return;}
      if(discoveryMode){
        const initial=discoveryCheckedAt===0,old=controls()[focus],oldId=old&&old.dataset.itemId,oldText=old&&old.textContent;discoveryCheckedAt=Date.now();discoveryDay=result.day||dateKey();
        if(posterObserver)posterObserver.disconnect();
        showcases.set(root,result);drawShowcase(result);
        status(result.metadataIncomplete?'Algunas colecciones no están disponibles.':'');refreshControls();const restored=controls().findIndex(node=>oldId?node.dataset.itemId===oldId:node.textContent===oldText);if(initial){panel.querySelector('.xt-catalog-grid').scrollTop=0;const first=controls().findIndex(node=>node.dataset.navrow==='0');if(first>=0)focus=first;}else if(restored>=0)focus=restored;mark();return;
      }
      if(result.resolvedColumn&&!filters.column)filters.column=result.resolvedColumn;
      scanPending=!!result.scanPending;collectionFiltered=!!result.collectionFiltered;scanned=result.scanned||0;matched=result.matched||0;missingMetadata=result.missingMetadata||0;
      items=(result.items||[]).filter(allowContent);total=result.total||0;loaded=result.loaded||0;if(fetchPage||fullCatalog)hasMore=!!result.hasMore;
      totalKnown=!!result.totalKnown;localFilter=!!result.localFilter;
      lastResult=result;render(result.facets||{},result.externalCollection);if(showcases.has(root)&&!filters.person&&!filters.shelve)drawShowcase(showcases.get(root),items,result);status(fullCatalog?((searchMode?'Búsqueda del proveedor':result.collectionName?result.collectionName:filters.column?((result.facets&&result.facets.columns||[]).find(column=>String(column.id)===String(filters.column))||{}).name||'Colección del portal':'Catálogo general')+(filters.genre?' · '+(panel.querySelector('[data-filter=genre]').selectedOptions[0]?.textContent||genreLabel(filters.genre)):'')+(filters.year?' · '+filters.year:'')+' · Página '+(Math.floor(offset/36)+1)+' · '+(totalKnown?total+' títulos según el portal':'Total no informado')+(localFilter?' · Filtro sobre esta página':'')+(result.metadataUnavailable?' · Algunos filtros no están disponibles':'')+(collectionFiltered?' · '+scanned+' títulos revisados'+(!totalKnown?' · '+matched+' coincidencias encontradas':''):'')+(result.missingMetadata?' · Algunos títulos no informan género o año':'')+(result.repeatedPage?' · El servidor repitió la página; no hay avance':'')):('Vista de portada · '+total+' resultados · '+loaded+' títulos cargados'+(hasMore&&!searchMode?' · puedes cargar más':'')));
    });
  }
  function openItem(item){if(root==='series'&&!item.type&&!item.kind)item.kind='serie';suspend();if(window.__xuper){let index=__xuper.vod.findIndex(row=>String(row.id)===String(item.id));if(index<0){item._portal=!item.streamUrl;index=__xuper.vod.push(item)-1;}__xuper.openDetail(index);}}
  function applyQuick(values){open(root,{browse:true,filters:Object.assign({},values)});}
  function chooseFacet(key){const values=latestFacets[key==='column'?'columns':key==='year'?'years':'genres']||[],labels={column:'Colecciones',year:'Año',genre:'Género'};if(!values.length)return;const popup=document.createElement('div');popup.className='xt-filter-menu';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',labels[key]);const heading=document.createElement('h2');heading.textContent=labels[key];popup.appendChild(heading);const buttons=['',...values].map(value=>{const id=String(typeof value==='object'?value.id:value),label=typeof value==='object'?value.name:value,button=document.createElement('button');button.textContent=id?(key==='genre'?genreLabel(label):label):key==='year'?'Todos los años':'Todas';button.onclick=()=>{filterMenu=null;popup.remove();applyQuick(Object.assign({},filters,{[key]:id}));};popup.appendChild(button);return button;});panel.appendChild(popup);filterMenu={node:popup,buttons,index:0};buttons[0].classList.add('selected');}
  function drawShowcase(data,results,result={}){stopCarousel();const old=selectedNode,oldId=old&&old.dataset.itemId,oldClass=old&&old.className,hero=panel.querySelector('.xt-discovery-hero'),initialItemId=hero&&hero.dataset.itemId;if(posterObserver)posterObserver.disconnect();latestFacets=result.facets||data.facets||{columns:data.columns||[]};
    const showcase=renderDiscovery(panel,data,{results,filters:Object.assign({},filters),facets:latestFacets,scanPending:!!result.scanPending,missingMetadata:result.missingMetadata||0,initialItemId,library:window.__xuper&&__xuper.library?__xuper.library():null,poster:(image,url)=>{image.dataset.poster=url;if(image.dataset.posterSize==='hero'||!posterObserver)window.XuperStandalone.loadPoster(image,url);else posterObserver.observe(image);},browse:values=>open(root,{browse:!!Object.keys(values).length,filters:values}),applyFilters:applyQuick,chooseFacet,search,openItem,resumeItem:item=>{suspend();__xuper.resumeContent(item);},manage:kind=>{suspend();__xuper.openCollection(kind==='saved'?'favs':'history');}});
    if(showcase&&showcase.advance&&!Array.isArray(results)){const ownPanel=panel;carouselAuto=createCarouselAuto({advance:showcase.advance,canAdvance:()=>{if(!active||panel!==ownPanel||document.hidden||window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches||keyboard||filterMenu||filterPanelOpen||window.__xuper&&__xuper.state.screen!=='home')return false;const hero=showcase.hero,grid=panel.querySelector('.xt-discovery-grid'),selected=selectedNode;return !!hero&&!hero.querySelector('img').__xuperArt?.pending&&grid.scrollTop<40&&!(selected&&selected.closest('.xt-carousel-controls'));}});carouselAuto.start();}
    refreshControls();let restored=oldId?controls().findIndex(node=>node.dataset.itemId===oldId):-1;if(restored<0&&oldClass)restored=controls().findIndex(node=>node.className===oldClass);if(restored<0&&filters.genre)restored=controls().findIndex(node=>node.dataset.genre===filters.genre);if(restored<0)restored=controls().findIndex(node=>node.dataset.navrow==='0');focus=Math.max(0,restored);mark();
  }
  function search(){if(discoveryMode){const kind=root;open(kind,{browse:true});}if(filterPanelOpen)closeFilters();if(keyboard)return;
    function setValue(value){filters.text=value;const valid=value.trim().length>=2;searchMode=valid&&!filters.column;if(searchMode)filters.shelve=filters.person=filters.genre=filters.year=filters.country=filters.resolution='';offset=0;return valid;}
    keyboard=openKeyboard({title:filters.column?'Buscar en esta colección':'Buscar en '+(root==='series'?'Series':root==='all'?'Todo':'Películas'),value:filters.text,onChange:value=>{if(!active)return;const valid=setValue(value);clearTimeout(filterTimer);if(valid||!value)filterTimer=setTimeout(()=>query(),400);},onSubmit:()=>{if(active&&filters.text.trim().length>=2){clearTimeout(filterTimer);setValue(filters.text);query();}},onClose:()=>{keyboard=null;}});
  }
  function openFilters(){if(discoveryMode||loading)return;filterPanelOpen=true;draftFilters=Object.assign({},filters);panel.querySelector('.xt-catalog-filters').hidden=false;panel.querySelectorAll('select').forEach(select=>select.value=draftFilters[select.dataset.filter]||'');refreshControls();focus=0;mark();}
  function closeFilters(){filterPanelOpen=false;draftFilters=null;panel.querySelector('.xt-catalog-filters').hidden=true;refreshControls();focus=controls().indexOf(panel.querySelector('.xt-catalog-filter-toggle'));mark();}

  function chooseSearch(){open('all',{browse:true});search();}
  function controls(){return focusNodes;}
  function refreshControls(){focusNodes=Array.from((filterPanelOpen?panel.querySelector('.xt-catalog-filters'):panel).querySelectorAll('button,select')).filter(node=>!node.disabled&&!node.hidden&&node.offsetParent!==null);previousRow=-1;}
  function mark(){
    const nodes=controls();focus=Math.max(0,Math.min(focus,nodes.length-1));const next=nodes[focus];
    if(next!==selectedNode){if(selectedNode)selectedNode.classList.remove('selected');if(next)next.classList.add('selected');selectedNode=next;}
    if(panel.dataset.cinematic==='true'&&next){scrollDiscovery(panel,next);return;}
    if(next&&next.classList.contains('xt-catalog-card')){
      const row=Number(next.dataset.row);if(row!==previousRow){
        previousRow=row;const grid=panel.querySelector('.xt-catalog-grid'),top=next.offsetTop,bottom=top+next.offsetHeight;
        if(top<grid.scrollTop)grid.scrollTop=top;else if(bottom>grid.scrollTop+grid.clientHeight)grid.scrollTop=bottom-grid.clientHeight;
      }
    }
  }
  function render(facets,externalCollection=false){stopCarousel();
    panel.dataset.cinematic='false';
    panel.querySelector('.xt-catalog-grid').className='xt-catalog-grid';panel.querySelector('.xt-catalog-filters').hidden=!filterPanelOpen;panel.querySelector('footer').hidden=false;panel.dataset.discovery='false';panel.querySelector('.xt-catalog-filter-toggle').hidden=false;
    const old=controls()[focus],oldFilter=old&&old.dataset.filter,oldClass=old&&!old.classList.contains('xt-catalog-card')?old.className:null;
    const grid=panel.querySelector('.xt-catalog-grid');if(posterObserver)posterObserver.disconnect();grid.textContent='';
    for(const item of items){
      const card=document.createElement('button');card.setAttribute('aria-label',item.title||'Ver detalle');card.className='xt-catalog-card';card.dataset.row=String(Math.floor(grid.children.length/6));
      const {frame,image}=createPosterFrame(item);
      const title=document.createElement('strong');title.textContent=item.title;
      const meta=document.createElement('small');meta.textContent=[item.year,qualityLabel(item)].filter(Boolean).join(' · ');
      card.appendChild(frame);card.appendChild(title);card.appendChild(meta);grid.appendChild(card);
      if(image.dataset.poster){if(posterObserver)posterObserver.observe(image);else window.XuperStandalone.loadPoster(image,image.dataset.poster);}
      card.onclick=()=>{if(root==='series'&&!item.type&&!item.kind)item.kind='serie';suspend();if(window.__xuper){const index=__xuper.vod.findIndex(row=>row.id===item.id);if(index<0){item._portal=!item.streamUrl;__xuper.vod.push(item);__xuper.openDetail(__xuper.vod.length-1);}else __xuper.openDetail(index);}};
    }
    if(!items.length){const empty=document.createElement('div');empty.className='xt-catalog-empty';empty.innerHTML=collectionFiltered&&!scanPending&&missingMetadata?'<h2>Faltan datos para estos filtros</h2><p>El portal no informa género o año de todos los títulos. Quita un filtro para explorar la colección.</p>':scanPending?'<h2>Buscando en esta colección</h2><p>Selecciona Seguir buscando para revisar más títulos.</p>':fullCatalog&&localFilter?'<h2>Sin coincidencias en esta página</h2><p>Prueba Siguiente o selecciona Quitar filtros.</p>':'<h2>No encontramos títulos</h2><p>Prueba otra búsqueda o selecciona Quitar filtros.</p>';grid.appendChild(empty);}
    for(const [key,list] of [['column','columns'],['genre','genres'],['year','years'],['country','countries'],['resolution','resolutions']]){
      const select=panel.querySelector('[data-filter="'+key+'"]');select.textContent='';
      const values=(facets[list]||[]).slice().sort((a,b)=>String(typeof a==='object'?a.name:a).localeCompare(String(typeof b==='object'?b.name:b),'es',{numeric:true}));if(filters[key]&&!values.some(value=>(typeof value==='object'?value.id:value)===filters[key]))values.unshift(key==='column'?{id:filters[key],name:filters[key]}:filters[key]);
      for(const value of ['',...values]){const option=document.createElement('option');option.value=typeof value==='object'?value.id:value;option.textContent=(typeof value==='object'?value.name:value)||select.dataset.label;if(key==='genre'&&value)option.textContent=genreLabel(typeof value==='object'?value.name:value);if(key==='country'&&value)option.textContent=countryChoices([value]).all[0].name;select.appendChild(option);}
      select.value=(draftFilters||filters)[key];select.hidden=key==='country'||key==='resolution'||key==='column'&&!fullCatalog;select.disabled=externalCollection||!values.length||fullCatalog&&key!=='resolution'&&searchMode;
    }
    panel.querySelector('.xt-catalog-filter-toggle').disabled=externalCollection||searchMode;panel.querySelector('.xt-catalog-clear').hidden=!Object.keys(filters).some(key=>!!filters[key]);panel.querySelector('.xt-catalog-next').textContent=scanPending?'Seguir buscando':'Siguiente';
    panel.querySelector('.xt-catalog-prev').disabled=offset===0;panel.querySelector('.xt-catalog-next').disabled=fullCatalog?!hasMore:offset+36>=total;
    panel.querySelector('.xt-catalog-more').hidden=fullCatalog;panel.querySelector('.xt-catalog-more').disabled=!hasMore||searchMode;refreshControls();if(pendingFilter){const target=controls().findIndex(node=>node.dataset.filter===pendingFilter);pendingFilter='';if(target>=0){focus=target;mark();handle({keyCode:13});return;}}if(oldFilter)focus=controls().findIndex(node=>node.dataset.filter===oldFilter);else if(oldClass){const same=controls().indexOf(old);if(same>=0)focus=same;}if(focusResults){focusResults=false;const first=controls().findIndex(node=>node.classList.contains('xt-catalog-card'));if(first>=0)focus=first;}mark();
  }
  function open(kind='movies',options={}){
    if(window.XuperShell&&XuperShell.active&&window.XuperGuide&&XuperGuide.active)XuperGuide.close();if(panel)close();filterPanelOpen=false;draftFilters=null;scanPending=false;focusResults=false;root=kind;discoveryMode=['movies','series','all'].includes(root)&&!options.browse;discoveryPeriod='recent';discoveryCheckedAt=0;pendingFilter=options.picker||'';items=[];failedPage=null;remotePage=1;offset=0;focus=0;hasMore=true;searchMode=false;fullCatalog=true;Object.keys(filters).forEach(key=>filters[key]=options.filters&&options.filters[key]||'');active=true;
    panel=document.createElement('section');panel.id='xt-catalog';panel.className='xt-panel';
    panel.dataset.root=root;if(window.XuperShell)XuperShell.onOpen(root);if(options.title)panel.dataset.customTitle='true';panel.innerHTML='<header><div><span class="xt-eyebrow">TU BIBLIOTECA</span><h1></h1></div><div><button class="xt-catalog-retry" hidden>Reintentar</button><button class="xt-catalog-back">Volver</button><button class="xt-catalog-search">Buscar</button><button class="xt-catalog-filter-toggle" disabled>Filtrar</button><button class="xt-catalog-clear">Quitar filtros</button></div></header><nav class="xt-catalog-destinations" aria-label="Secciones del catálogo"><button data-root="movies">Películas</button><button data-root="series">Series</button><button data-root="all">Todo</button></nav><div class="xt-catalog-filters" hidden role="dialog" aria-label="Filtrar catálogo"><div class="xt-filters-heading"><h2>Filtrar</h2><button class="xt-filters-close">Cerrar</button></div><select data-filter="column" data-label="Colección: todas"></select><select data-filter="genre" data-label="Género: todos"></select><select data-filter="year" data-label="Año: todos"></select><select data-filter="country" data-label="País"></select><select data-filter="resolution" data-label="Resolución · página"></select><button class="xt-filters-apply">Ver resultados</button></div><p class="xt-catalog-status" role="status"></p><div class="xt-catalog-grid"></div><footer><button class="xt-catalog-prev">Anterior</button><button class="xt-catalog-next">Siguiente</button><button class="xt-catalog-more">Explorar más</button><span>OK Elegir · Flechas Navegar · Volver Inicio</span></footer>';
    panel.querySelector('h1').textContent=options.title||({all:'Todo',movies:'Películas',series:'Series',anime:'Anime',kids:'Infantil',featured:'Destacados',explore:'Explorar',popular:'Búsquedas populares'})[root]||'Catálogo';
    panel.querySelectorAll('[data-root]').forEach(button=>{button.classList.toggle('current',button.dataset.root===root);button.onclick=()=>open(button.dataset.root);});
    document.getElementById('app').appendChild(panel);panel.addEventListener('click',event=>{if(carouselAuto)carouselAuto.interact();const target=event.target.closest('button,select'),index=controls().indexOf(target);if(index>=0){focus=index;mark();}},true);panel.querySelector('.xt-catalog-back').onclick=close;panel.querySelector('.xt-catalog-search').onclick=search;panel.querySelector('.xt-catalog-filter-toggle').onclick=openFilters;panel.querySelector('.xt-filters-close').onclick=closeFilters;panel.querySelector('.xt-filters-apply').onclick=()=>{Object.assign(filters,draftFilters);closeFilters();offset=0;focusResults=true;query();};panel.querySelector('.xt-catalog-clear').onclick=()=>{if(discoveryMode){open(root,{browse:true});return;}Object.keys(filters).forEach(key=>filters[key]='');searchMode=false;offset=0;query();};
    if(discoveryMode){panel.dataset.discovery='true';panel.querySelector('.xt-catalog-filters').hidden=true;panel.querySelector('footer').hidden=true;panel.querySelector('.xt-catalog-clear').textContent='Explorar catálogo';panel.querySelector('.xt-catalog-clear').hidden=true;panel.querySelector('.xt-catalog-filter-toggle').hidden=true;panel.querySelector('.xt-catalog-grid').classList.add('xt-discovery-grid');panel.querySelector('.xt-catalog-grid').textContent='Cargando catálogo…';}
    if(window.IntersectionObserver)posterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){window.XuperStandalone.loadPoster(entry.target,entry.target.dataset.poster);posterObserver.unobserve(entry.target);}}),{root:panel.querySelector('.xt-catalog-grid')});
    panel.querySelectorAll('select').forEach(node=>{node.disabled=true;node.onchange=()=>{if(filterPanelOpen){draftFilters[node.dataset.filter]=node.value;return;}filters[node.dataset.filter]=node.value;if(node.dataset.filter==='column')filters.resolution='';if(node.dataset.filter!=='resolution')offset=0;query();};});
    panel.querySelector('.xt-catalog-prev').onclick=()=>{if(loading)return;offset=Math.max(0,offset-36);query();};
    panel.querySelector('.xt-catalog-next').onclick=()=>{if(loading)return;if(!scanPending)offset+=36;query();};
    panel.querySelector('.xt-catalog-more').onclick=()=>{if(loading)return;remotePage++;query(true);};panel.querySelector('.xt-catalog-retry').onclick=()=>{if(loading)return;if(failedPage!==null){remotePage=failedPage;query(true);}else query();};panel.querySelectorAll('footer button').forEach(button=>button.disabled=true);selectedNode=null;refreshControls();mark();query(true);if(discoveryMode)discoveryTimer=setInterval(()=>{if(active&&!document.hidden&&!keyboard&&!filterMenu&&!loading&&(Date.now()-discoveryCheckedAt>=600000||discoveryDay!==dateKey()))query();},60000);
  }
  function suspend(){stopCarousel();run++;loading=false;suspended=true;active=false;panel.hidden=true;if(window.XuperShell)XuperShell.onSuspend(root);}
  function resume(){if(!suspended||!panel)return false;suspended=false;active=true;panel.hidden=false;if(window.XuperShell)XuperShell.onOpen(root);if(discoveryMode&&showcases.has(root))drawShowcase(showcases.get(root));else mark();if(discoveryMode&&(Date.now()-discoveryCheckedAt>=600000||discoveryDay!==dateKey()))query();return true;}
  function close(){stopCarousel();clearInterval(discoveryTimer);discoveryTimer=null;suspended=false;filterMenu=null;active=false;run++;if(posterObserver)posterObserver.disconnect();posterObserver=null;if(keyboard)keyboard.close();keyboard=null;clearTimeout(filterTimer);if(panel)panel.remove();panel=null;if(window.XuperShell)XuperShell.onClose();}
  function handle(event){
    if(!active)return false;if(carouselAuto)carouselAuto.interact();if([447,448,449].includes(event.keyCode))return false;
    if(keyboard){keyboard.handle(event);return true;}
    const code=event.keyCode;
    if(filterMenu){
      if([10009,461,27].includes(code)){filterMenu.node.remove();filterMenu=null;return true;}
      if(code===38||code===40)filterMenu.index=Math.max(0,Math.min(filterMenu.buttons.length-1,filterMenu.index+(code===40?1:-1)));
      if(code===13){filterMenu.buttons[filterMenu.index].click();return true;}
      filterMenu.buttons.forEach((b,i)=>b.classList.toggle('selected',i===filterMenu.index));filterMenu.buttons[filterMenu.index].scrollIntoView({block:'nearest'});return true;
    }
    if([10009,461,27].includes(code)){if(filterPanelOpen)closeFilters();else if(window.XuperShell&&XuperShell.active)XuperShell.focusHeader();else close();return true;}if(code===404){search();return true;}
    const nodes=controls();const node=nodes[focus];
    if(code===38&&!filterPanelOpen&&window.XuperShell&&XuperShell.active){const row=node&&node.dataset.navrow;if(focus<panel.querySelectorAll('header button').length||panel.dataset.cinematic==='true'&&row==='0'){XuperShell.focusHeader();return true;}}
    if(code===13&&node){if(node.tagName==='SELECT'){const popup=document.createElement('div');popup.className='xt-filter-menu';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',node.dataset.label);const heading=document.createElement('h2');heading.textContent=node.dataset.label;popup.appendChild(heading);const buttons=Array.from(node.options).map((option,index)=>{const b=document.createElement('button');b.textContent=option.textContent;b.onclick=()=>{node.selectedIndex=index;popup.remove();filterMenu=null;node.onchange();};popup.appendChild(b);return b;});panel.appendChild(popup);filterMenu={node:popup,buttons,index:Math.max(0,node.selectedIndex)};buttons.forEach((b,i)=>b.classList.toggle('selected',i===filterMenu.index));}else if(!node.disabled)node.click();return true;}
    focus=panel.dataset.cinematic==='true'?discoveryFocus(nodes,focus,code):catalogFocus(nodes,focus,code);
    mark();return true;
  }
  return {open,close,suspend,resume,focusContent:()=>{mark();},setHeaderFocus:()=>{},search,chooseSearch,handle,get root(){return root;},get active(){return active;}};
}
