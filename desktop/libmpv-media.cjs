'use strict';
const {createVlcMedia}=require('./vlc-media.cjs');
const {nativeEnvironment}=require('./native-environment.cjs');
function createLibmpvMedia(options){return createVlcMedia({...options,engine:'libmpv',hostName:'XuperMpvHost.exe',environment:nativeEnvironment});}
module.exports={createLibmpvMedia};
