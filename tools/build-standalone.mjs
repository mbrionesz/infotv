import {patchTsLoading} from './ts-buffer-adapter.mjs';
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
 for(const name of ['native/transport.cpp','native/cacert.pem','native/dependencies.json','native/patches/curl-nonblock-tizen.patch','tools/build-native.mjs']){nativeHash.update(name+'\0');nativeHash.update(readFileSync(path.join(root,name)));}
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
const tsLanguagePlugin={name:'ts-language-selection',setup(builder){
  builder.onResolve({filter:/^mpegts\.js$/},()=>({path:path.join(root,'node_modules/mpegts.js/src/mpegts.js')}));
  builder.onLoad({filter:/mpegts\.js\/src\/.*\.(?:ts|js)$/},args=>{
    let source=readFileSync(args.path,'utf8').replace(/import \* as EventEmitter from 'events';/g,"import EventEmitter from 'events';").replace(/import \* as work from 'webworkify-webpack';/g,"import work from 'webworkify-webpack';");
    if(args.path.endsWith('/player/loading-controller.ts'))source=patchTsLoading(source);
    if(args.path.endsWith('/demux/ts-demuxer.ts')){
      const durationAnchor='this.config_ = config;';if(source.split(durationAnchor).length!==2)throw new Error('Unexpected TS constructor');source=source.replace(durationAnchor,durationAnchor+'\nthis.duration_ = Math.max(0, Number(config.xuperTsDuration)||0);this.media_info_.duration=this.duration_;');
      const anchor='this.pmt_ = pmt;';if(source.split(anchor).length!==2)throw new Error('Unexpected MPEG-TS PMT parser; review language selection adapter');
      source='import {selectTsAudioPmt} from '+JSON.stringify(path.join(root,'browser/ts-audio-pmt.js'))+';\n'+source.replace(anchor,'selectTsAudioPmt(pmt, data, this.config_);\n'+anchor);
      source='import {observeTsSeek,attachTsSeek} from '+JSON.stringify(path.join(root,'browser/ts-seek.js'))+';\n'+source;
      for(const call of ['this.onDataAvailable(null, this.video_track_);','this.onDataAvailable(this.audio_track_, null);','this.onDataAvailable(this.audio_track_, this.video_track_);']){if(source.split(call).length!==2)throw new Error('Unexpected TS sample dispatch');source=source.replace(call,'observeTsSeek(this, '+(call.includes('null,')?'null, this.video_track_':call.includes(', null')?'this.audio_track_, null':'this.audio_track_, this.video_track_')+');\n'+call);}
      source=source.replace(/this\.onMediaInfo\(mi\);/g,'attachTsSeek(this, mi);this.onMediaInfo(mi);');
    }
    if(args.path.endsWith('/core/transmuxing-controller.js')){const anchor='let segmentInfo = Object.assign({}, mediaInfo);';if(source.split(anchor).length!==2)throw new Error('Unexpected TS media-info adapter');source=source.replace(anchor,'if(this._config.xuperTsSeek)this._mediaInfo.hasKeyframesIndex=mediaInfo.hasKeyframesIndex;\n'+anchor);}
    return {contents:source,loader:args.path.endsWith('.ts')?'ts':'js',resolveDir:path.dirname(args.path)};
  });
}};
await build({entryPoints:[path.join(root,'browser/vod-entry.js')],outfile:path.join(root,'app/vendor/vod.js'),bundle:true,platform:'browser',format:'iife',target:['chrome56'],minify:true,legalComments:'eof',define:{__VERSION__:JSON.stringify(JSON.parse(readFileSync(path.join(root,'node_modules/mpegts.js/package.json'),'utf8')).version)},plugins:[tsLanguagePlugin]});
for (const [folder, license] of [['events','LICENSE'], ['hls.js','LICENSE'], ['mpegts.js','LICENSE'], ['mp4box','LICENSE'], ['webworkify-webpack','README.md'], ['es6-promise','LICENSE'], ['crypto-js','LICENSE'], ['buffer','LICENSE'], ['base64-js','LICENSE'], ['ieee754','LICENSE']]) {
  copyFileSync(path.join(root, 'node_modules', folder, license), path.join(root, 'app/vendor', folder + '-LICENSE.txt'));
}
copyFileSync(path.join(root,'LICENSE-UPSTREAM'),path.join(root,'app/vendor/UPSTREAM-LICENSE.txt'));
copyFileSync(path.join(root,'docs/THIRD_PARTY-UPSTREAM.md'),path.join(root,'app/vendor/UPSTREAM-NOTICES.txt'));
console.log('Standalone bundle: browser runtime, HLS.js, portal protocol; Chrome 56 target (Tizen 4.0).');
const sources = ['package.json','package-lock.json','tools/build-standalone.mjs','companion/lib/magis.js','companion/lib/audio-language.js',
  ...readdirSync(path.join(root,'browser')).filter(name=>name.endsWith('.js')).map(name=>'browser/'+name)].sort();
const hash = createHash('sha256');
for(const name of sources){hash.update(name+'\0');hash.update(readFileSync(path.join(root,name)));}
const hlsVersion=JSON.parse(readFileSync(path.join(root,'node_modules/hls.js/package.json'),'utf8')).version;
writeFileSync(path.join(root,'app/vendor/build-info.json'),JSON.stringify({version:JSON.parse(readFileSync(path.join(root,'package.json'),'utf8')).version,minimumTizen:'4.0',target:'chrome56',hlsVersion,hlsWorkerVersion:hlsVersion,vodSha256:createHash('sha256').update(readFileSync(path.join(root,'app/vendor/vod.js'))).digest('hex'),hlsWorkerSha256:createHash('sha256').update(readFileSync(path.join(root,'app/vendor/hls-worker.js'))).digest('hex'),sourceSha256:hash.digest('hex')},null,2)+'\n');
