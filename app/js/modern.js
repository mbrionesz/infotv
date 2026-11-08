(function(){
 'use strict';
 function node(tag,cls,text){var el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;}
 window.addEventListener('load',function(){
  var home=document.getElementById('screen-home');
  var word=node('div','modern-wordmark');word.innerHTML='<span class="modern-symbol"></span><div class="modern-name">Xuper<span>Tizen</span></div>';home.appendChild(word);
  document.getElementById('screen-settings').appendChild(node('h1','xt-settings-heading','Ajustes'));
  function catalog(kind){if(window.XuperCatalog)XuperCatalog.open(kind);}
  function guide(){if(window.XuperGuide)XuperGuide.open();}
  var actions=[['TV en vivo','Canales y guía',guide],['Películas','Explorar catálogo',function(){catalog('movies');}],['Series','Temporadas y episodios',function(){catalog('series');}],['Buscar','Películas y series',function(){XuperCatalog.chooseSearch();}],['Mi lista','Películas y series guardadas',function(){__xuper.openCollection('favs');}],['Ajustes','Imagen, reproducción y red',function(){__xuper.openSettings();}]];
  var refreshHome=function(){};window.addEventListener('xuper:home',function(){refreshHome();});
  function decorate(){
   var page=home.querySelector('.home-page'),target=page&&page.querySelector('.live-focus');if(!target||page.dataset.dashboard)return;
   page.dataset.dashboard='true';
   var intro=node('header','dashboard-heading');intro.appendChild(node('span','dashboard-eyebrow','XUPERTIZEN'));intro.appendChild(node('h1','','Ver ahora'));page.appendChild(intro);
   var railFocus=null;var grid=node('section','dashboard-actions');grid.setAttribute('aria-label','Accesos principales');var controls=[];
   actions.forEach(function(action,index){var card=index===0?target:node('button','focusable');card.className='dashboard-action focusable'+(index===0?' live-focus':'');card.textContent='';var glyph=node('span','dashboard-glyph');glyph.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="'+['M8 5l11 7-11 7z','M3 4h18v16H3zM3 9h18M8 4l3 5m3-5 3 5','M4 3h16v18H4zM4 8h16M8 3v18','M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14','M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13z','M4 5h16M4 12h16M4 19h16M8 2v6M16 9v6M10 16v6'][index]+'"/></svg>';card.appendChild(glyph);card.appendChild(node('strong','',action[0]));card.appendChild(node('small','',action[1]));card._activate=action[2];card.onclick=action[2];card.setAttribute('aria-label',action[0]);card._onMove=function(direction){var next=index;if(direction==='right'&&index%3<2)next++;else if(direction==='left'&&index%3>0)next--;else if(direction==='up'&&index>=3)next-=3;else if(direction==='up'&&index<3){__xuper.focus(tvFavorites);return true;}else if(direction==='down'&&index<3)next+=3;else if(direction==='down'&&posters.length){__xuper.focus(posters[Math.min(index,posters.length-1)]);return true;}else if(direction==='left'){__xuper.focus(railFocus||home.querySelector('.tab-item.is-selected'));return true;}if(next!==index)__xuper.focus(controls[next]);return true;};controls.push(card);grid.appendChild(card);});page.appendChild(grid);
   var coverItems=(window.XUPERTV_CATALOG&&XUPERTV_CATALOG.items||[]).filter(function(item){return item.poster;});
   [1,2].forEach(function(index){if(!coverItems.length)return;var cover=node('img','dashboard-cover');cover.alt='';XuperStandalone.loadPoster(cover,coverItems[index%coverItems.length].poster);controls[index].insertBefore(cover,controls[index].firstChild);});
   var tvFavorites=node('button','dashboard-tv-favorites focusable','★ Mis canales');
   tvFavorites._activate=function(){XuperGuide.openFavorites();};tvFavorites.onclick=tvFavorites._activate;
   tvFavorites._onMove=function(direction){if(direction==='down'||direction==='left')__xuper.focus(controls[0]);return true;};page.appendChild(tvFavorites);
   var shelf=node('section','dashboard-shelf');page.appendChild(shelf);var posters=[];
   var shelfItems=window.__xuper?__xuper.vod:[];
   function collection(items){
    var count=0;try{count=Object.keys(JSON.parse(localStorage.getItem('xuper.guideFavorites')||'{}')).length;}catch(_){}
    tvFavorites.textContent='★ Mis canales'+(count?' · '+count:'');
    var library=window.__xuper&&__xuper.library?__xuper.library():{favorites:[],continueWatching:[]};
    var groups=[];
    if(library.continueWatching.length)groups.push({key:'continue',title:'Seguir viendo',items:library.continueWatching,open:function(){__xuper.openCollection('history');}});
    if(library.favorites.length)groups.push({key:'saved',title:'Mi lista',items:library.favorites,open:function(){__xuper.openCollection('favs');}});
    groups.push({key:'discover',title:'Para descubrir',items:items});
    var previous=window.__xuper&&__xuper.state.focus,previousId=previous&&previous.dataset.libraryId,previousGroup=previous&&previous.dataset.libraryGroup;
    shelf.textContent='';posters.length=0;var rows=[];
    groups.forEach(function(group,rowIndex){
     var section=node('section','dashboard-collection dashboard-'+group.key),heading=node('div','dashboard-collection-heading');heading.appendChild(node('h2','',group.title));section.appendChild(heading);
     var row=node('div','dashboard-posters');section.appendChild(row);shelf.appendChild(section);var cards=[];rows.push(cards);
     var entries=group.items.filter(function(item){return item&&item.id&&(!window.XuperStandalone||!XuperStandalone.allowContent||XuperStandalone.allowContent(item));}).slice(0,6);
     entries.forEach(function(item,index){
      var card=node('button','dashboard-poster focusable');card.dataset.libraryId=String(item.id);card.dataset.libraryGroup=group.key;
      var image=node('img','');image.alt='';image.decoding='async';if(item.poster&&window.XuperStandalone)XuperStandalone.loadPoster(image,item.poster);else image.src='assets/original/common/bg_placehoder_vertical.png';
      card.appendChild(image);card.appendChild(node('strong','',item.title||'Ver detalle'));
      if(group.key==='continue'&&item.episodeNumber)card.appendChild(node('small','dashboard-episode','Episodio '+item.episodeNumber));
      if(item.position>0&&item.duration){var progress=node('span','dashboard-progress'),fill=node('span','');fill.style.width=Math.min(100,item.position/item.duration*100)+'%';progress.appendChild(fill);card.appendChild(progress);}
      card._activate=function(){if(group.key==='continue'&&__xuper.resumeContent){__xuper.resumeContent(item);return;}var itemIndex=__xuper.vod.findIndex(function(value){return String(value.id)===String(item.id);});if(itemIndex<0){var saved=Object.assign({},item,{type:item.series?'teleplay':item.type||'movie',_portal:!item.streamUrl});itemIndex=__xuper.vod.push(saved)-1;}__xuper.openDetail(itemIndex);};card.onclick=card._activate;
      card._onMove=function(direction){
       if(direction==='up'){if(group.more&&index===cards.length-1){__xuper.focus(group.more);return true;}var above=rows[rowIndex-1];__xuper.focus(above&&above.length?above[Math.min(index,above.length-1)]:controls[3+Math.min(2,Math.floor(index/2))]);return true;}
       if(direction==='down'){var below=rows[rowIndex+1];if(below&&below.length)__xuper.focus(below[Math.min(index,below.length-1)]);return true;}
       if(direction==='left'){__xuper.focus(index>0?cards[index-1]:railFocus||home.querySelector('.tab-item.is-selected'));return true;}
       if(direction==='right'){if(index<cards.length-1)__xuper.focus(cards[index+1]);else if(group.more)__xuper.focus(group.more);}return true;
      };
      cards.push(card);posters.push(card);row.appendChild(card);
     });
     if(group.open){var more=node('button','dashboard-collection-more focusable','Ver todo');more._activate=group.open;more.onclick=group.open;more._onMove=function(direction){if((direction==='down'||direction==='left')&&cards.length)__xuper.focus(cards[cards.length-1]);else if(direction==='up'){var above=rows[rowIndex-1];__xuper.focus(above&&above.length?above[above.length-1]:controls[4]);}return true;};group.more=more;heading.appendChild(more);}
     if(!entries.length)section.appendChild(node('p','dashboard-empty','Abre Películas o Series para explorar el catálogo.'));
    });
    if(previousId){var restored=posters.find(function(card){return card.dataset.libraryId===previousId&&card.dataset.libraryGroup===previousGroup;});__xuper.focus(restored||posters[0]||controls[0]);}
   }
   refreshHome=function(){if(page.parentNode)collection(shelfItems);};
   collection(shelfItems);
   if(window.XuperStandalone)XuperStandalone.core.call('catalogPage',{root:'movies',pageNum:1,offset:0,limit:6},function(error,result){if(page.parentNode&&!error&&result&&result.items){result.items.forEach(function(item){if(!item.streamUrl)item._portal=true;});shelfItems=result.items;if(__xuper.state.screen==='home')collection(shelfItems);}});
   var tabs=home.querySelectorAll('.tab-item');var labels=['Inicio','Destacados','Películas','Series','Infantil','Anime','Novelas','Explorar','Mi lista'];var roots=['','featured','movies','series','kids','anime','novelas'];tabs.forEach(function(tab,index){var title=tab.querySelector('.tab-title');if(title)title.textContent=labels[index]||title.textContent;if(index===6||index===7){tab.style.display='none';return;}if(index>0){tab._activate=function(){if(index===8)__xuper.openCollection('favs');else if(index===7){catalog('movies');XuperCatalog.search();}else catalog(roots[index]);};tab.onclick=tab._activate;}tab._onMove=function(direction){var visible=Array.from(home.querySelectorAll('.tab-item')).filter(function(el){return el.offsetParent!==null;});var position=visible.indexOf(tab);if(direction==='up'&&position>0)__xuper.focus(visible[position-1]);else if(direction==='down'&&position<visible.length-1)__xuper.focus(visible[position+1]);else if(direction==='right'){railFocus=tab;__xuper.focus(target);}return true;};});
   home.querySelectorAll('.notify-item').forEach(function(control){control.style.display='none';});
   if(window.__xuper&&__xuper.state.focus===target)target.classList.add('is-focused');
   if(window.__xuper&&__xuper.state.screen==='home'&&__xuper.state.focus&&__xuper.state.focus.offsetParent===null)__xuper.focus(target);
  }
  var observer=new MutationObserver(decorate);observer.observe(document.getElementById('home-pages'),{childList:true,subtree:true});decorate();
 });
})();
