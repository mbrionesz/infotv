export function playbackRejection(error){
 if(error&&error.name==='NotAllowedError')return 'gesture';
 if(error&&error.name==='AbortError')return 'interrupted';
 return 'deferred';
}
export function liveLoadPolicy(fragment=false){
 return {default:{maxTimeToFirstByteMs:fragment?8000:5000,maxLoadTimeMs:fragment?20000:12000,
 timeoutRetry:{maxNumRetry:2,retryDelayMs:200,maxRetryDelayMs:800},
 errorRetry:{maxNumRetry:3,retryDelayMs:200,maxRetryDelayMs:800}}};
}
