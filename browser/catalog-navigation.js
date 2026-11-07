// Row-aware D-Pad navigation: controls are not a single linear list.
export function catalogFocus(nodes,index,code){
  if(!nodes.length)return 0;
  index=Math.max(0,Math.min(index,nodes.length-1));
  const current=nodes[index],card=current.classList.contains('xt-catalog-card');
  if(!card)return Math.max(0,Math.min(nodes.length-1,index+(code===37||code===38?-1:code===39||code===40?1:0)));
  const cards=nodes.filter(node=>node.classList.contains('xt-catalog-card')),position=cards.indexOf(current),column=position%6;
  if(code===37)return column>0?nodes.indexOf(cards[position-1]):index;
  if(code===39)return column<5&&cards[position+1]?nodes.indexOf(cards[position+1]):index;
  if(code===38)return position>=6?nodes.indexOf(cards[position-6]):Math.max(0,nodes.indexOf(cards[0])-1);
  if(code===40){if(cards[position+6])return nodes.indexOf(cards[position+6]);const nextRow=Math.floor(position/6+1)*6;if(cards[nextRow])return nodes.indexOf(cards[cards.length-1]);return Math.min(nodes.length-1,nodes.indexOf(cards[cards.length-1])+1);}
  return index;
}
