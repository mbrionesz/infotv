// A metadata filter, not a parental PIN or an age-classification service.
export function isAdultContent(item={}) {
  if(item.adult===true||item.isAdult===true||item.adult===1||item.isAdult===1)return true;
  const text=[item.name,item.title,item.group,item.category,item.genre].filter(Boolean).join(' ');
  return /(?:\+18|\b18\+|\badult(?:o|os)?\b|\bxxx\b|\bporn(?:o|ografia|ography)?\b)/i.test(text);
}
export function allowContent(item){return !!(window.__xuper&&window.__xuper.state.adultEnabled)||!isAdultContent(item);}
