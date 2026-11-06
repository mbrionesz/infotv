import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, createReadStream, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { loadCore, createGateway } from '../companion/server.mjs';

const directory = mkdtempSync(path.join(tmpdir(), 'infotv-core-'));
const sourceFile = path.join(directory, 'source.mp4');
process.env.INFOTV_RELAY_PORT = '0';
const timeout = setTimeout(() => { console.error('Core smoke timed out'); process.exit(1); }, 25000);
try {
  execFileSync(process.env.INFOTV_FFMPEG || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'testsrc=size=320x180:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', sourceFile]);
  const source = http.createServer((req, res) => { res.setHeader('Content-Type', 'video/mp4'); createReadStream(sourceFile).pipe(res); });
  source.listen(0, '127.0.0.1'); await once(source, 'listening');
  const core = loadCore();
  await new Promise((resolve, reject) => core.proxy.start(error => error ? reject(error) : resolve()));
  await new Promise(resolve => core.relay.selfTest(resolve));
  assert.equal(core.relay.available(), true);
  const gateway = createGateway({ token: 'c'.repeat(48), publicUrl: 'http://127.0.0.1:8910', core });
  gateway.listen(0, '127.0.0.1'); await once(gateway, 'listening');
  const ping = await (await fetch(`http://127.0.0.1:${gateway.address().port}/${'c'.repeat(48)}/rpc/ping`)).json();
  assert.equal(ping.returnValue, true); assert.equal(ping.relayAvailable, true);
  const url = `http://127.0.0.1:${source.address().port}/sample.mp4`;
  const mediaToken = core.proxy.add(url, {}, 2);
  const proxyUrl = core.proxy.baseUrl() + '/media/' + mediaToken + '/stream.mp4';
  const proxied = Buffer.from(await (await fetch(proxyUrl)).arrayBuffer());
  assert.deepEqual(proxied, readFileSync(sourceFile));
  const relayUrl = core.relay.register({ url, headers: {} }, { proxyUrl, container: 'mp4' });
  const routed = `http://127.0.0.1:${gateway.address().port}/${'c'.repeat(48)}/relay` + new URL(relayUrl).pathname;
  const response = await fetch(routed);
  assert.equal(response.status, 200);
  const body = Buffer.from(await response.arrayBuffer());
  assert.ok(body.length > 1000);
  assert.ok(body.includes(Buffer.from('ftyp')));
  assert.ok(body.includes(Buffer.from('moof')));
  console.log('PASS: real service startup, ping, FFmpeg executable, exact proxy bytes, fragmented MP4 via LAN gateway. Synthetic H.264/AAC only; no provider request.');
  core.relay.stop(); gateway.closeAllConnections(); gateway.close(); source.closeAllConnections(); source.close();
  clearTimeout(timeout); rmSync(directory, { recursive: true, force: true });
  process.exit(0); // Original internal listeners remain active by design.
} catch (error) {
  console.error(error); clearTimeout(timeout); rmSync(directory, { recursive: true, force: true }); process.exit(1);
}
