// MP4Box only consumes samples for configured tracks. Consume/release unselected
// tracks too, otherwise interleaved input buffers retain their unread bytes.
export function releaseUnusedMp4Tracks(file,tracks,selectedIds,onError=()=>{}){
 const unused=new Set(tracks.filter(track=>!selectedIds.has(track.id)).map(track=>track.id));
 file.onSamples=(id,user,samples)=>{if(!unused.has(id)||!samples.length)return;try{const last=samples[samples.length-1].number;if(!Number.isSafeInteger(last)||last<0)throw Error('Índice de muestra MP4 inválido');file.releaseUsedSamples(id,last+1);}catch(error){onError(error);}};
 for(const track of tracks)if(unused.has(track.id))file.setExtractionOptions(track.id,null,{nbSamples:track.video?1:64});
 return unused.size;
}
export function mp4Memory(file,queuedBytes=0){return {inputBytes:(file.stream&&file.stream.buffers||[]).reduce((sum,buffer)=>sum+buffer.byteLength,0),sampleBytes:Math.max(0,Number(file.samplesDataSize)||0),queuedBytes:Math.max(0,queuedBytes)};}
