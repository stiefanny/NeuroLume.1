import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inference = (await readFile(path.join(root,'src/inference.mjs'),'utf8')).replaceAll('export function','function');
const api = (await readFile(path.join(root,'src/api.mjs'),'utf8')).replace(/^import .*;\n/gm,'')
  .replaceAll('export async function','async function').replaceAll('export function','function');
const model = await readFile(path.join(root,'src/model.json'),'utf8');
await mkdir(path.join(root,'public'),{recursive:true});
await writeFile(path.join(root,'public/_worker.js'), `const model=${model};\n${inference}\n${api}`);
await writeFile(path.join(root,'public/_routes.json'), JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Built public/_worker.js. Model and threshold parameters are unchanged.');
