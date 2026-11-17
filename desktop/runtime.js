/* Same TV interface; desktop-only keyboard, pointer and lifecycle adaptations. */
(function(){
 document.documentElement.classList.add('xt-desktop');
 window.tizen={application:{getCurrentApplication:function(){return {exit:function(){window.XuperDesktop.exit();}};}}};
 window.webOSTV={platformBack:function(){window.XuperDesktop.exit();}};
 document.addEventListener('keydown',function(event){if(event.key==='Backspace'&&!/INPUT|TEXTAREA/.test(event.target.tagName)){event.preventDefault();if(window.__xuper)window.__xuper.key(461);}},true);
 // Hover is visual only. Focusing on pointerover scrolled TV lists on incidental mouse movement.

 var lastWheel=0;document.addEventListener('wheel',function(event){if(!window.__xuper||Math.abs(event.deltaY)<4)return;for(var parent=event.target;parent&&parent!==document.body;parent=parent.parentElement){var style=getComputedStyle(parent);if(/auto|scroll/.test(style.overflowY)&&parent.scrollHeight>parent.clientHeight+1)return;}event.preventDefault();var now=performance.now();if(now-lastWheel<85)return;lastWheel=now;window.__xuper.key(event.deltaY>0?40:38);},{passive:false});
 window.addEventListener('load',function(){var settings=document.getElementById('screen-settings');if(settings){var pending=false;var rewrite=function(){pending=false;var walker=document.createTreeWalker(settings,NodeFilter.SHOW_TEXT);for(var node=walker.nextNode();node;node=walker.nextNode()){var text=node.nodeValue.replace(/Samsung Tizen|Samsung · Tizen|LG webOS/gi,'Windows').replace(/\bSamsung\b|\bTizen\b/gi,'Windows').replace(/\btelevisor\b/gi,'equipo').replace(/\btelevisores\b/gi,'equipos');if(text!==node.nodeValue)node.nodeValue=text;}};new MutationObserver(function(){if(!pending){pending=true;requestAnimationFrame(rewrite);}}).observe(settings,{subtree:true,childList:true,characterData:true});rewrite();}if(window.XuperStandalone)window.XuperStandalone.version='0.1.2';var normal=document.getElementById('psv-btn-p2');if(normal)normal.textContent='Automático Windows';var help=document.querySelector('.psv-mode-help');if(help)help.textContent='La compatibilidad de vídeo y audio depende de los códecs de tu equipo. F11: pantalla completa.';});
})();
