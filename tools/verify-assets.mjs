import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,relative} from 'node:path';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const entries=JSON.parse(await readFile(resolve(publicRoot,'assets/manifest.json'),'utf8'));
for(const entry of entries){const file=resolve(publicRoot,entry.path);if(relative(publicRoot,file).startsWith('..'))throw new Error('Asset path outside public directory');const bytes=await readFile(file);const hash=createHash('sha256').update(bytes).digest('hex');if(hash!==entry.sha256||bytes.length!==entry.bytes)throw new Error('Asset mismatch: '+entry.path);}
console.log(entries.length+' asset hashes and byte lengths match the manifest.');
