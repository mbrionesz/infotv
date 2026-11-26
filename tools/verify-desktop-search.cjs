'use strict';
const assert=require('node:assert/strict');
module.exports=async function verifyDesktopSearch(window){
 const evaluate=code=>window.webContents.executeJavaScript(code);
 const wait=async code=>{for(let i=0;i<100;i++){if(await evaluate(code))return;await new Promise(r=>setTimeout(r,50));}throw Error('Native desktop search timeout: '+code);};
 const key=async keyCode=>{window.webContents.sendInputEvent({type:'keyDown',keyCode});window.webContents.sendInputEvent({type:'keyUp',keyCode});await new Promise(r=>setTimeout(r,50));};
 await evaluate(`window.__searchOriginalCall=XuperStandalone.core.call;window.__searchCalls=[];XuperStandalone.core.call=function(method,payload,done){__searchCalls.push({method,payload});done(null,method==='catalogFilters'?{genres:['Drama'],years:['2026'],countries:['Korea']}:{items:[],total:0,totalKnown:true,hasMore:false,facets:{}});};__xuper.show('home');`);
 try{
  window.focus();await evaluate('document.querySelector(".xt-top-search").click()');
  await wait('document.activeElement?.matches(".xt-keyboard-native input")');assert.equal(await evaluate('!!document.querySelector(".xt-keyboard-grid")'),false);
  await window.webContents.insertText('Pokémon ñ');await key('Left');assert.equal(await evaluate('document.activeElement.selectionStart'),8);
  await key('Enter');await wait('!document.querySelector(".xt-search-workspace")');
  assert.equal(await evaluate('__searchCalls.filter(c=>c.method==="catalogFullPage"&&c.payload.search).at(-1).payload.filters.text'),'Pokémon ñ');
  await evaluate('document.querySelector(".xt-top-search").click()');await wait('document.activeElement?.matches(".xt-keyboard-native input")');await key('Escape');await wait('!document.querySelector(".xt-search-workspace")');
  console.log('PASS actual Electron native search focus, Unicode input, caret, Enter submission and Escape without TV keyboard. Local fixtures.');
 }finally{await evaluate('XuperStandalone.core.call=window.__searchOriginalCall;delete window.__searchOriginalCall;');}
};
