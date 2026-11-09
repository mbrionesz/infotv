import {genreLabel} from './category-filter.js';
const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const id=value=>String(typeof value==='object'?value.id:value),name=value=>String(typeof value==='object'?value.name:value);
export function catalogShelves(root,facets={},columns=[]){
 const genres=facets.genres||[],result=[];
 function genre(label){const match=genres.find(value=>fold(genreLabel(name(value)))===fold(label));if(match){result.push({id:'genre:'+id(match),title:label,filters:{genre:id(match)}});return true;}const column=columns.find(value=>fold(genreLabel(name(value)))===fold(label));if(column){result.push({id:'column:'+id(column),title:label,filters:{column:id(column)}});return true;}return false;}
 if(root==='movies'){for(const label of ['Acción','Drama','Comedia','Suspenso','Terror','Romance','Aventura','Ciencia ficción','Animación','Documental'])genre(label);for(const value of genres){if(!result.some(row=>row.filters&&row.filters.genre===id(value)))result.push({id:'genre:'+id(value),title:genreLabel(name(value)),filters:{genre:id(value)}});if(result.length>=24)break;}}
 else if(root==='series'){
  for(const label of ['Acción','Crimen'])if(!genre(label))result.push({id:'unavailable:'+label,title:label,filters:null,unavailable:true});
  for(const group of [{title:'Serie Coreana',column:/^(serie[s]? coreana[s]?|drama coreano|korean (series|drama)|k-drama)$/i,country:/^(korea|south korea|korea republic|corea del sur|kr|kor)$/i},{title:'Serie Turca',column:/^(serie[s]? turca[s]?|serie[s]? turquia|turkish (series|drama))$/i,country:/^(turkey|turkiye|turquia|tr|tur)$/i}]){
   const column=columns.find(value=>group.column.test(fold(name(value))));const country=(facets.countries||[]).find(value=>group.country.test(fold(name(value)))||group.country.test(fold(id(value))));
   if(column)result.push({id:'column:'+id(column),title:group.title,filters:{column:id(column)}});
   else if(country)result.push({id:'country:'+id(country),title:group.title,filters:{country:id(country)}});
   else result.push({id:'unavailable:'+group.title,title:group.title,filters:null,unavailable:true});
  }
 }
 return result;
}
