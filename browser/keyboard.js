export function openKeyboard({title='Buscar',value='',onChange=()=>{},onClose=()=>{},mode='search',onSubmit=()=>{},mount,onBoundary}={}){
  if(mode==='search'&&window.XuperDesktop?.platform==='windows')return openDesktopSearchInput({title,value,onChange,onClose,onSubmit,mount});
  const panel=document.createElement('section');panel.className='xt-keyboard';
  const privateInput=mode==='url'||mode==='secret';
  const rows=privateInput?['qwertyuiop','asdfghjkl','zxcvbnm','1234567890','./:-_?=&%+#@~']:['QWERTYUIOP','ASDFGHJKL','ZXCVBNM','1234567890'];
  let closed=false;
  let text=String(value||'').slice(0,privateInput?2048:100),row=0,column=0;
  let history=[];try{localStorage.removeItem('xuper.searchHistory');}catch(_){}
  panel.innerHTML='<h2></h2><div class="xt-keyboard-value"></div><div class="xt-keyboard-grid"></div><div class="xt-keyboard-history"></div><p>Flechas · OK escribir · Return volver</p>';
  panel.querySelector('h2').textContent=title;
  const grid=panel.querySelector('.xt-keyboard-grid');
  const keys=rows.map(line=>line.split(''));keys.push(['Espacio','Borrar','Limpiar',privateInput?'Guardar':'Buscar']);if(privateInput)keys[keys.length-1].push('Mayús');const historyRow=keys.length;
  if(history.length)keys.push(history.slice(0,4));
  const buttons=keys.map((line,r)=>{
    const group=document.createElement('div');group.className='xt-keyboard-row';grid.appendChild(group);
    return line.map((key,c)=>{const b=document.createElement('button');b.textContent=key;group.appendChild(b);b.onclick=()=>{row=r;column=c;activate();};return b;});
  });
  let selected=null;
  function render(){panel.querySelector('.xt-keyboard-value').textContent=mode==='secret'?'•'.repeat(text.length):text||(privateInput?'https://…':'Escribe el nombre…');const next=buttons[row][column];if(next!==selected){if(selected)selected.classList.remove('selected');next.classList.add('selected');selected=next;}}
  function remember(){}
  function update(){text=text.slice(0,privateInput?2048:100);render();onChange(text);}
  function activate(){
    const key=keys[row][column];
    if(key==='Mayús'){for(let r=0;r<3;r++)for(let c=0;c<keys[r].length;c++){const value=keys[r][c];keys[r][c]=value===value.toLowerCase()?value.toUpperCase():value.toLowerCase();buttons[r][c].textContent=keys[r][c];}return;}
    if(row===historyRow){text=key;update();return;}
    if(key==='Buscar'||key==='Guardar'){onSubmit(text);remember();close();return;}
    if(key==='Espacio')text+=' ';else if(key==='Borrar')text=text.slice(0,-1);else if(key==='Limpiar')text='';else text+=key;
    update();
  }
  function close(){if(closed)return;closed=true;remember();panel.remove();onClose(text);}
  function handle(event){
    const code=event.keyCode;
    if(code===10009||code===461||code===27){close();return;}
    if(code===37&&column===0&&onBoundary){onBoundary('left');return;}
    if(code===37)column=Math.max(0,column-1);
    else if(code===39)column=Math.min(keys[row].length-1,column+1);
    else if(code===38){row=Math.max(0,row-1);column=Math.min(column,keys[row].length-1);}
    else if(code===40){row=Math.min(keys.length-1,row+1);column=Math.min(column,keys[row].length-1);}
    else if(code===13){activate();return;}
    else if(code===8){text=text.slice(0,-1);update();return;}
    else if(event.key&&event.key.length===1){text+=event.key;update();return;}
    render();
  }
  (mount||document.getElementById('app')).appendChild(panel);render();return {handle,close,node:panel};
}

// Desktop text editing belongs to the OS/browser: caret, paste, selection and IME.
// TV keeps the existing key grid and remote-control handling above.
function openDesktopSearchInput({title,value,onChange,onClose,onSubmit,mount}) {
 const panel=document.createElement('section');panel.className='xt-keyboard xt-keyboard-native';
 const heading=document.createElement('h2');heading.textContent=title;panel.appendChild(heading);
 const form=document.createElement('form'),input=document.createElement('input');
 input.type='search';input.value=String(value||'').slice(0,100);input.maxLength=100;input.placeholder='Escribe el nombre…';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label',title);
 form.appendChild(input);
 const actions=document.createElement('div');actions.className='xt-native-search-actions';
 const submit=document.createElement('button');submit.type='submit';submit.textContent='Buscar';actions.appendChild(submit);
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cerrar';actions.appendChild(cancel);
 form.appendChild(actions);panel.appendChild(form);
 const help=document.createElement('p');help.textContent='Enter · Buscar   Esc · Cerrar';panel.appendChild(help);
 let closed=false;
 function close(){if(closed)return;closed=true;panel.remove();onClose(input.value);}
 function apply(){onSubmit(input.value);if(!mount)close();}
 function focus(){if(!closed){input.focus({preventScroll:true});}}
 input.addEventListener('input',()=>onChange(input.value));
 input.addEventListener('keydown',event=>{
  // Let Tab reach the containing dialog's focus handling; keep native editing
  // keys away from the TV navigation dispatcher (including composition Enter).
  if(event.key!=='Tab')event.stopPropagation();
  if(event.isComposing||event.keyCode===229)return;
  if(event.key==='Escape'){event.preventDefault();close();}
  else if(event.key==='Enter'){event.preventDefault();apply();}
 });
 form.onsubmit=event=>{event.preventDefault();apply();};cancel.onclick=close;
 if(!mount)panel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();close();}});
 (mount||document.getElementById('app')).appendChild(panel);focus();
 return {node:panel,close,focus,handle(event){if([10009,461,27].includes(event.keyCode)){close();return true;}if(event.keyCode===13){apply();return true;}return false;}};
}
