// Static comparison only: never executes third-party code or calls the portal.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),file=process.argv[2],output=process.argv[3];
if(!file)throw new Error('Usage: node tools/compare-portal-reference.mjs reference/magis-client.js [report.json]');
const reference=readFileSync(file,'utf8'),core=require('../companion/lib/magis.js');
const routes=new Set();for(const match of reference.matchAll(/['"](v\d+\/[A-Za-z]\w+)['"]/g))routes.add(match[1]);
for(const match of reference.matchAll(/\bcall\(\s*['"]([A-Za-z]\w*)['"]/g))routes.add(match[1]);
const ours=core.portalRoutes().routes.sort(),theirs=[...routes].sort();
const exported=reference.slice(reference.indexOf('window.MagisClient = {'));
const referenceFunctions=[...exported.matchAll(/^    (\w+):\s*(\w+|function)/gm)].map(m=>m[1]).filter(x=>!['hosts','rootIds'].includes(x)).sort();
const ownFunctions=Object.keys(core).filter(key=>typeof core[key]==='function').sort();
const result={scope:'Static routes used by this specific reference client; not the complete private portal API or successful live validation',referenceSha256:createHash('sha256').update(reference).digest('hex'),routes:{ours,theirs,oursCount:ours.length,theirsCount:theirs.length,missingHere:theirs.filter(x=>!ours.includes(x)),onlyHere:ours.filter(x=>!routes.has(x))},publicFunctions:{ours:ownFunctions,theirs:referenceFunctions,oursCount:ownFunctions.length,theirsCount:referenceFunctions.length,note:'Names and wrappers differ; compare semantic coverage, not just counts'}};
const text=JSON.stringify(result,null,2)+'\n';if(output)writeFileSync(output,text);else console.log(text);
