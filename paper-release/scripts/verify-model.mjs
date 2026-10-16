import {readFile,writeFile} from 'node:fs/promises';
import {scoreModel,category} from '../src/inference.mjs';
const root = new URL('../',import.meta.url);
const model = JSON.parse(await readFile(new URL('src/model.json',root),'utf8'));
const data = JSON.parse(await readFile(new URL('tests/parity-fixtures.json',root),'utf8'));
const tolerance=1e-8;
const summary={tolerance,source_model_sha256:model.metadata.model_sha256,holdout:data.holdout.length,extra:data.extra.length,thresholds:model.metadata.thresholds,scenarios:{}};
for(const key of ['holdout','extra']) {
  let maxError=0, maxIndex=-1;
  data[key].forEach((row,i)=>{
    const actual=scoreModel(model,row.input);
    const error=Math.abs(actual-row.expected_score);
    if(error>maxError){maxError=error;maxIndex=i;}
    if(!Number.isFinite(actual) || error>tolerance)throw new Error(`Parity failed ${key} ${i}: ${actual} vs ${row.expected_score}, error ${error}`);
    for(const threshold of Object.values(model.metadata.thresholds)){
      if((actual>=threshold)!==(row.expected_score>=threshold))throw new Error(`Decision mismatch ${key} ${i}`);
    }
    if(category(model,actual).code!==category(model,row.expected_score).code)throw new Error(`Category mismatch ${key} ${i}`);
  });
  summary[key+'_max_absolute_error']=maxError;
  summary[key+'_max_error_index']=maxIndex;
}
for(const [name,t] of Object.entries(model.metadata.thresholds)){
  const cm={TP:0,FP:0,FN:0,TN:0};
  for(const row of data.holdout){const p=scoreModel(model,row.input)>=t;cm[row.stroke?(p?'TP':'FN'):(p?'FP':'TN')]++;}
  const ref=model.metadata.holdout.scenarios.find(s=>s.scenario===name);
  for(const k of Object.keys(cm))if(cm[k]!==ref[k])throw new Error(`Confusion matrix mismatch ${name} ${k}`);
  summary.scenarios[name]=cm;
}
summary.status='PASS';
await writeFile(new URL('docs/cloudflare_verification.json',root),JSON.stringify(summary,null,2));
console.log(JSON.stringify(summary,null,2));
