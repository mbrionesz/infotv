import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
export async function browserHarness(extra = []) {
  const directory = mkdtempSync(path.join(tmpdir(), 'xuper-browser-'));
  const process = spawn('chromium', ['--headless', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', `--user-data-dir=${directory}`, ...extra, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let output = '';
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { process.kill(); reject(new Error('Chromium startup timeout')); }, 15000);
    process.once('error', error => { clearTimeout(timer); reject(error); });
    process.stderr.on('data', chunk => {
      output += chunk; const match = /DevTools listening on (ws:\/\/[^\s]+)/.exec(output);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  const socket = new WebSocket(wsUrl); await once(socket, 'open');
  let id = 0; const pending = new Map(); const errors = []; const requests = []; const requestKeys = new Set();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (pending.has(message.id)) {
      const entry = pending.get(message.id); clearTimeout(entry.timer); pending.delete(message.id);
      if (message.error) entry.reject(new Error(JSON.stringify(message.error))); else entry.resolve(message.result);
    }
    if (message.method === 'Network.requestWillBeSent') { try { const origin = new URL(message.params.request.url).origin, type = message.params.type; const key = origin + '|' + type; if (!requestKeys.has(key) && requests.length < 1000) { requestKeys.add(key); requests.push({ origin, type }); } } catch (_) {} }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  });
  function call(method, params = {}, sessionId) {
    return new Promise((resolve, reject) => {
      const n = ++id;
      const timer = setTimeout(() => { pending.delete(n); reject(new Error('CDP timeout: ' + method)); }, 15000);
      pending.set(n, { resolve, reject, timer }); socket.send(JSON.stringify({ id:n, method, params, sessionId }));
    });
  }
  const { targetId } = await call('Target.createTarget', { url:'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten:true });
  await call('Network.enable', {}, sessionId); await call('Runtime.enable', {}, sessionId); await call('Page.enable', {}, sessionId);
  await call('Emulation.setDeviceMetricsOverride', { width:1920, height:1080, deviceScaleFactor:1, mobile:false }, sessionId);
  await call('Emulation.setTimezoneOverride', { timezoneId:'America/Santiago' }, sessionId);
  const api = {
    errors,requests,
    command: (method, params) => call(method, params, sessionId),
    async evaluate(expression) {
      const result = await call('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true }, sessionId);
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    },
    async waitFor(expression, count = 100) {
      for (let i = 0; i < count; i++) { if (await api.evaluate(expression)) return; await new Promise(r => setTimeout(r, 100)); }
      throw new Error('UI timeout: ' + expression + '\n' + errors.join('\n'));
    },
    async screenshot(filename) { const shot = await call('Page.captureScreenshot', { format:'png' }, sessionId); writeFileSync(filename, Buffer.from(shot.data, 'base64')); },
    async close() {
      pending.forEach(entry => clearTimeout(entry.timer)); socket.close(); process.kill();
      if (process.exitCode === null) await once(process, 'exit');
      rmSync(directory, { recursive:true, force:true, maxRetries:5, retryDelay:100 });
    }
  };
  return api;
}
