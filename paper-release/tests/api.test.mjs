import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {handleRequest, predictInput} from '../src/api.mjs';
import {category} from '../src/inference.mjs';
const model=JSON.parse(readFileSync(new URL('../src/model.json',import.meta.url)));
const input={age:63,avg_glucose_level:78.23,bmi:34.8,gender:'Male',hypertension:0,heart_disease:0,
  ever_married:'Yes',work_type:'Private',Residence_type:'Rural',smoking_status:'never smoked',
  sudden_symptoms:false,consent:true};
const post=(body=input,headers={})=>new Request('https://neurolume-1.pages.dev/api/predict',{
  method:'POST',headers:{'content-type':'application/json',origin:'https://neurolume-1.pages.dev',...headers},
  body:JSON.stringify(body)});
test('real reference profile score agrees with paper; four thresholds retain the score',async()=>{
  for(const mode of Object.keys(model.metadata.thresholds)){
    const response=await handleRequest(post({...input,threshold_mode:mode}),{},model);
    assert.equal(response.status,200);
    const r=await response.json();
    assert.ok(Math.abs(r.score-0.3329282222333273)<1e-8);
    assert.equal(r.threshold,model.metadata.thresholds[mode]);
    assert.equal(r.decision,0);
    assert.equal(r.category.code,'below');
    assert.equal(r.model_id,model.metadata.model_id);
  }
});
test('research communication boundaries include equality',()=>{
  const t=model.metadata.thresholds;
  assert.equal(category(model,t.clinical).code,'attention');
  assert.equal(category(model,t.precision_guard).code,'higher');
  assert.equal(category(model,t.clinical-1e-12).code,'below');
});
test('BMI alone may be missing and Unknown is an existing category',async()=>{
  const r=await (await predictInput(model,{...input,bmi:null,smoking_status:'Unknown'})).json();
  assert.equal(r.status,'ok');assert.ok(Number.isFinite(r.score));assert.equal(r.warnings.length,2);
  const noBMI={...input};delete noBMI.bmi;
  assert.equal((await predictInput(model,noBMI)).status,200);
});
test('sudden symptoms stop inference',async()=>{
  const r=await (await predictInput(model,{sudden_symptoms:true,consent:false})).json();
  assert.equal(r.status,'urgent');assert.equal(r.score,null);assert.equal(r.decision,undefined);
});
test('missing and invalid fields are rejected',async()=>{
  for(const patch of [{consent:false},{age:17},{age:121},{avg_glucose_level:null},{bmi:0},
    {gender:'invalid'},{hypertension:null},{hypertension:true},{heart_disease:2},
    {work_type:'children'},{sudden_symptoms:'false'},{threshold_mode:'constructor'},{id:123}]){
    assert.equal((await predictInput(model,{...input,...patch})).status,422,JSON.stringify(patch));
  }
});
test('outside training range gives a warning without inventing a value',async()=>{
  const r=await (await predictInput(model,{...input,age:100})).json();
  assert.equal(r.status,'ok');assert.ok(r.warnings.some(x=>x.startsWith('age ')));
});
test('wrong origin and content type rejected',async()=>{
  assert.equal((await handleRequest(post(input,{origin:'https://other.example'}),{},model)).status,403);
  assert.equal((await handleRequest(post(input,{'content-type':'text/plain'}),{},model)).status,415);
});
test('malformed and oversized JSON rejected',async()=>{
  const req=new Request('https://neurolume-1.pages.dev/api/predict',{method:'POST',headers:{'content-type':'application/json'},body:'{'});
  assert.equal((await handleRequest(req,{},model)).status,422);
  assert.equal((await handleRequest(post({extra:'a'.repeat(17000)}),{},model)).status,413);
});
test('health and public aggregate model metadata expose exact thresholds',async()=>{
  for(const path of ['/api/health','/api/model']){
    const r=await handleRequest(new Request('https://neurolume-1.pages.dev'+path),{},model);
    assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');
    const data=await r.json();assert.equal(data.model_id,model.metadata.model_id);
    if(path.endsWith('/model'))assert.deepEqual(data.thresholds,model.metadata.thresholds);
  }
});
test('built deployment worker uses the same inference',async()=>{
  const worker=(await import('../public/_worker.js')).default;
  const r=await (await worker.fetch(post(),{})).json();
  assert.ok(Math.abs(r.score-0.3329282222333273)<1e-8);
});
