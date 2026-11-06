import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../app/',import.meta.url));
const types = {'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
http.createServer((req,res)=>{
  const name = new URL(req.url,'http://localhost').pathname;
  if(name.includes('$WEBAPIS/')) {res.setHeader('Content-Type','text/javascript');res.end('// Samsung API only exists on the TV.');return;}
  const file = path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(readFileSync(file));}
  catch{res.writeHead(404);res.end();}
}).listen(8899,'127.0.0.1',()=>console.log('Local frontend preview on port 8899. This server is for development, not required by the WGT.'));
