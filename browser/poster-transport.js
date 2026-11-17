// Desktop images use the existing native HTTP/DNS bridge, not browser CORS exceptions.
export async function fetchPosterBlob(url,size,request){
 const result=await request({url,method:'GET',timeout:6000,headers:{Accept:'image/*'}}),limit=size==='hero'?2*1024*1024:512*1024;
 const body=result&&result.body;if(result?.status!==200||!body||body.byteLength===0||body.byteLength>limit)throw Error('Imagen fuera del límite');
 const header=String(result.headers||''),match=/content-type:\s*(image\/[a-z0-9.+-]+)/i.exec(header);if(!match)throw Error('El servidor no devolvió una imagen');
 return new Blob([body],{type:match[1]});
}
