import {scoreModel, category} from './inference.mjs';

const responseHeaders = {
  'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
};
const json = (value,status=200) => new Response(JSON.stringify(value), {status,headers:responseHeaders});
const error = (detail,status=422) => json({detail},status);
const features=['age','avg_glucose_level','bmi','gender','hypertension','heart_disease','ever_married','work_type','Residence_type','smoking_status'];
const categories={gender:['Male','Female','Other'],ever_married:['Yes','No'],
  work_type:['Private','Self-employed','Govt_job','Never_worked'],
  Residence_type:['Urban','Rural'],smoking_status:['never smoked','formerly smoked','smokes','Unknown']};
const urgentMessage='This is a warning, not a stroke diagnosis. Sudden warning signs can have several causes, including stroke. Seek immediate medical assessment, even if symptoms improve or stop. Contact local emergency medical services and do not wait for a research score.';

function validate(input,model) {
  if(!input || Array.isArray(input) || typeof input!=='object')return 'Input must be a JSON object.';
  const allowed=[...features,'consent','sudden_symptoms','threshold_mode'];
  if(Object.keys(input).some(k=>!allowed.includes(k)))return 'Input contains unknown fields.';
  if(typeof input.sudden_symptoms!=='boolean' || typeof input.consent!=='boolean')return 'Symptoms and consent must be boolean values.';
  if(input.sudden_symptoms)return null;
  if(!input.consent)return 'Consent to process your inputs is required.';
  for(const [key,lower,upper,inclusive] of [['age',18,120,true],['avg_glucose_level',0,1500,false],['bmi',0,200,false]]){
    if(key==='bmi' && (input[key]===null || input[key]===undefined))continue;
    const value=input[key];
    if(typeof value!=='number' || !Number.isFinite(value) || value>upper || (inclusive?value<lower:value<=lower))return `${key}: number outside the accepted input range.`;
  }
  for(const key of ['hypertension','heart_disease'])if(![0,1].includes(input[key]))return `${key}: use 0 or 1 based on known medical history.`;
  for(const [key,values] of Object.entries(categories))if(!values.includes(input[key]))return `${key}: category is not supported by the model.`;
  if(!Object.hasOwn(model.metadata.thresholds,input.threshold_mode??'clinical'))return 'Unknown threshold_mode.';
  return null;
}

export function predictInput(model,input) {
  const problem=validate(input,model);
  if(problem)return error(problem);
  if(input.sudden_symptoms)return json({status:'urgent',score:null,message:urgentMessage});
  const record=Object.fromEntries(features.map(k=>[k,input[k]??null]));
  const score=scoreModel(model,record);
  if(!Number.isFinite(score))return error('Invalid model probability.',500);
  const mode=input.threshold_mode??'clinical';
  const threshold=model.metadata.thresholds[mode];
  const warnings=[];
  for(const [name,bounds] of Object.entries(model.metadata.training_numeric_ranges)){
    const value=record[name];
    if(value!==null && !(value>=bounds.min && value<=bounds.max))warnings.push(`${name} is outside the development-data range; output for this profile has not been validated.`);
  }
  if(record.bmi===null)warnings.push('BMI is unavailable: the model uses the training median, reducing individual information.');
  if(record.smoking_status==='Unknown')warnings.push('Smoking history is unknown and is processed as the original Unknown category.');
  return json({status:'ok',score,index:score*100,category:category(model,score),
    decision:Number(score>=threshold),threshold,threshold_mode:mode,model_id:model.metadata.model_id,
    warnings,input_summary:[{label:'Age',value:`${record.age} years`},
      {label:'Entered glucose',value:`${record.avg_glucose_level} mg/dL`},
      {label:'BMI',value:record.bmi===null?'Unavailable':String(record.bmi)},
      {label:'History of hypertension',value:record.hypertension?'Yes':'No'},
      {label:'History of heart disease',value:record.heart_disease?'Yes':'No'}],
    summary_method:'Input summary, not individual SHAP.',
    message:'The index represents a model score for recorded stroke-status classification, not a risk percentage, diagnosis, or prediction of a future stroke.'});
}

export async function handleRequest(request,env,model) {
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
  if(request.method==='GET' && url.pathname==='/api/health')return json({ready:true,model_id:model.metadata.model_id,runtime:'cloudflare-paper-v1'});
  if(request.method==='GET' && url.pathname==='/api/model'){
    const m=model.metadata;
    return json({model_id:m.model_id,variant:'NoSMOTE',architecture:'XGBoost + LightGBM + CatBoost → Logistic Regression',
      thresholds:m.thresholds,default_decision_mode:'clinical',category_boundaries:[m.thresholds.clinical,m.thresholds.precision_guard],
      category_status:'Research communication; not medically validated cutoffs.',calibrated:false,
      external_validation:'Not yet available',holdout:{...m.holdout,source:'Internal paper holdout results; not independent hospital validation'},numeric_ranges:m.training_numeric_ranges,
      source_model_sha256:m.model_sha256,runtime:'cloudflare-paper-v1'});
  }
  if(url.pathname!=='/api/predict')return error('Not found.',404);
  if(request.method!=='POST')return error('Use POST.',405);
  const origin=request.headers.get('origin');
  if(origin && origin!==url.origin)return error('Requests must originate from the same NeuroLume site.',403);
  if((request.headers.get('content-type')??'').split(';')[0].trim().toLowerCase()!=='application/json')return error('Use application/json.',415);
  if(Number(request.headers.get('content-length'))>16384)return error('Input is too large.',413);
  const chunks=[];let size=0;
  const reader=request.body?.getReader();
  if(!reader)return error('JSON input is required.');
  while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;
    if(size>16384){await reader.cancel();return error('Input is too large.',413);}chunks.push(part.value);}
  const body=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
  let payload;
  try{payload=JSON.parse(new TextDecoder().decode(body));}catch{return error('Invalid JSON format.');}
  try{return predictInput(model,payload);}catch{return error('The model could not process the input.',500);}
}

export default {
  async fetch(request,env){return handleRequest(request,env,model);}
};
