export function applyAvHeaders(av,headers={}){
 const custom=[];for(const [name,value] of Object.entries(headers)){const text=String(value);if(!/^[a-z0-9!#$%&'*+.^_`|~-]+$/i.test(name)||/[\r\n\0]/.test(text))throw Error('Cabecera de vídeo inválida');if(/^user-agent$/i.test(name))av.setStreamingProperty('USER_AGENT',text);else if(/^cookie$/i.test(name))av.setStreamingProperty('COOKIE',text);else custom.push(name+': '+text);}
 if(custom.length)av.setStreamingProperty('CUSTOM_MESSAGE',custom.join('\r\n'));
 return custom.length?'custom-message-unverified':'standard';
}
