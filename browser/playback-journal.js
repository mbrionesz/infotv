const KEY='xt.playbackJournal.v1',LIMIT=100;
function label(value){return String(value||'').replace(/https?:\/\/\S+/gi,'[URL]').replace(/Bearer\s+\S+/gi,'[omitido]').replace(/[a-f0-9]{24,}/gi,'[omitido]').replace(/[\x00-\x1f]/g,' ').slice(0,90);}
function row(value){
 if(!value||typeof value!=='object'||!Number.isFinite(value.at))return null;
 return {at:value.at,lastAt:Number(value.lastAt)||value.at,channel:label(value.channel),host:/^[a-z0-9.-]{1,253}$/i.test(value.host||'')?value.host:'',engine:label(value.engine).slice(0,20),kind:/^[a-z0-9_.:-]{1,70}$/i.test(value.kind||'')?value.kind:'event',status:Number.isInteger(value.status)&&value.status>=0&&value.status<=599?value.status:0,count:Math.min(10000,Math.max(1,Number(value.count)||1))};
}
export function createPlaybackJournal({storage=()=>localStorage,now=Date.now}={}){
 let records=[];try{const data=JSON.parse(storage().getItem(KEY)||'[]');if(Array.isArray(data))records=data.slice(-LIMIT).map(row).filter(Boolean);}catch(_){}
 let timer=null;
 function flush(){clearTimeout(timer);timer=null;try{storage().setItem(KEY,JSON.stringify(records));}catch(_){} }
 return {push(value){const next=row({...value,at:now()});if(!next)return;const last=records[records.length-1];if(last&&next.at-last.lastAt<10000&&['channel','host','engine','kind','status'].every(k=>last[k]===next[k])){last.count=Math.min(10000,last.count+1);last.lastAt=next.at;}else{records.push(next);if(records.length>LIMIT)records.shift();}if(timer===null)timer=setTimeout(flush,1000);},entries(limit=LIMIT){return records.slice(-Math.max(1,Math.min(LIMIT,limit))).map(item=>({...item}));},flush};
}
