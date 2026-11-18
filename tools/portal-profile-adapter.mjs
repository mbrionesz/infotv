// Preserve the archived upstream magis.js; adapt the effective client at build time.
// Observed in Samsung 1.19.4; own bootstrap verified against the provider, without borrowed sessions.
export const portalClientProfile=Object.freeze({apkVersion:'49902',apkVer:'43404',spkgVer:'2025-08-07 05:40:11_36_16_',sdkVer:36});
export function patchPortalProfile(source){
 const old='  SPKG_VER = "2024-09-10 06:25:30_33_13_",';
 if(!source.includes(old)||!source.includes('  APK_VERSION = "49902",')||!source.includes('  APK_VER_HEADER = "43404",'))throw Error('Unexpected upstream portal profile');
 source=source.replace(old,'  SPKG_VER = "'+portalClientProfile.spkgVer+'",');
 const start=source.indexOf('  DEVICE_FIXED = {'),end=source.indexOf('  FINGERPRINT_FIXED = {',start);
 if(start<0||end<0||!source.slice(start,end).includes('    sdkVer: 33,'))throw Error('Unexpected device profile');
 source=source.slice(0,start)+source.slice(start,end).replace('    sdkVer: 33,','    sdkVer: '+portalClientProfile.sdkVer+',')+source.slice(end);
 // A stale mirror must not win a race against a healthy mirror or become preferred.
 const ps=source.indexOf('function post('),pe=source.indexOf('\nfunction ',ps+1);let post=source.slice(ps,pe);
 const promotionStart=post.indexOf('                  ((preferredHost = r),'),promotionEnd=post.indexOf('                  var u =',promotionStart);
 if(ps<0||pe<0||promotionStart<0||promotionEnd<0)throw Error('Unexpected host promotion boundary');
 const promotion=post.slice(promotionStart,promotionEnd);post=post.slice(0,promotionStart)+post.slice(promotionEnd);
 post=post.replace('  var n;','  var __xtVersionFailure=null,n;').replace('c(l || new Error(e + ": el portal no respondió"))','c(__xtVersionFailure || l || new Error(e + ": el portal no respondió"))');
 const rejection='                    return ((d.portalCode = u), c(d));';
 if(!post.includes(rejection))throw Error('Unexpected portal rejection boundary');
 post=post.replace(rejection,'                    if(u === "portal200001"){d.portalCode=u;__xtVersionFailure=d;try{__xtEvidence.observe({route:e,status:t.statusCode,envelope:s,payload:null});}catch(__xtIgnored){}return g(d); }\n'+rejection);
 const success='                  if ("string" == typeof s.data && "" !== s.data) {';
 if(!post.includes(success))throw Error('Unexpected success boundary');post=post.replace(success,promotion+success);
 const plain='    function n() {\n      r || i ||';
 if(!post.includes(plain))throw Error('Unexpected plaintext fallback boundary');
 post=post.replace('      function g(e) {','      function g(e) {\n        if(e.portalCode === "portal200001" && !a && s)s.skipPlain=true;');
 post=post.replace(plain,'    function n() {\n      if(n.skipPlain){if(!r){r=true;t&&clearTimeout(t);o--;f();}return;}\n      r || i ||');
 source=source.slice(0,ps)+post+source.slice(pe);
 // A different endpoint cannot repair a globally retired client profile.
 const first=source.indexOf('function firstCall('),last=source.indexOf('\nfunction ',first+1),block=source.slice(first,last);
 if(first<0||last<0||!block.includes('if (e) return n(e);'))throw Error('Unexpected route fallback');
 return source.slice(0,first)+block.replace('if (e) return n(e);','if (e) { if(e.portalCode === "portal200001") return r(e); return n(e); }')+source.slice(last);
}
