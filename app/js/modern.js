(function(){
 'use strict';
 function node(tag,cls,text){var el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;}
 window.addEventListener('load',function(){
  var home=document.getElementById('screen-home');
  var word=node('div','modern-wordmark');word.innerHTML='<span class="modern-symbol"></span><div class="modern-name">Xuper<span>Tizen</span></div>';home.appendChild(word);
  document.getElementById('screen-settings').appendChild(node('h1','xt-settings-heading','Ajustes'));
  var refreshHome=function(){};window.addEventListener('xuper:home',function(){refreshHome();});
  function catalog(kind){XuperCatalog.open(kind);}
  function decorate(){
   var page=home.querySelector('.home-page'),target=page&&page.querySelector('.live-focus');if(!target||page.dataset.dashboard)return;page.dataset.dashboard='true';
   var heading=node('header','dashboard-heading');heading.appendChild(node('h1','','Inicio'));page.appendChild(heading);
   var tabs=Array.from(home.querySelectorAll('.tab-item')),railFocus=tabs[0],controls=[],rows=[],posters=[],shelfItems=[];
   var menu=[{index:0,label:'Inicio',run:function(){__xuper.focus(target);}},{index:1,label:'TV en vivo',run:function(){XuperGuide.open();}},{index:2,label:'Películas',run:function(){catalog('movies');}},{index:3,label:'Series',run:function(){catalog('series');}},{index:7,label:'Todo',run:function(){catalog('all');}}];
   tabs.forEach(function(tab){tab.style.display='none';});
   menu.forEach(function(entry,index){var tab=tabs[entry.index];tab.style.display='';tab.querySelector('.tab-title').textContent=entry.label;if(entry.index===1)tab.querySelector('.tab-icon').innerHTML=tabs[0].querySelector('.tab-icon').innerHTML;tab._activate=entry.run;tab.onclick=entry.run;tab._onMove=function(direction){if(direction==='up'&&index>0)__xuper.focus(tabs[menu[index-1].index]);else if(direction==='down'&&index<menu.length-1)__xuper.focus(tabs[menu[index+1].index]);else if(direction==='right'){railFocus=tab;__xuper.focus(target);}return true;};});
   var actions=[['TV en vivo',function(){XuperGuide.open();}],['Buscar',function(){XuperCatalog.chooseSearch();}],['Mi lista',function(){__xuper.openCollection('favs');}],['Ajustes',function(){__xuper.openSettings();}]],toolbar=node('section','dashboard-actions');toolbar.setAttribute('aria-label','Accesos');
   actions.forEach(function(action,index){var button=index===0?target:node('button','focusable');button.className='dashboard-action focusable'+(index===0?' live-focus':'');button.textContent=action[0];button.setAttribute('aria-label',action[0]);button._activate=action[1];button.onclick=action[1];button._onMove=function(direction){if(direction==='left')__xuper.focus(index?controls[index-1]:railFocus);else if(direction==='right'&&index<controls.length-1)__xuper.focus(controls[index+1]);else if(direction==='up')__xuper.focus(railFocus);else if(direction==='down'&&posters.length)__xuper.focus(posters[Math.min(index,posters.length-1)]);return true;};controls.push(button);toolbar.appendChild(button);});page.appendChild(toolbar);
   var tvFavorites=node('button','dashboard-tv-favorites focusable','★ Mis canales');tvFavorites._activate=function(){XuperGuide.openFavorites();};tvFavorites.onclick=tvFavorites._activate;tvFavorites._onMove=function(direction){__xuper.focus(direction==='left'?controls[controls.length-1]:target);return true;};page.appendChild(tvFavorites);
   var hint=node('p','dashboard-nav-hint','← Menú');page.appendChild(hint);
   var shelf=node('section','dashboard-shelf');page.appendChild(shelf);
   function collection(){
    var library=__xuper.library(),groups=[],previous=__xuper.state.focus,previousId=previous&&previous.dataset.libraryId,previousGroup=previous&&previous.dataset.libraryGroup;
    if(library.continueWatching.length)groups.push({key:'continue',title:'Seguir viendo',items:library.continueWatching,open:function(){__xuper.openCollection('history');},label:'Gestionar historial'});
    if(library.favorites.length)groups.push({key:'saved',title:'Mi lista',items:library.favorites,open:function(){__xuper.openCollection('favs');},label:'Ver todo'});
    if(!groups.length)groups.push({key:'discover',title:'Para descubrir',items:shelfItems,open:function(){catalog('all');},label:'Explorar todo'});
    shelf.textContent='';posters=[];rows=[];
    groups.forEach(function(group,rowIndex){
     var section=node('section','dashboard-collection dashboard-'+group.key),head=node('div','dashboard-collection-heading');head.appendChild(node('h2','',group.title));section.appendChild(head);shelf.appendChild(section);var track=node('div','dashboard-posters');section.appendChild(track);var cards=[];rows.push(cards);
     group.items.filter(function(item){return item&&item.id&&XuperStandalone.allowContent(item);}).slice(0,12).forEach(function(item,index){
      var card=node('button','dashboard-poster focusable');card.dataset.libraryId=String(item.id);card.dataset.libraryGroup=group.key;
      var image=node('img','');image.alt='';if(item.poster)XuperStandalone.loadPoster(image,item.poster);else image.src='assets/original/common/bg_placehoder_vertical.png';card.appendChild(image);card.appendChild(node('strong','',item.title||'Ver ficha'));
      if(group.key==='continue'){var remaining=XuperStandalone.remainingLabel(item);card.appendChild(node('small','dashboard-episode',remaining||(item.episodeNumber?'Episodio '+item.episodeNumber:'Continuar viendo')));if(item.durationKnown&&item.duration>0){var progress=node('span','dashboard-progress'),fill=node('span','');fill.style.width=Math.min(100,item.position/item.duration*100)+'%';progress.appendChild(fill);card.appendChild(progress);}}
      card._activate=function(){if(group.key==='continue')return __xuper.resumeContent(item);var existing=__xuper.vod.findIndex(function(value){return String(value.id)===String(item.id);});if(existing<0)existing=__xuper.vod.push(Object.assign({},item,{type:item.series?'teleplay':item.type||'movie',_portal:!item.streamUrl}))-1;__xuper.openDetail(existing);};card.onclick=card._activate;
      card._onFocus=function(){var rect=card.getBoundingClientRect(),bounds=track.getBoundingClientRect(),scale=bounds.width/track.offsetWidth||1;if(rect.left<bounds.left)track.scrollLeft-=(bounds.left-rect.left)/scale+10;if(rect.right>bounds.right)track.scrollLeft+=(rect.right-bounds.right)/scale+10;};
      card._onMove=function(direction){if(direction==='left')__xuper.focus(index?cards[index-1]:railFocus);else if(direction==='right')__xuper.focus(index<cards.length-1?cards[index+1]:group.more);else if(direction==='up')__xuper.focus(rows[rowIndex-1]&&rows[rowIndex-1][Math.min(index,rows[rowIndex-1].length-1)]||controls[Math.min(index,controls.length-1)]);else if(direction==='down'){if(rows[rowIndex+1]&&rows[rowIndex+1].length)__xuper.focus(rows[rowIndex+1][Math.min(index,rows[rowIndex+1].length-1)]);else __xuper.focus(group.more);}return true;};cards.push(card);posters.push(card);track.appendChild(card);
     });
     var more=node('button','dashboard-collection-more focusable',group.label);more._activate=group.open;more.onclick=group.open;more._onMove=function(direction){if(direction==='left'||direction==='down')__xuper.focus(cards[0]||target);else if(direction==='up')__xuper.focus(controls[controls.length-1]);return true;};head.appendChild(more);group.more=more;
     if(!cards.length)section.appendChild(node('p','dashboard-empty','Abre Películas o Series para explorar el catálogo.'));
    });
    if(previousId)__xuper.focus(posters.find(function(card){return card.dataset.libraryId===previousId&&card.dataset.libraryGroup===previousGroup;})||posters[0]||target);
   }
   refreshHome=function(){if(page.parentNode)collection();};collection();
   XuperStandalone.core.call('catalogFullPage',{root:'all',pageNum:1,filters:{}},function(error,result){if(page.parentNode&&!error&&result){shelfItems=result.items||[];if(__xuper.state.screen==='home')collection();}});
   home.querySelectorAll('.notify-item').forEach(function(control){control.style.display='none';});if(__xuper.state.focus&&__xuper.state.focus.offsetParent===null)__xuper.focus(target);
  }
  new MutationObserver(decorate).observe(document.getElementById('home-pages'),{childList:true,subtree:true});decorate();
 });
})();
