import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
const root = fileURLToPath(new URL('../', import.meta.url));
const aliases = { crypto: 'crypto.js', http: 'network.js', https: 'network.js' };
const env = new Set(['fs', 'path', 'os', 'url', './dnsx', './upstream']);
const plugin = {
  name: 'widget-runtime',
  setup(builder) {
    builder.onResolve({ filter: /^(crypto|http|https|fs|path|os|url|\.\/dnsx|\.\/upstream)$/ }, args => {
      if (!args.importer.endsWith('/magis.js')) return;
      if (aliases[args.path]) return { path: aliases[args.path], namespace: 'widget-alias' };
      if (env.has(args.path)) return { path: args.path.replace('./', ''), namespace: 'widget-env' };
    });
    builder.onLoad({ filter: /.*/, namespace: 'widget-env' }, args => ({
      contents: `module.exports = require(${JSON.stringify(path.join(root, 'browser/environment.js'))})[${JSON.stringify(args.path)}];`, resolveDir: root
    }));
    builder.onLoad({ filter: /.*/, namespace: 'widget-alias' }, args => ({
      contents: `module.exports = require(${JSON.stringify(path.join(root, 'browser', args.path))}).default;`, resolveDir: root
    }));
    builder.onLoad({ filter: /\/magis\.js$/ }, args => {
      let source = readFileSync(args.path, 'utf8');
      // No borrowed-session download or rescue is included in the TV widget.
      const start = source.indexOf('function refreshSeeds(e) {');
      const end = source.indexOf('\nfunction ', start + 1);
      if (start < 0 || end < 0) throw new Error('Unexpected upstream service structure');
      source = source.slice(0, start) + 'function refreshSeeds(e) { if(e) e(new Error("Sesiones prestadas no disponibles en este widget")); }\n' + source.slice(end);
      return { contents: source, loader: 'js', resolveDir: path.dirname(args.path) };
    });
  }
};
const nativeInfoPath=path.join(root,'app/vendor/native/build-info.json');
{
 const nativeInfo=JSON.parse(readFileSync(nativeInfoPath,'utf8'));const nativeHash=createHash('sha256');
 for(const name of ['native/transport.cpp','native/cacert.pem','tools/build-native.mjs']){nativeHash.update(name+'\0');nativeHash.update(readFileSync(path.join(root,name)));}
 if(nativeHash.digest('hex')!==nativeInfo.sourceSha256)throw new Error('Native transport source changed. Run node tools/build-native.mjs <Samsung-emsdk>');
 for(const [name,expected] of Object.entries(nativeInfo.assets))if(createHash('sha256').update(readFileSync(path.join(root,'app/vendor/native',name))).digest('hex')!==expected)throw new Error('Native artifact checksum mismatch: '+name);
}
mkdirSync(path.join(root, 'app/vendor'), { recursive: true });
await build({ entryPoints: [path.join(root, 'browser/standalone.js')], outfile: path.join(root, 'app/vendor/standalone.js'),
  bundle: true, platform: 'browser', format: 'iife', target: ['chrome56'], minify: true,
  inject: [path.join(root, 'browser/globals.js')], define: { __dirname: '"/embedded"' }, plugins: [plugin], legalComments: 'eof' });
await build({ entryPoints: [path.join(root,'browser/core-worker.js')], outfile:path.join(root,'app/vendor/core-worker.js'),
  bundle:true,platform:'browser',format:'iife',target:['chrome56'],minify:true,
  banner:{js:'var globalThis = self;'},inject:[path.join(root,'browser/globals.js')],define:{__dirname:'"/embedded"'},plugins:[plugin],legalComments:'eof' });
await build({entryPoints:[path.join(root,'browser/native-worker.js')],outfile:path.join(root,'app/vendor/native-worker.js'),bundle:true,format:'iife',target:['chrome56'],minify:true});
await build({entryPoints:[path.join(root,'node_modules/hls.js/dist/hls.worker.js')],outfile:path.join(root,'app/vendor/hls-worker.js'),bundle:false,format:'iife',target:['chrome56'],minify:true,legalComments:'eof'});
for (const [folder, license] of [['hls.js','LICENSE'], ['crypto-js','LICENSE'], ['buffer','LICENSE'], ['base64-js','LICENSE'], ['ieee754','LICENSE']]) {
  copyFileSync(path.join(root, 'node_modules', folder, license), path.join(root, 'app/vendor', folder + '-LICENSE.txt'));
}
copyFileSync(path.join(root,'LICENSE-UPSTREAM'),path.join(root,'app/vendor/UPSTREAM-LICENSE.txt'));
copyFileSync(path.join(root,'docs/THIRD_PARTY-UPSTREAM.md'),path.join(root,'app/vendor/UPSTREAM-NOTICES.txt'));
console.log('Standalone bundle: browser runtime, HLS.js, portal protocol; Chrome 56 target (Tizen 4.0).');
const sources = ['package.json','package-lock.json','tools/build-standalone.mjs','companion/lib/magis.js',
  ...readdirSync(path.join(root,'browser')).filter(name=>name.endsWith('.js')).map(name=>'browser/'+name)].sort();
const hash = createHash('sha256');
for(const name of sources){hash.update(name+'\0');hash.update(readFileSync(path.join(root,name)));}
const hlsVersion=JSON.parse(readFileSync(path.join(root,'node_modules/hls.js/package.json'),'utf8')).version;
writeFileSync(path.join(root,'app/vendor/build-info.json'),JSON.stringify({version:'0.6.3',minimumTizen:'4.0',target:'chrome56',hlsVersion,hlsWorkerVersion:hlsVersion,hlsWorkerSha256:createHash('sha256').update(readFileSync(path.join(root,'app/vendor/hls-worker.js'))).digest('hex'),sourceSha256:hash.digest('hex')},null,2)+'\n');
