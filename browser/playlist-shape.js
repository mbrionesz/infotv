// Repair only repeated identical, positive integer TARGETDURATION values.
export function playlistShape(text){
 const tags=text.match(/^#EXT-X-TARGETDURATION:[^\r\n]*/gm)||[];
 const values=tags.map(tag=>tag.slice(tag.indexOf(':')+1).trim());let removed=0;
 const safe=tags.length>1&&/^\d+$/.test(values[0])&&Number(values[0])>0&&values.every(value=>value===values[0])&&(text.match(/^#EXTM3U/gm)||[]).length===1&&(text.match(/^#EXT-X-MEDIA-SEQUENCE:/gm)||[]).length<=1;
 let data=text;
 if(safe){let seen=false;data=text.replace(/^#EXT-X-TARGETDURATION:[^\r\n]*(?:\r?\n|$)/gm,line=>{if(!seen){seen=true;return line;}removed++;return '';});}
 const sequence=text.match(/^#EXT-X-MEDIA-SEQUENCE:\s*(\d+)\s*$/m),discontinuity=text.match(/^#EXT-X-DISCONTINUITY-SEQUENCE:\s*(\d+)\s*$/m);
 return {data,facts:{mediaSequence:sequence?Number(sequence[1]):null,discontinuitySequence:discontinuity?Number(discontinuity[1]):null,characters:text.length,hasHeader:/^\s*#EXTM3U/.test(text),segments:(text.match(/#EXTINF:/g)||[]).length,hasTargetDuration:tags.length>0,targetDuration:values.length&&Number.isFinite(Number(values[0]))?Number(values[0]):null,targetDurationTags:tags.length,removedIdenticalTargetTags:removed}};
}
export function playlistReason(value){
 const reason=String(value||'').split(/[\r\n]/,1)[0];
 if(/discontinuity sequence mismatch/i.test(reason))return 'discontinuity-sequence-mismatch';
 if(/media sequence mismatch/i.test(reason))return 'media-sequence-mismatch';
 if(/target.?duration/i.test(reason))return /more than once/i.test(reason)?'duplicate-target-duration':/before/i.test(reason)?'late-target-duration':/missing/i.test(reason)?'missing-target-duration':'target-duration';
 return /no segments/i.test(reason)?'empty-playlist':/EXTM3U/i.test(reason)?'missing-extm3u':/sequence/i.test(reason)?'sequence':/duration/i.test(reason)?'fragment-duration':'other-parsing-error';
}

export function safeParserMessage(value){
 return String(value||'').split(/[\r\n]/,1)[0]
  .replace(/https?:\/\/[^\s"'<>]+/gi,'[URL omitida]')
  .replace(/(["'])(.*?)\1/g,'[valor omitido]')
  .replace(/\bBearer\s+\S+/gi,'Bearer [omitido]')
  .replace(/((?:authorization|content-auth|content-license)\s*[:=]\s*).*/gi,'$1[omitido]')
  .replace(/([?&][\w.-]+=)[^\s&"'<>]*/g,'$1[omitido]')
  .replace(/((?:token|license|authorization|content-auth|sign2?)\s*[:=]\s*)[^\s,;)]+/gi,'$1[omitido]')
  .replace(/[a-f0-9]{32,}/gi,'[omitido]').replace(/[\x00-\x1f]/g,' ').slice(0,240);
}
