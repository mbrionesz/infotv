// Keep the same small pool of buttons while navigating a large list.
export function createButtonWindow(container,label,onSelect,size=12){
  let start=0,previous=null,source=null;
  const buttons=[];
  for(let slot=0;slot<size;slot++){
    const node=document.createElement('button');
    node.onclick=()=>onSelect(node._index);
    container.appendChild(node);buttons.push(node);
  }
  function render(items,index,playing){
    if(source!==items){source=items;start=0;}
    if(index<start)start=index;
    if(index>=start+size)start=Math.max(0,index-size+1);
    start=Math.max(0,Math.min(start,Math.max(0,items.length-size)));
    for(let slot=0;slot<size;slot++){
      const node=buttons[slot],position=start+slot,item=items[position];
      node.hidden=!item;node._index=position;
      if(!item)continue;
      const text=label(item,position);if(node.textContent!==text)node.textContent=text;
      node.classList.toggle('playing',!!playing&&playing(item));
    }
    const current=buttons[index-start];
    if(previous!==current){if(previous)previous.classList.remove('selected');if(current)current.classList.add('selected');previous=current;}
  }
  return {render};
}
