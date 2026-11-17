// Keep the same small pool of buttons while navigating a large list.
export function createButtonWindow(container,label,onSelect,size=12,decorate,onBrowse){
  let start=0,previous=null,source=null,selectedIndex=0,playingItem=null,rowHeight=74,scrolling=false;
  const desktop=!!globalThis.window?.XuperDesktop;
  const before=desktop?document.createElement('div'):null,after=desktop?document.createElement('div'):null;
  if(desktop){before.setAttribute('aria-hidden','true');after.setAttribute('aria-hidden','true');container.appendChild(before);container.addEventListener('scroll',()=>{
    if(scrolling||!source?.length)return;
    const next=Math.max(0,Math.min(Math.floor(container.scrollTop/rowHeight),Math.max(0,source.length-size)));
    if(next===start)return;start=next;if(selectedIndex<start||selectedIndex>=start+size){selectedIndex=start;onBrowse?.(selectedIndex);}paint();
    container.dispatchEvent(new CustomEvent('xt-list-end',{detail:{index:start+size,total:source.length}}));
  },{passive:true});}
  const buttons=[];
  for(let slot=0;slot<size;slot++){
    const node=document.createElement('button');
    node.onclick=()=>onSelect(node._index);
    container.appendChild(node);buttons.push(node);
  }
  if(desktop)container.appendChild(after);
  function render(items,index,playing){
    const selectionChanged=index!==selectedIndex,sameList=source===items||!!source?.length&&source[0]===items[0];
    selectedIndex=index;playingItem=playing;
    if(!sameList){start=0;if(desktop)container.scrollTop=0;}source=items;
    if(!desktop||selectionChanged||!sameList){
      if(index<start)start=index;
      if(index>=start+size)start=Math.max(0,index-size+1);
    }
    start=Math.max(0,Math.min(start,Math.max(0,items.length-size)));
    paint();
  }
  function paint(){
    const items=source||[],index=selectedIndex,playing=playingItem;
    for(let slot=0;slot<size;slot++){
      const node=buttons[slot],position=start+slot,item=items[position];
      node.hidden=!item;node._index=position;
      if(!item)continue;
      const text=label(item,position);if(decorate)decorate(node,item,position,text);else if(node.textContent!==text)node.textContent=text;node.setAttribute('aria-label',text);node.setAttribute('aria-posinset',String(position+1));node.setAttribute('aria-setsize',String(items.length));
      node.classList.toggle('playing',!!playing&&playing(item));
    }
    if(desktop){
      const first=buttons.find(node=>!node.hidden);
      if(first){const style=getComputedStyle(first);rowHeight=first.offsetHeight+(parseFloat(style.marginTop)||0)+(parseFloat(style.marginBottom)||0)||rowHeight;}
      scrolling=true;before.style.height=(start*rowHeight)+'px';after.style.height=(Math.max(0,items.length-start-size)*rowHeight)+'px';scrolling=false;
    }
    const current=buttons[index-start];
    if(previous!==current){if(previous)previous.classList.remove('selected');if(current)current.classList.add('selected');previous=current;}
  }
  function reveal(){
    const current=buttons.find(node=>!node.hidden&&node.classList.contains('selected'));if(!current)return;
    const rect=current.getBoundingClientRect(),bounds=container.getBoundingClientRect(),scale=bounds.height/container.offsetHeight||1;
    const top=(rect.top-bounds.top)/scale+container.scrollTop,bottom=top+current.offsetHeight;
    if(top<container.scrollTop+6)container.scrollTop=Math.max(0,top-6);
    else if(bottom>container.scrollTop+container.clientHeight-6)container.scrollTop=bottom-container.clientHeight+6;
  }
  return {render,reveal};
}
