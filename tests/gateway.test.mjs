import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createGateway } from '../companion/server.mjs';

const token = 'a'.repeat(48);
async function fixture(t) {
  const media = http.createServer((req, res) => {
    if (req.url === '/list.m3u8') {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.end('#EXTM3U\nhttp://127.0.0.1:' + media.address().port + '/segment.ts\n');
    } else {
      res.writeHead(req.headers.range ? 206 : 200, { 'Content-Type': 'video/mp4', 'Content-Range': 'bytes 0-2/3' });
      res.end('abc');
    }
  });
  media.listen(0, '127.0.0.1'); await once(media, 'listening');
  const calls = [];
  const core = { proxy: { port: () => media.address().port }, relay: { port: () => 8787, available: () => true }, service: { methods: {
    resolve: message => { calls.push(message.payload); message.respond({ returnValue: true, proxyPath: `http://127.0.0.1:${media.address().port}/list.m3u8`, subtitles: [{ url: 'http://127.0.0.1:8787/sub.vtt' }] }); },
    search: () => { throw new Error('provider failed'); }
  }}};
  const server = createGateway({ token, publicUrl: 'http://192.168.1.20:8910', core });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); media.closeAllConnections(); media.close(); });
  return { base: `http://127.0.0.1:${server.address().port}`, calls };
}
test('pairing is required, ping works and LG update operations are unavailable', async t => {
  const { base } = await fixture(t);
  assert.equal((await fetch(base + '/wrong/rpc/ping')).status, 401);
  const ping = await (await fetch(`${base}/${token}/rpc/ping`)).json();
  assert.equal(ping.service, 'infotv-companion');
  assert.equal(ping.returnValue, true);
  assert.equal((await fetch(`${base}/${token}/rpc/applyUpdate`)).status, 404);
  assert.equal((await fetch(`${base}/${token}/rpc/setProxy`)).status, 404);
  assert.equal((await fetch(`${base}/${token}/rpc/ping`, { method: 'POST' })).status, 405);
});
test('resolution preserves payload and rewrites media and subtitle addresses for the TV', async t => {
  const { base, calls } = await fixture(t);
  const data = await (await fetch(`${base}/${token}/rpc/resolve?contentId=42&audioTrack=1`)).json();
  assert.equal(calls[0].contentId, '42');
  assert.equal(calls[0].audioTrack, '1');
  assert.equal(data.proxyPath, `http://192.168.1.20:8910/${token}/media/list.m3u8`);
  assert.equal(data.subtitles[0].url, `http://192.168.1.20:8910/${token}/relay/sub.vtt`);
});
test('HLS manifests, byte ranges and media bodies pass through the gateway', async t => {
  const { base } = await fixture(t);
  const manifest = await (await fetch(`${base}/${token}/media/list.m3u8`)).text();
  assert.match(manifest, new RegExp(`http://192.168.1.20:8910/${token}/media/segment.ts`));
  assert.doesNotMatch(manifest, /127\.0\.0\.1/);
  const stream = await fetch(`${base}/${token}/media/movie.mp4`, { headers: { range: 'bytes=0-2' } });
  assert.equal(stream.status, 206);
  assert.equal(stream.headers.get('content-range'), 'bytes 0-2/3');
  assert.equal(await stream.text(), 'abc');
});
test('static application loads, traversal is refused and provider exceptions become errors', async t => {
  const { base } = await fixture(t);
  const page = await fetch(`${base}/${token}/app/index.html`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /tizen-platform.js/);
  assert.equal((await fetch(`${base}/${token}/app/..%2f..%2fpackage.json`)).status, 403);
  assert.equal((await fetch(`${base}/${token}/rpc/search`)).status, 502);
});
