import {catalogFocus} from './catalog-navigation.js';
import {allowContent} from './content-filter.js';
import {openKeyboard} from './keyboard.js';
export function createCatalog(core){
  let panel=null,active=false,root='movies',remotePage=1,offset=0,items=[],total=0,loaded=0,hasMore=true,loading=false,run=0,keyboard=null,filterTimer=null;
  let failedPage=null;
  let focus=0,searchMode=false,posterObserver=null,focusNodes=[],selectedNode=null,previousRow=-1;const filters={text:'',genre:'',year:'',country:'',resolution:''};
  function status(text){if(panel)panel.querySelector('.xt-catalog-status').textContent=text;}
  function query(fetchPage=false){
    const token=++run;loading=true;status(fetchPage?'Consultando catálogo…':'Filtrando…');
    core.call(searchMode?'catalogSearch':fetchPage?'catalogPage':'catalogQuery',{root,pageNum:remotePage,offset,limit:36,filters:Object.assign({},filters)},(error,result)=>{
      if(!active||run!==token)return;loading=false;
      panel.querySelector('.xt-catalog-retry').hidden=!error;if(error){failedPage=fetchPage?remotePage:null;status('No se pudo cargar. Puedes reintentar o volver. '+(error.message||String(error)));refreshControls();mark();return;}
      items=(result.items||[]).filter(allowContent);total=result.total||0;loaded=result.loaded||0;if(fetchPage)hasMore=!!result.hasMore;
      render(result.facets||{});status(total+' resultados · '+loaded+(result.remoteSearch?' títulos encontrados por el proveedor':' títulos cargados del proveedor')+(hasMore&&!searchMode?' · puedes cargar más':''));
    });
  }
  function search(){if(keyboard)return;keyboard=openKeyboard({title:'Buscar · filtra al escribir; Buscar consulta el proveedor',value:filters.text,onChange:value=>{if(!active)return;filters.text=value;searchMode=false;offset=0;clearTimeout(filterTimer);filterTimer=setTimeout(()=>query(),120);},onClose:()=>{keyboard=null;if(active&&filters.text.trim().length>=2){clearTimeout(filterTimer);searchMode=true;offset=0;query();}}});}
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
    const grid=panel.querySelector('.xt-catalog-grid');if(posterObserver)posterObserver.disconnect();grid.textContent='';
    for(const item of items){
      const card=document.createElement('button');card.setAttribute('aria-label',item.title||'Ver detalle');card.className='xt-catalog-card';card.dataset.row=String(Math.floor(grid.children.length/6));
      const image=document.createElement('img');image.alt='';image.decoding='async';
      const title=document.createElement('strong');title.textContent=item.title;
      const meta=document.createElement('small');meta.textContent=[item.year,item.country,item.resolution||item.quality].filter(Boolean).join(' · ');
      card.appendChild(image);card.appendChild(title);card.appendChild(meta);grid.appendChild(card);
      if(item.poster){image.dataset.poster=item.poster;if(posterObserver)posterObserver.observe(image);else window.XuperStandalone.loadPoster(image,item.poster);}
      card.onclick=()=>{if(root==='series'&&!item.type&&!item.kind)item.kind='serie';close();if(window.__xuper){const index=__xuper.vod.findIndex(row=>row.id===item.id);if(index<0){item._portal=!item.streamUrl;__xuper.vod.push(item);__xuper.openDetail(__xuper.vod.length-1);}else __xuper.openDetail(index);}};
    }
    for(const [key,list] of [['genre','genres'],['year','years'],['country','countries'],['resolution','resolutions']]){
      const select=panel.querySelector('[data-filter="'+key+'"]');select.textContent='';
      for(const value of ['',...(facets[list]||[])]){const option=document.createElement('option');option.value=value;option.textContent=value||select.dataset.label;select.appendChild(option);}
      select.value=filters[key];select.disabled=!(facets[list]||[]).length;
    }
    panel.querySelector('.xt-catalog-prev').disabled=offset===0;panel.querySelector('.xt-catalog-next').disabled=offset+36>=total;
    panel.querySelector('.xt-catalog-more').disabled=!hasMore||searchMode;refreshControls();mark();
  }
  function open(kind='movies'){
    if(active)close();root=kind;items=[];failedPage=null;remotePage=1;offset=0;focus=0;hasMore=true;searchMode=false;Object.keys(filters).forEach(key=>filters[key]='');active=true;
    panel=document.createElement('section');panel.id='xt-catalog';panel.className='xt-panel';
    panel.innerHTML='<header><div><span class="xt-eyebrow">EXPLORA A TU RITMO</span><h1></h1></div><div><button class="xt-catalog-retry" hidden>Reintentar</button><button class="xt-catalog-search">Buscar</button></div></header><div class="xt-catalog-filters"><select data-filter="genre" data-label="Género"></select><select data-filter="year" data-label="Año"></select><select data-filter="country" data-label="País"></select><select data-filter="resolution" data-label="Resolución"></select></div><p class="xt-catalog-status" role="status"></p><div class="xt-catalog-grid"></div><footer><button class="xt-catalog-prev">Anterior</button><button class="xt-catalog-next">Siguiente</button><button class="xt-catalog-more">Cargar más del proveedor</button><span>Verde Buscar · Return Volver</span></footer>';
    panel.querySelector('h1').textContent=({movies:'Películas',series:'Series',anime:'Anime',kids:'Kids',featured:'Destacados'})[root]||'Catálogo';
    document.getElementById('app').appendChild(panel);panel.querySelector('.xt-catalog-search').onclick=search;
    if(window.IntersectionObserver)posterObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){window.XuperStandalone.loadPoster(entry.target,entry.target.dataset.poster);posterObserver.unobserve(entry.target);}}),{root:panel.querySelector('.xt-catalog-grid')});
    panel.querySelectorAll('select').forEach(node=>{node.disabled=true;node.onchange=()=>{filters[node.dataset.filter]=node.value;offset=0;query();};});
    panel.querySelector('.xt-catalog-prev').onclick=()=>{if(loading)return;offset=Math.max(0,offset-36);query();};
    panel.querySelector('.xt-catalog-next').onclick=()=>{if(loading)return;offset+=36;query();};
    panel.querySelector('.xt-catalog-more').onclick=()=>{if(loading)return;remotePage++;query(true);};panel.querySelector('.xt-catalog-retry').onclick=()=>{if(loading)return;if(failedPage!==null){remotePage=failedPage;query(true);}else query();};panel.querySelectorAll('footer button').forEach(button=>button.disabled=true);selectedNode=null;refreshControls();mark();query(true);
  }
  function close(){active=false;run++;if(posterObserver)posterObserver.disconnect();posterObserver=null;if(keyboard)keyboard.close();keyboard=null;clearTimeout(filterTimer);if(panel)panel.remove();panel=null;}
  function handle(event){
    if(!active)return false;if([447,448,449].includes(event.keyCode))return false;
    if(keyboard){keyboard.handle(event);return true;}
    const code=event.keyCode;if([10009,461,27].includes(code)){close();return true;}if(code===404){search();return true;}
    const nodes=controls();const node=nodes[focus];
    if(code===13&&node){if(node.tagName==='SELECT'){const next=(node.selectedIndex+1)%Math.max(1,node.options.length);node.selectedIndex=next;node.onchange();}else if(!node.disabled)node.click();return true;}
    focus=catalogFocus(nodes,focus,code);
    mark();return true;
  }
  return {open,close,search,handle,get active(){return active;}};
}
