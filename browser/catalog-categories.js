import {catalogShelves} from './catalog-shelves.js';
import {genreLabel} from './category-filter.js';
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const id=value=>String(typeof value==='object'?value.id:value),name=value=>String(typeof value==='object'?value.name:value);
export function categoryColumns(width){return width>=3000?6:width<1100?3:4;}
export function catalogCategories(root,facets={},columns=[]){
 columns=columns.length?columns:facets.columns||[];
 const rows=catalogShelves(root,facets,columns),result=[];
 const add=row=>{if(row&&!result.some(item=>item.id===row.id))result.push(row);};
 if(root==='series'){
  for(const label of ['Acción','Serie Coreana','Serie Turca'])add(rows.find(row=>row.title===label));
  const us=/^(united states(?: of america)?|usa|us|eeuu|estados unidos)$/;
  const country=(facets.countries||[]).find(value=>us.test(fold(name(value)))||us.test(fold(id(value))));
  const column=columns.find(value=>us.test(fold(name(value))));
  add(column?{id:'column:'+id(column),title:'EEUU',filters:{column:id(column)}}:country?{id:'country:'+id(country),title:'EEUU',filters:{country:id(country)}}:{id:'unavailable:US',title:'EEUU',filters:null,unavailable:true});
  add(rows.find(row=>row.title==='Crimen'));
 }else for(const label of ['Acción','Crimen','Suspenso','Terror'])add(rows.find(row=>row.title===label));
 rows.forEach(add);
 if(root==='movies')for(const column of columns){if(!/^(all|todos?|todas?|ver todo)$/i.test(name(column)))add({id:'column:'+id(column),title:genreLabel(name(column)),filters:{column:id(column)}});}
 for(const genre of facets.genres||[])add({id:'genre:'+id(genre),title:genreLabel(name(genre)),filters:{genre:id(genre)}});
 return result.slice(0,24);
}
export function layoutCategoryCards(panel,width){
 const grid=panel.querySelector('.xt-category-grid');if(!grid)return;
 const columns=categoryColumns(width),row=Number(grid.dataset.startrow);
 grid.dataset.columns=String(columns);
 Array.from(grid.querySelectorAll('button')).forEach((button,index)=>{button.style.width='calc('+(100/columns)+'% - 20px)';button.style.flex='0 0 '+button.style.width;button.dataset.navrow=String(row+Math.floor(index/columns));});
}

export function categoryIcon(title){
 const shapes={Acción:'M13 2 4 14h7l-1 8 10-13h-7z',Crimen:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z',Suspenso:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',Terror:'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12',Romance:'M12 21 3 12C-3 4 8 0 12 7c4-7 15-3 9 5z',Comedia:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M7 9h1 M16 9h1 M7 14q5 6 10 0',Aventura:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M16 8l-3 5-5 3 3-5z'};
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',shapes[title]||'M4 5h16v14H4z M4 10h16 M9 5v5 M15 5v5');svg.appendChild(path);return svg;
}
