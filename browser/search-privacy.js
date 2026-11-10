export function canPersistRequest(method,payload={}){return !['search','catalogSearchPage','catalogSearch'].includes(method)&&!String(payload.value||payload.filters&&payload.filters.text||'').trim();}
export function isSearchCacheKey(key){return /:(?:search|catalogSearchPage):/.test(String(key))||/"(?:text|value)"\s*:\s*"[^"\s][^"]*"/.test(String(key));}
