// Stable rows avoid geometric jumps between a tall episode and controls above it.
export function detailFocus(nodes,current,direction,scale=1){
 const available=nodes.filter(node=>node.offsetParent!==null),rows=[];
 const entries=available.map(node=>({node,rect:node.getBoundingClientRect()})).sort((a,b)=>a.rect.top-b.rect.top||a.rect.left-b.rect.left);
 for(const entry of entries){let row=rows.find(row=>Math.abs(row.top-entry.rect.top)<12*scale);if(!row){row={top:entry.rect.top,entries:[]};rows.push(row);}row.entries.push(entry);}
 const rowIndex=rows.findIndex(row=>row.entries.some(entry=>entry.node===current));if(rowIndex<0)return available[0]||null;
 const row=rows[rowIndex];row.entries.sort((a,b)=>a.rect.left-b.rect.left);const column=row.entries.findIndex(entry=>entry.node===current);
 if(direction==='left'||direction==='right')return row.entries[Math.max(0,Math.min(row.entries.length-1,column+(direction==='right'?1:-1)))].node;
 const next=rows[rowIndex+(direction==='down'?1:-1)];if(!next)return null;
 const rect=current.getBoundingClientRect(),center=rect.left+rect.width/2;
 return next.entries.reduce((best,entry)=>Math.abs(entry.rect.left+entry.rect.width/2-center)<Math.abs(best.rect.left+best.rect.width/2-center)?entry:best).node;
}
