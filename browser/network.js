import { Buffer } from 'buffer';
const forbidden = /^(user-agent|host|content-length|connection|accept-encoding|origin|referer|cookie)$/i;
export class Events {
  constructor() { this.handlers = {}; }
  on(event, handler) { (this.handlers[event] || (this.handlers[event] = [])).push(handler); return this; }
  emit(event, data) { (this.handlers[event] || []).slice().forEach(handler => handler(data)); }
}
export function request(options, responseCallback) {
  const target = typeof options === 'string' ? options : options.href || (options.protocol || 'https:') + '//' + (options.hostname || options.host) + (options.port ? ':' + options.port : '') + (options.path || '/');
  if (!/^https?:\/\//i.test(target)) throw new Error('Only HTTP(S) is supported');
  const req = new Events();
  const xhr = new XMLHttpRequest();
  const chunks = [];
  let sent = false;
  xhr.open(options.method || 'GET', target, true);
  xhr.responseType = 'arraybuffer';
  Object.keys(options.headers || {}).forEach(name => {
    if (!forbidden.test(name)) xhr.setRequestHeader(name, options.headers[name]);
  });
  req.write = value => { chunks.push(value); };
  req.setTimeout = (ms, callback) => { xhr.timeout = ms; if (callback) req.on('timeout', callback); return req; };
  req.abort = req.destroy = () => xhr.abort();
  xhr.onerror = () => { req.emit('error', new Error('Error de red, TLS o CORS en el televisor')); req.emit('close'); };
  xhr.ontimeout = () => { req.emit('timeout'); req.emit('close'); };
  xhr.onabort = () => req.emit('close');
  xhr.onload = () => {
    const response = new Events();
    response.statusCode = xhr.status; response.headers = {};
    xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).forEach(line => {
      const i = line.indexOf(':'); if (i > 0) response.headers[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
    });
    response.resume = () => {};
    responseCallback(response);
    const data = Buffer.from(xhr.response || new ArrayBuffer(0));
    if (data.length > 8 * 1024 * 1024) response.emit('error', new Error('Respuesta demasiado grande'));
    else { response.emit('data', data); response.emit('end'); }
    req.emit('close');
  };
  req.end = () => { if (!sent) { sent = true; xhr.send(chunks.length ? chunks.join('') : null); } };
  return req;
}
export default {
  request,
  get(options, callback) { const req = request(options, callback); req.end(); return req; }
};
