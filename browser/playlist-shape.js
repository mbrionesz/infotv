// Repair only repeated identical, positive integer TARGETDURATION values.
export function playlistShape(text){
 const tags=text.match(/^#EXT-X-TARGETDURATION:[^\r\n]*/gm)||[];
 const values=tags.map(tag=>tag.slice(tag.indexOf(':')+1).trim());let removed=0;
 const safe=tags.length>1&&/^\d+$/.test(values[0])&&Number(values[0])>0&&values.every(value=>value===values[0])&&(text.match(/^#EXTM3U/gm)||[]).length===1&&(text.match(/^#EXT-X-MEDIA-SEQUENCE:/gm)||[]).length<=1;
 let data=text;
 if(safe){let seen=false;data=text.replace(/^#EXT-X-TARGETDURATION:[^\r\n]*(?:\r?\n|$)/gm,line=>{if(!seen){seen=true;return line;}removed++;return '';});}
 return {data,facts:{characters:text.length,hasHeader:/^\s*#EXTM3U/.test(text),segments:(text.match(/#EXTINF:/g)||[]).length,hasTargetDuration:tags.length>0,targetDuration:values.length&&Number.isFinite(Number(values[0]))?Number(values[0]):null,targetDurationTags:tags.length,removedIdenticalTargetTags:removed}};
}
export function playlistReason(value){
 const reason=String(value||'');
 if(/target.?duration/i.test(reason))return /more than once/i.test(reason)?'duplicate-target-duration':/before/i.test(reason)?'late-target-duration':/missing/i.test(reason)?'missing-target-duration':'target-duration';
 return /no segments/i.test(reason)?'empty-playlist':/EXTM3U/i.test(reason)?'missing-extm3u':/sequence/i.test(reason)?'sequence':/duration/i.test(reason)?'fragment-duration':'other-parsing-error';
}
