'use strict';
const {createVlcMedia}=require('./vlc-media.cjs');
const {nativeEnvironment}=require('./native-environment.cjs');
function createLibmpvMedia(options){return createVlcMedia({...options,engine:'libmpv',outputOptions:['--vout=direct3d9',...(options.outputOptions||[])],hostName:'XuperMpvHost.exe',environment:nativeEnvironment});}
module.exports={createLibmpvMedia};
