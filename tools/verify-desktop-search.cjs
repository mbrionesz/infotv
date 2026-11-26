'use strict';
const assert=require('node:assert/strict');
module.exports=async function verifyDesktopSearch(window){
 const evaluate=code=>window.webContents.executeJavaScript(code);
 const wait=async code=>{for(let i=0;i<100;i++){if(await evaluate(code))return;await new Promise(r=>setTimeout(r,50));}throw Error('Native desktop search timeout: '+code);};
 const openSearch=async()=>{window.focus();window.webContents.focus();const r=await evaluate('(()=>{const r=document.querySelector(".xt-top-search").getBoundingClientRect();return {x:Math.round(r.left+r.width/2),y:Math.round(r.top+r.height/2)}})()');window.webContents.sendInputEvent({type:'mouseDown',...r,button:'left',clickCount:1});window.webContents.sendInputEvent({type:'mouseUp',...r,button:'left',clickCount:1});await wait('document.hasFocus()&&document.activeElement?.matches(".xt-keyboard-native input")');};
 const key=async keyCode=>{window.webContents.sendInputEvent({type:'keyDown',keyCode});window.webContents.sendInputEvent({type:'keyUp',keyCode});await new Promise(r=>setTimeout(r,50));};
 await evaluate(`window.__searchOriginalCall=XuperStandalone.core.call;window.__searchCalls=[];XuperStandalone.core.call=function(method,payload,done){__searchCalls.push({method,payload});done(null,method==='catalogFilters'?{genres:['Drama'],years:['2026'],countries:['Korea']}:{items:[],total:0,totalKnown:true,hasMore:false,facets:{}});};__xuper.show('home');`);
 try{
  await openSearch();
  await wait('document.activeElement?.matches(".xt-keyboard-native input")');assert.equal(await evaluate('!!document.querySelector(".xt-keyboard-grid")'),false);
  await window.webContents.insertText('Pokémon ñ');await key('Left');await wait('document.activeElement.selectionStart===8');
  await key('Enter');await wait('!document.querySelector(".xt-search-workspace")');
  assert.equal(await evaluate('__searchCalls.filter(c=>c.method==="catalogFullPage"&&c.payload.search).at(-1).payload.filters.text'),'Pokémon ñ');
  await openSearch();await key('Escape');await wait('!document.querySelector(".xt-search-workspace")');
  console.log('PASS actual Electron native search focus, Unicode input, caret, Enter submission and Escape without TV keyboard. Local fixtures.');
 }finally{await evaluate('XuperStandalone.core.call=window.__searchOriginalCall;delete window.__searchOriginalCall;');}
};
