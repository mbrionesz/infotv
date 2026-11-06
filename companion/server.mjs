import http from 'node:http';
import { createRequire } from 'node:module';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, createReadStream, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
export function loadCore() {
  require('./lib/index.js');
  return {
    service: require('./lib/service-shim.js').instance(),
    proxy: require('./lib/proxy.js'), relay: require('./lib/ffmpeg-relay.js')
  };
}
const allowed = new Set(['home', 'detail', 'search', 'resolve', 'resolveSmooth', 'mediaInfo',
  'liveChannels', 'liveCategories', 'resolveLive', 'fetchM3u', 'abortMedia', 'netdiag', 'heartbeat']);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
export function createGateway({ token, publicUrl, core, appRoot = path.join(root, 'app') }) {
  if (!/^[a-f0-9]{32,64}$/.test(token)) throw new Error('Invalid pairing token');
  const base = new URL(publicUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.pathname !== '/') throw new Error('Invalid public URL');
  const publicBase = base.origin + '/' + token;
  function rewrite(text) {
    // Private loopback listeners stay private; TV media is streamed by this gateway.
    return text.replace(/http:\/\/127\.0\.0\.1:(\d+)(?=\/)/g, (all, port) => {
      if (Number(port) === core.proxy.port()) return publicBase + '/media';
      if (Number(port) === core.relay.port()) return publicBase + '/relay';
      return all;
    });
  }
  function json(res, status, data) {
    const body = rewrite(JSON.stringify(data));
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(body);
  }
  return http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    let u;
    try { u = new URL(req.url, base); } catch { return json(res, 400, { error: 'Invalid URL' }); }
    const parts = u.pathname.split('/');
    const supplied = Buffer.from(parts[1] || '');
    if (supplied.length !== token.length || !timingSafeEqual(supplied, Buffer.from(token))) return json(res, 401, { error: 'Código de enlace incorrecto' });
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed' });
    const route = parts[2];
    if (route === 'rpc') {
      const method = parts[3];
      if (method === 'ping') return json(res, 200, { returnValue: true, service: 'infotv-companion', version: '0.1.0', relayAvailable: core.relay.available() });
      if (method === 'checkUpdate') return json(res, 200, { returnValue: true, updateAvailable: false, currentVersion: '0.1.0' });
      if (method === 'prewarm') return json(res, 200, { returnValue: true, deferred: true });
      if (!allowed.has(method) || !core.service.methods[method]) return json(res, 404, { returnValue: false, errorText: 'Método no disponible en Tizen' });
      const payload = Object.fromEntries(u.searchParams);
      for (const key of ['liveHeaders', 'vodHeaders', 'hosts']) {
        if (payload[key]) { try { payload[key] = JSON.parse(payload[key]); } catch { return json(res, 400, { returnValue: false, errorText: 'JSON inválido' }); } }
      }
      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) { finished = true; json(res, 504, { returnValue: false, errorText: 'El proveedor no respondió a tiempo' }); }
      }, 28000);
      res.once('close', () => { finished = true; clearTimeout(timer); });
      try {
        core.service.methods[method]({ payload, respond(data) {
          if (finished) return;
          finished = true; clearTimeout(timer);
          json(res, data.returnValue === false ? 502 : 200, data);
        }});
      } catch (error) {
        clearTimeout(timer);
        if (!finished) { finished = true; json(res, 502, { returnValue: false, errorText: String(error.message) }); }
      }
      return;
    }
    if (route === 'media' || route === 'relay') {
      const port = route === 'media' ? core.proxy.port() : core.relay.port();
      if (!port) return json(res, 503, { error: 'Media service not ready' });
      const target = parts.slice(3).join('/') + u.search;
      const headers = {};
      if (req.headers.range) headers.range = req.headers.range;
      const upstream = http.request({ hostname: '127.0.0.1', port, path: '/' + target, method: req.method, headers }, remote => {
        const manifest = /mpegurl/i.test(remote.headers['content-type'] || '') || /\.m3u8(?:\?|$)/i.test(target);
        const responseHeaders = { ...remote.headers };
        for (const key of ['connection', 'transfer-encoding', 'access-control-allow-origin']) delete responseHeaders[key];
        if (manifest) {
          delete responseHeaders['content-length'];
          let body = ''; let size = 0;
          remote.setEncoding('utf8');
          remote.on('data', chunk => { size += chunk.length; if (size > 2 * 1024 * 1024) remote.destroy(new Error('Manifest too large')); else body += chunk; });
          remote.on('end', () => { if (!res.destroyed) { res.writeHead(remote.statusCode, responseHeaders); res.end(rewrite(body)); } });
        } else {
          res.writeHead(remote.statusCode, responseHeaders); remote.pipe(res);
        }
        remote.on('error', () => res.destroy());
      });
      upstream.on('error', () => {
        if (!res.headersSent) json(res, 502, { error: 'Media service unavailable' }); else res.destroy();
      });
      res.once('close', () => upstream.destroy());
      upstream.end();
      return;
    }
    if (route === 'app') {
      let relative;
      try { relative = decodeURIComponent(parts.slice(3).join('/')) || 'index.html'; } catch { return json(res, 400, {}); }
      const file = path.resolve(appRoot, relative);
      if (!file.startsWith(path.resolve(appRoot) + path.sep)) return json(res, 403, {});
      try {
        if (!statSync(file).isFile()) throw new Error();
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
        if (req.method === 'HEAD') return res.end();
        createReadStream(file).on('error', () => res.destroy()).pipe(res);
      } catch { json(res, 404, {}); }
      return;
    }
    json(res, 404, {});
  });
}

export function pairingToken() {
  const directory = path.join(root, '.local');
  mkdirSync(directory, { recursive: true });
  const filename = path.join(directory, 'pairing.json');
  try {
    const saved = JSON.parse(readFileSync(filename, 'utf8'));
    if (/^[a-f0-9]{32,64}$/.test(saved.token)) return saved.token;
    throw new Error('Invalid existing pairing file');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const token = randomBytes(24).toString('hex');
    writeFileSync(filename, JSON.stringify({ token }), { mode: 0o600, flag: 'wx' });
    return token;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.INFOTV_PORT || 8910);
  const publicUrl = process.env.INFOTV_PUBLIC_URL || `http://127.0.0.1:${port}`;
  const token = pairingToken();
  const core = loadCore();
  const server = createGateway({ token, publicUrl, core });
  core.proxy.start(error => {
    if (error) throw error;
    core.relay.selfTest(() => {});
    server.listen(port, process.env.INFOTV_BIND || '127.0.0.1', () => {
      console.log(`InfoTV: ${publicUrl}\nCódigo de enlace: ${token}`);
      console.log('Mantén esta ventana abierta. No expongas este servicio a Internet.');
    });
  });
}
