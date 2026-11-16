/* Same TV interface; desktop-only keyboard, pointer and lifecycle adaptations. */
(function(){
 document.documentElement.classList.add('xt-desktop');
 window.tizen={application:{getCurrentApplication:function(){return {exit:function(){window.XuperDesktop.exit();}};}}};
 window.webOSTV={platformBack:function(){window.XuperDesktop.exit();}};
 document.addEventListener('keydown',function(event){if(event.key==='Backspace'&&!/INPUT|TEXTAREA/.test(event.target.tagName)){event.preventDefault();if(window.__xuper)window.__xuper.key(461);}},true);
 document.addEventListener('pointerover',function(event){var item=event.target.closest('.focusable');if(item&&window.__xuper&&window.__xuper.state.focus!==item)window.__xuper.focus(item);});
 var lastWheel=0;document.addEventListener('wheel',function(event){if(!window.__xuper||Math.abs(event.deltaY)<4)return;event.preventDefault();var now=performance.now();if(now-lastWheel<85)return;lastWheel=now;window.__xuper.key(event.deltaY>0?40:38);},{passive:false});
 window.addEventListener('load',function(){if(window.XuperStandalone)window.XuperStandalone.version='0.1.1';var normal=document.getElementById('psv-btn-p2');if(normal)normal.textContent='Automático Windows';var help=document.querySelector('.psv-mode-help');if(help)help.textContent='La compatibilidad de vídeo y audio depende de los códecs de tu equipo. F11: pantalla completa.';});
})();
