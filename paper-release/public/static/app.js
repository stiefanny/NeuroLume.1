(async()=>{
const metaResponse=await fetch('/api/model',{cache:'no-store'});
if(!metaResponse.ok)throw new Error('Model unavailable');
const metadata=await metaResponse.json();
const model={metadata:{...metadata,features:['age','avg_glucose_level','bmi','gender','hypertension','heart_disease','ever_married','work_type','Residence_type','smoking_status']}};
const app=document.getElementById('app');
const state={input:{},result:null,safe:false,resultTab:'overview',mode:'clinical',pending:false,requestId:0};
const t=model.metadata.thresholds;
const limits={below:100*t.clinical,upper:100*t.precision_guard};
const icons={
 brain:'<path d="M12 5a3 3 0 0 0-5-2 3 3 0 0 0-3 4 4 4 0 0 0-1 7 4 4 0 0 0 4 6 3 3 0 0 0 5-1V5Zm0 0a3 3 0 0 1 5-2 3 3 0 0 1 3 4 4 4 0 0 1 1 7 4 4 0 0 1-4 6 3 3 0 0 1-5-1M7 7c2 0 2 2 2 2m-5 4c2-2 4-1 4 1m0 4c0-2 2-3 4-3m5-8c-2 0-2 2-2 2m5 4c-2-2-4-1-4 1m0 4c0-2-2-3-4-3"/>',
 shield:'<path d="M12 3 4 6v5c0 5 8 10 8 10s8-5 8-10V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>',
 chart:'<path d="M4 4v16h17M8 15l4-5 4 3 5-8"/>',
 note:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 11h6M9 15h6M9 18h4"/>',
 heart:'<path d="M20 5c-3-3-7-1-8 1-2-3-6-4-9-1-4 5 3 12 9 16 7-5 12-11 8-16Z"/><path d="M3 11h5l2-3 3 7 2-4h6"/>',
 book:'<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1v15"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 warning:'<path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5M12 17v1"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'};
const icon=(name)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=s=>(100*s).toFixed(2);
const button=(label,href,secondary=false)=>`<a class="btn ${secondary?'secondary':''}" href="${href}">${label}</a>`;
const box=(name)=>`<span class="icon-box">${icon(name)}</span>`;
const notice=(title,text,style='')=>`<div class="notice ${style}">${icon('shield')}<div><b>${title}</b>${text?`<p>${text}</p>`:''}</div></div>`;
const heading=(eyebrow,title,description,actions='')=>`<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${description?`<p class="lede">${description}</p>`:''}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
const safetyNote=()=>notice('Sudden symptoms always come first.','Facial drooping, one-sided weakness, speech difficulty, sudden vision or balance changes, or a sudden severe headache need immediate medical attention. Do not wait for a model result.','compact urgent-foot');
const tips={
 below:{label:'Below the research threshold',short:'Below threshold',headline:'Understand your result.',intro:'Your index falls in the lower model category. This does not rule out stroke or mean that a health concern can be ignored.',nextTitle:'Keep the conversation open.',items:[['Keep up regular health checks.','Discuss blood pressure and existing conditions with your healthcare team, regardless of this index.'],['Build on everyday health habits.','Choose balanced meals, remain physically active as appropriate for you, and avoid tobacco.'],['Bring context to a consultation.','Take recent measurements, your health history, and your medication list if you have concerns.']]},
 attention:{label:'Needs attention',short:'Needs attention',headline:'Review the wider picture.',intro:'Your index falls in the middle model category. Review your measurements and health history with a healthcare professional.',nextTitle:'Review your information together.',items:[['Consider a health review.','Discuss the output with a healthcare professional alongside your symptoms, measurements, and medical history.'],['Check the information you entered.','Use recorded glucose and BMI values. A single model score cannot replace an assessment of those measurements.'],['Follow your existing care plan.','If you have hypertension, heart disease, or other diagnosed conditions, keep follow-up and take prescribed medicines as directed.']]},
 higher:{label:'Higher model score',short:'Higher score',headline:'A starting point for discussion.',intro:'Your index falls in the higher model category. This does not diagnose stroke or determine how urgently you need medical care.',nextTitle:'Discuss the result with a clinician.',items:[['Arrange a clinical discussion.','Ask a healthcare professional to review your overall health and this output. The model cannot diagnose stroke.'],['Prepare for the conversation.','Bring your recent measurements, diagnosed conditions, medicines, and any changes in your health.'],['Let clinical advice guide decisions.','Do not start, stop, or change treatment because of this index. Keep following your healthcare team’s advice.']]}
};
const tipSource=`<p class="tip-source">General health information: <a href="https://www.cdc.gov/stroke/prevention/index.html" target="_blank" rel="noopener noreferrer">CDC stroke prevention ↗</a>. Discuss individual care with a healthcare professional.</p>`;
function home(){
 return `<section class="hero"><div><div class="eyebrow">A LITTLE CLARITY. A MORE INFORMED CONVERSATION.</div><h1>Understand the index.<br><em>See the bigger picture.</em></h1><p class="lede">Explore a research model for recorded stroke status. Get an understandable score, see its limitations, and prepare questions for a healthcare professional.</p><div class="actions">${button('Start your analysis <span>↗</span>','#/safety')}${button('Understand the model','#/research',true)}</div><p class="mini-note">For adults aged 18+ · No diagnosis · No clinical risk percentage</p></div><div class="hero-visual"><div class="mini-label">A RESULT WITH CONTEXT</div><div class="visual-card"><div class="visual-line"><div><span class="pill">RESEARCH INDEX</span><h3 class="layout-1">Information, interpreted<br>with care.</h3></div><div class="mini-circle" aria-label="Index scale from zero to one hundred">0–100</div></div><p class="mini-caption">Your result comes with a category explanation, general health guidance, and clear model limitations.</p></div><p class="mini-note">A clear explanation · Practical next steps · Research transparency</p></div></section><section class="triptych"><div class="info-tile">${box('note')}<div><h3>One step at a time</h3><p>Three short input screens. A separate page for your result.</p></div></div><div class="info-tile">${box('shield')}<div><h3>Clear about its limits</h3><p>A low score does not rule out stroke. A high score is not a diagnosis.</p></div></div><div class="info-tile">${box('book')}<div><h3>Useful next steps</h3><p>Read the category explanation and prepare for a health discussion.</p></div></div></section>${safetyNote()}`;
}
function safety(){return heading('BEFORE YOU BEGIN','Check for new, sudden warning signs.','This is a safety reminder, not a test that diagnoses stroke.')+`<section class="card safety-card"><div class="title-with-icon">${box('heart')}<div><h2>Have you noticed a new, sudden change?</h2><p class="subtle">Include symptoms happening now or a recent sudden episode that has stopped. Do not select a longstanding, unchanged symptom.</p></div></div><div class="symptoms">${['Sudden drooping or numbness on one side of the face','Sudden weakness or numbness in one arm or leg','Sudden trouble speaking or understanding speech','Sudden vision loss, double vision, or a major vision change','Sudden dizziness, difficulty walking, or loss of balance','A sudden, unusually severe headache with no obvious cause'].map(s=>`<label class="symptom"><input type="checkbox" name="symptom">${s}</label>`).join('')}</div><p class="mini-note">Dizziness has many possible causes. A symptom selection does not mean you have a stroke, and this app cannot identify its cause.</p><div id="symptom-message">${notice('When in doubt, get medical advice.','New, sudden warning signs need immediate medical assessment. Do not use the research score to decide whether to seek care.','soft compact')}</div><div class="form-actions">${button('← Home','#/home',true)}<button class="btn" id="no-symptoms">None of these — continue <span>→</span></button></div><p class="tip-source">Warning signs: <a href="https://www.cdc.gov/stroke/signs-symptoms/index.html" target="_blank" rel="noopener noreferrer">CDC signs and symptoms ↗</a></p></section>`;}

const field=(label,name,type,extra='',help='')=>`<label class="field">${label}<input type="${type}" name="${name}" value="${esc(state.input[name])}" ${extra}>${help?`<small>${help}</small>`:''}</label>`;
const select=(label,name,options,help='')=>`<label class="field">${label}<select name="${name}" required><option value="">Select an option</option>${options.map(([value,label])=>`<option value="${value}"${String(state.input[name])===String(value)?' selected':''}>${label}</option>`).join('')}</select>${help?`<small>${help}</small>`:''}</label>`;
const side=()=>`<aside class="stack sidebar"><div class="card"><div class="eyebrow">WHAT HAPPENS NEXT</div><h3>From information<br>to understanding.</h3><p>You will see a research index and a plain-language explanation on a new page.</p><ul class="side-list"><li><span class="number">1</span><div><b>A score with context</b><p>A model output, not a risk percentage.</p></div></li><li><span class="number">2</span><div><b>Guidance for your category</b><p>General tips and discussion points.</p></div></li><li><span class="number">3</span><div><b>The full research picture</b><p>Thresholds, results, and limitations.</p></div></li></ul></div><div class="notice soft">${icon('lock')}<div><b>Your information</b><p>Your inputs are sent securely for calculation and are not saved by this application. Refreshing clears the form.</p></div></div></aside>`;
function assessment(step){
 const titles=['About you','Health history','Measurements'];
 let fields='';
 if(step===1)fields=field('Age (years)','age','number','required min="18" max="120" step="1" placeholder="e.g. 52"','For adults aged 18 or older.')+select('Sex, as recorded','gender',[['Female','Female'],['Male','Male'],['Other','Other, as recorded']])+select('Employment type','work_type',[['Private','Private-sector employee'],['Self-employed','Self-employed'],['Govt_job','Government employee'],['Never_worked','Never worked']])+select('Residence type','Residence_type',[['Urban','Urban'],['Rural','Rural']])+select('Ever married','ever_married',[['Yes','Yes'],['No','No']]);
 if(step===2)fields=select('History of hypertension','hypertension',[[0,'No'],[1,'Yes']],'Use a known diagnosis; do not guess.')+select('History of heart disease','heart_disease',[[0,'No'],[1,'Yes']],'Use a known diagnosis; do not guess.')+select('Smoking history','smoking_status',[['never smoked','Never smoked'],['formerly smoked','Formerly smoked'],['smokes','Currently smokes'],['Unknown','Unknown']],'Choose Unknown if you do not know your smoking history.')+`<div class="field full">${notice('What if a required answer is unknown?','Do not select “No” to replace missing medical history. This model version requires those inputs, so wait until the information is available.','soft compact')}</div>`;
 if(step===3)fields=`<label class="field">Available glucose measurement<div class="field-unit"><input type="number" name="avg_glucose_level" value="${esc(state.input.avg_glucose_level)}" required min="0.01" max="1500" step="any" placeholder="e.g. 95.5"><span>mg/dL</span></div><small>Use a recorded value in mg/dL. Do not guess or enter mmol/L.</small></label><div class="field"><label for="bmi-value">Body mass index</label><div class="field-unit"><input id="bmi-value" type="number" name="bmi" value="${esc(state.input.bmi)}" min="0.01" max="200" step="any" placeholder="e.g. 24.8" ${state.input.bmi===null?'disabled':''}><span>kg/m²</span></div><label class="check"><input type="checkbox" id="missing-bmi"${state.input.bmi===null?' checked':''}>I do not know my BMI</label><small>If unavailable, the model uses the training median; it does not assume a normal BMI.</small></div><div class="field full"><details class="bmi-helper"><summary>Need help calculating BMI?</summary><div class="fields"><label class="field">Height (cm)<input id="bmi-height" type="number" min="50" max="250" placeholder="e.g. 165"></label><label class="field">Weight (kg)<input id="bmi-weight" type="number" min="10" max="400" placeholder="e.g. 65"></label></div><button type="button" class="btn small secondary" id="calculate-bmi">Calculate and use BMI</button><p id="bmi-hint" class="mini-note" aria-live="polite"></p></details></div><label class="check field full"><input type="checkbox" name="acknowledge" required ${state.input.acknowledge?'checked':''}>I understand this is a research index, not a diagnosis or risk percentage. I agree to send my inputs for calculation without saving them in the application.</label>`;
 return heading('YOUR HEALTH INPUTS','A little context, one step at a time.','Use information you know. Your answers stay while you move between these screens.')+`<div class="split-form"><section class="card form-card"><div class="card-title"><div class="title-with-icon">${box('note')}<div><h2>Your health inputs</h2><p class="subtle">Adults aged 18 and above</p></div></div><span class="layout-2">0${step}<small class="layout-3"> / 03</small></span></div>${notice('This is not a diagnosis.','The index is a research model output, not your clinical risk percentage. Do not use it to delay medical care.','compact')}<div class="steps">${titles.map((s,i)=>`<div class="step ${i+1===step?'active':i+1<step?'done':''}"${i+1===step?' aria-current="step"':''}><b>${i+1<step?'✓':i+1}</b>${s}</div>`).join('')}</div><div class="eyebrow">STEP 0${step}</div><h2>${titles[step-1]}</h2><p class="layout-4 subtle">${['These details describe the profile being entered into the model.','The model uses recorded history, not a new diagnosis.','Enter recorded measurements in the units shown. Avoid guessing.'][step-1]}</p><form id="assessment-form"><div class="fields">${fields}</div><div class="error" id="form-error" role="alert"></div><div class="form-actions">${button('← Back',step===1?'#/safety':`#/assessment/${step-1}`,true)}<button type="submit" class="btn">${step===3?'View research result ↗':'Continue →'}</button></div><p class="privacy">${icon('lock').replace('<svg ','<svg width="13" height="13" ')} Used for this calculation · Not saved by this application</p></form></section>${side()}</div>`;
}
function rangeRow(code,showBounds=false){return `<div class="range-row">${['below','attention','higher'].map(c=>`<div class="range-item ${c===code?'current':''}"><b>${tips[c].short} ${c===code?'✓':''}</b>${showBounds?(c==='below'?`Index &lt; ${limits.below.toFixed(2)}`:c==='attention'?`${limits.below.toFixed(2)} to &lt; ${limits.upper.toFixed(2)}`:`Index ≥ ${limits.upper.toFixed(2)}`):''}<small>${c===code?'Your model category':'Research category'}</small></div>`).join('')}</div>`;}
function resultContent(){
 const r=state.result,c=r.category.code,k=tips[c];
 if(state.resultTab==='overview')return `<div class="eyebrow">UNDERSTAND YOUR CATEGORY</div><h2>${k.headline}</h2><p class="layout-5 lede">${k.intro}</p>${rangeRow(c)}<p class="mini-note">These categories describe model output, not medically validated risk levels.</p><div class="layout-6 notice soft">${icon('info')}<div><b>Context matters more than a number.</b><p>The same score can have different implications in different people. Your symptoms and a clinician’s assessment take priority.</p></div></div><div class="layout-7 actions"><button class="btn small" data-result-tab="tips">See your next steps →</button><button class="btn small secondary" data-result-tab="inputs">Review your inputs</button></div>`;
 if(state.resultTab==='tips')return `<div class="eyebrow">A THOUGHTFUL NEXT STEP</div><h2>${k.nextTitle}</h2><p class="layout-4 subtle">General information to support a conversation, not an individual treatment plan.</p><ol class="tip-list">${k.items.map(([title,text],i)=>`<li><span class="number">${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol>${tipSource}`;
 if(state.resultTab==='inputs'){
 const labels={age:'Age (years)',gender:'Sex',work_type:'Employment type',Residence_type:'Residence type',ever_married:'Ever married',hypertension:'History of hypertension',heart_disease:'History of heart disease',smoking_status:'Smoking history',avg_glucose_level:'Entered glucose (mg/dL)',bmi:'BMI (kg/m²)'};
 const value=(key)=>state.input[key]===null?'Unavailable — training median':key==='hypertension'||key==='heart_disease'?(Number(state.input[key])?'Yes':'No'):({Private:'Private-sector employee',Govt_job:'Government employee',Never_worked:'Never worked','never smoked':'Never smoked','formerly smoked':'Formerly smoked',smokes:'Currently smokes'})[state.input[key]]??state.input[key];
 return `<div class="eyebrow">INPUTS TO DISCUSS</div><h2>Your information, at a glance.</h2><p class="layout-4 subtle">A summary of the information you entered.</p><dl class="key-value">${Object.keys(labels).map(key=>`<div><dt>${labels[key]}</dt><dd>${esc(value(key))}</dd></div>`).join('')}</dl>${r.warnings?.length?notice('Input limitations',r.warnings.map(esc).join('<br>'),'gold'):''}`;
 }
 return '';
}
function results(){
 if(!state.result)return `<section class="card empty-state">${box('chart')}<h2 class="layout-8">Your result will appear here.</h2><p>Complete the three short steps to see your model index and guidance.</p><div class="layout-9 actions">${button('Start analysis','#/safety')}</div></section>`;
 const r=state.result,c=r.category.code;
 return heading('YOUR RESEARCH SUMMARY','A starting point for a conversation.','Understand the number, review your inputs, and decide what to discuss with a professional.',button('← Edit inputs','#/assessment/1',true))+`<div class="result-grid"><section class="card score-card ${c}"><div class="eyebrow">YOUR RESEARCH INDEX</div><div class="ring"><svg viewBox="0 0 160 160" aria-hidden="true"><circle class="track" cx="80" cy="80" r="69"/><circle class="value" cx="80" cy="80" r="69" stroke-dasharray="${(2*Math.PI*69*r.score).toFixed(3)} ${(2*Math.PI*69).toFixed(3)}"/></svg><div class="ring-center"><strong>${r.index.toFixed(2)}</strong><small>out of 100</small></div></div><span class="result-label">${tips[c].label}</span><h2>A model output.<br>Not a risk percentage.</h2><p>Classification of stroke status recorded in research data. Not a prediction of a future stroke event.</p>${notice('Not a diagnosis.','This category cannot confirm or rule out stroke.','compact')}<a class="btn secondary" href="#/safety" data-new-analysis="true">Start a new analysis ↗</a></section><section class="card"><div class="tabs" role="tablist" aria-label="Result information">${[['overview','Overview'],['tips','Next steps'],['inputs','Your inputs']].map(([v,l])=>`<button role="tab" id="tab-${v}" data-result-tab="${v}" aria-selected="${state.resultTab===v}" aria-controls="result-panel">${l}</button>`).join('')}</div><div id="result-panel" role="tabpanel" aria-labelledby="tab-${state.resultTab}">${resultContent()}</div></section></div>${safetyNote()}`;
}
function learn(){return heading('LEARN WITH CONTEXT','Better information. More useful questions.','General educational information from official sources, kept separate from your model result.')+`<section class="learn-grid"><article class="card learn-card">${box('heart')}<div class="eyebrow">RECOGNIZE</div><h2>Know the<br>warning signs.</h2><p>Watch for sudden changes in balance, vision, facial movement, arm strength, or speech. A sudden severe headache also needs attention.</p><a href="#/learn/warning-signs">Read about urgent symptoms →</a></article><article class="card learn-card">${box('shield')}<div class="eyebrow">SUPPORT</div><h2>Build everyday<br>healthy habits.</h2><p>General guidance on food, physical activity, tobacco, and following care for diagnosed conditions.</p><a href="#/learn/healthy-habits">Explore healthy habits →</a></article><article class="card learn-card">${box('note')}<div class="eyebrow">PREPARE</div><h2>Make room for<br>a conversation.</h2><p>Know what to bring, what to ask, and what the research model cannot tell you.</p><a href="#/learn/appointment">Prepare for a consultation →</a></article></section>${safetyNote()}`;}
function article(id){
 const articles={
 'warning-signs':{title:'Recognize sudden warning signs.',source:'https://www.cdc.gov/stroke/signs-symptoms/index.html',sourceName:'CDC · Signs and Symptoms of Stroke',items:[['Balance and vision','Sudden loss of balance, trouble walking, dizziness, or vision changes may be warning signs.'],['Face, arm, and speech','Look for sudden facial drooping, one-sided weakness or numbness, or trouble speaking and understanding.'],['Act immediately','Seek emergency medical help even if symptoms improve. Note when the symptoms began. Do not wait for a research score.']]},
 'healthy-habits':{title:'Small habits. A broader health picture.',source:'https://www.cdc.gov/stroke/prevention/index.html',sourceName:'CDC · Preventing Stroke',items:[['Choose food and activity that support your health','A balanced diet with fruit, vegetables, and fiber, less salt, and appropriate regular physical activity supports cardiovascular health.'],['Avoid tobacco','If you smoke, ask a healthcare professional about support to quit. Avoid exposure to secondhand smoke.'],['Keep your care plan in view','Attend follow-up for diagnosed conditions and take prescribed medicines as directed. Ask your healthcare team about checking blood pressure and other measurements.']]},
 appointment:{title:'Prepare for a useful conversation.',source:'https://www.cdc.gov/stroke/risk-factors/index.html',sourceName:'CDC · Risk Factors for Stroke',items:[['Bring information with context','Take recent measurements, diagnosed conditions, your medicine list, and relevant health changes.'],['Ask about your overall health','Discuss blood pressure, diabetes, heart health, tobacco use, or other concerns with a qualified professional.'],['Explain what this index is','It is an uncalibrated research score for recorded stroke status. It cannot replace a medical assessment or establish your future stroke risk.']]}
 };const a=articles[id]??articles['warning-signs'];
 return heading('LEARN / HEALTH INFORMATION',a.title,'General information. Your healthcare team can help apply it to your situation.',button('← All topics','#/learn',true))+`<article class="layout-10 card"><ol class="tip-list">${a.items.map(([title,text],i)=>`<li><span class="number">${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></li>`).join('')}</ol><p class="tip-source">Source: <a href="${a.source}" target="_blank" rel="noopener noreferrer">${a.sourceName} ↗</a>. Consultation preparation also includes application-specific guidance.</p></article>${safetyNote()}`;
}
function research(){return heading('RESEARCH TRANSPARENCY','The model. Its results. Its limits.','NoSMOTE stacking from the supplied paper-aligned model. Internal results are not clinical validation.')+`<div class="tabs" role="tablist" aria-label="Research information">${[['model','Model overview'],['results','Internal results'],['thresholds','Thresholds & categories']].map(([v,l])=>`<button role="tab" id="research-tab-${v}" data-research-tab="${v}" aria-selected="${researchTab===v}" aria-controls="research-content">${l}</button>`).join('')}</div><div id="research-content" role="tabpanel" aria-labelledby="research-tab-${researchTab}">${researchContent()}</div>`;}
let researchTab='model';
function researchContent(){
 if(researchTab==='model')return `<div class="grid2"><section class="card"><div class="eyebrow">MODEL ARCHITECTURE</div><h2>Three base models.<br>One stacking output.</h2><div class="research-flow"><span>XGBoost<br>LightGBM<br>CatBoost</span><i>→</i><span>Logistic<br>Regression</span><i>→</i><span>Model<br>index × 100</span></div><p class="layout-11">The meta-learner receives the three raw base probabilities. No additional logit transformation is applied.</p></section><section class="card"><div class="eyebrow">INTERPRETATION BOUNDARIES</div><h2>Research use, with limits.</h2><ul class="tip-list"><li><span class="number">1</span><div><h3>Recorded status, not a future event</h3><p>The target is stroke status recorded in the research dataset.</p></div></li><li><span class="number">2</span><div><h3>No independent clinical validation</h3><p>Internal holdout performance does not establish performance in website users or hospitals.</p></div></li><li><span class="number">3</span><div><h3>No individual SHAP in this interface</h3><p>The input summary lists entries. It does not rank their contribution to your score.</p></div></li></ul></section></div>`;
 if(researchTab==='results'){
 const rows=model.metadata.holdout.scenarios;
 return `<section class="card"><div class="eyebrow">INTERNAL HOLDOUT · NOSMOTE STACKING</div><h2>Trade-offs across four decision thresholds.</h2><p class="layout-12 subtle">1,022 observations · 50 stroke labels · 972 non-stroke labels. Thresholds are displayed rounded.</p><div class="table-wrap"><table><thead><tr><th>Scenario</th><th>Threshold</th><th>Precision</th><th>Recall</th><th>F₂</th><th>TP</th><th>FP</th><th>FN</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.scenario==='clinical'?'highlight':''}"><td>${{default:'Standard',f2:'Maximum OOF F₂',clinical:'Clinical',precision_guard:'Precision guard'}[r.scenario]}</td><td>${r.threshold.toFixed(4)}</td><td>${fmt(r.Precision)}%</td><td>${fmt(r.Recall)}%</td><td>${r.F2.toFixed(4)}</td><td>${r.TP}</td><td>${r.FP}</td><td>${r.FN}</td></tr>`).join('')}</tbody></table></div><div class="metrics"><div class="metric"><strong>0.8402</strong><span>ROC-AUC · all scenarios</span></div><div class="metric"><strong>0.2372</strong><span>Average precision (AP)</span></div><div class="metric"><strong>214 / 254</strong><span>False positives / positive outputs · clinical</span></div></div><p class="mini-note">In the clinical scenario, 10 of 50 stroke labels were missed. High recall alone does not establish clinical usefulness; false positives and false negatives must both be considered.</p></section>`;
 }
 return `<div class="grid2"><section class="card"><div class="eyebrow">COMMUNICATION CATEGORIES</div><h2>Two boundaries.<br>Three explanations.</h2>${rangeRow('',true)}<p class="layout-11 lede">Index = model score × 100. The lower boundary is the clinical research threshold; the upper boundary is the precision guard threshold.</p><p class="mini-note">The labels communicate model output. They are not validated low-, medium-, or high-risk categories and do not assign clinical urgency.</p></section><section class="card"><div class="eyebrow">EXACT RESEARCH THRESHOLDS</div><dl class="key-value">${Object.entries(t).map(([k,v])=>`<div><dt>${{default:'Standard',f2:'Maximum OOF F₂',clinical:'Clinical',precision_guard:'Precision guard'}[k]}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="mini-note">Changing a binary decision scenario does not change the model score or the two communication-category boundaries. Full-precision values determine every comparison.</p></section></div>`;
}
function route(){
 const path=pageSegments(location.pathname);const page=path[0];
 state.requestId++;
 if(page==='safety'){state.safe=false;state.result=null;}
 if(page==='assessment'&&!state.safe){navigate('/analysis',true);return;}
 let html;
 if(page==='assessment')html=assessment(Math.max(1,Math.min(3,Number(path[1])||1)));
 else if(page==='safety')html=safety();
 else if(page==='results')html=results();
 else if(page==='learn')html=path[1]?article(path[1]):learn();
 else if(page==='research')html=research();
 else html=home();
 setView(html);document.title=`NeuroLume · ${{home:'Home',assessment:'Analysis',safety:'Symptom check',results:'Your result',learn:'Learn',research:'Research'}[page]||'Home'}`;
 document.querySelectorAll('nav a').forEach(a=>{const active=a.dataset.nav===page||(page==='safety'&&a.dataset.nav==='assessment')||(page==='results'&&a.dataset.nav==='assessment');if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 window.scrollTo({top:0,left:0,behavior:'instant'});app.focus({preventScroll:true});bind(page,path);
}
function saveFields(){
 const before=JSON.stringify(state.input);
 const form=document.getElementById('assessment-form');if(!form)return;
 for(const el of form.elements){if(!el.name)continue;if(el.type==='checkbox')state.input[el.name]=el.checked;else if(el.name==='bmi'&&document.getElementById('missing-bmi')?.checked)state.input.bmi=null;else if(['age','avg_glucose_level','bmi','hypertension','heart_disease'].includes(el.name))state.input[el.name]=el.value===''?'':Number(el.value);else state.input[el.name]=el.value;}
 if(before!==JSON.stringify(state.input))state.result=null;
}
function bind(page,path){
 app.querySelectorAll('[data-result-tab]').forEach(b=>b.addEventListener('click',()=>{state.resultTab=b.dataset.resultTab;setView(results());bind('results',[]);}));
 app.querySelectorAll('[data-research-tab]').forEach(b=>b.addEventListener('click',()=>{researchTab=b.dataset.researchTab;setView(research());bind('research',[]);}));
 
 if(page==='safety'){
  const checks=app.querySelectorAll('input[name="symptom"]');const next=document.getElementById('no-symptoms');
  checks.forEach(input=>input.addEventListener('change',()=>{const urgent=[...checks].some(c=>c.checked);next.disabled=urgent;next.textContent=urgent?'Please get medical help first':'None of these — continue →';document.getElementById('symptom-message').innerHTML=urgent?notice('This is a warning, not a stroke diagnosis.','These symptoms can have several causes, including stroke. Please seek immediate medical assessment, even if they improve or stop. Contact local emergency medical services and do not wait for a research score.','gold'):notice('When in doubt, get medical advice.','New, sudden warning signs need immediate medical assessment. The app cannot confirm or rule out stroke.','soft compact');}));
  next.addEventListener('click',()=>{state.safe=true;state.result=null;navigate('/assessment/1');});
 }
 if(page==='assessment'){
  const form=document.getElementById('assessment-form');const step=Math.max(1,Math.min(3,Number(path[1])||1));
  form.addEventListener('input',saveFields);form.addEventListener('change',saveFields);
  const missing=document.getElementById('missing-bmi');if(missing)missing.addEventListener('change',()=>{const b=form.elements.bmi;b.disabled=missing.checked;if(missing.checked){b.value='';state.input.bmi=null;}else state.input.bmi='';});
  document.getElementById('calculate-bmi')?.addEventListener('click',()=>{const h=Number(document.getElementById('bmi-height').value),w=Number(document.getElementById('bmi-weight').value);const hint=document.getElementById('bmi-hint');if(h<50||h>250||w<10||w>400){hint.textContent='Enter a height from 50–250 cm and a weight from 10–400 kg.';return;}const bmi=w/((h/100)**2);form.elements.bmi.disabled=false;missing.checked=false;form.elements.bmi.value=bmi.toFixed(1);state.input.bmi=Number(bmi.toFixed(1));hint.textContent='Calculated BMI entered. Check your measurements and their context.';});
  form.addEventListener('submit',async e=>{e.preventDefault();if(state.pending)return;saveFields();if(step<3){navigate(`/assessment/${step+1}`);return;}const errorBox=document.getElementById('form-error');if(!state.safe){errorBox.textContent='Please complete the sudden-symptom check first using Analysis → Start a new analysis.';return;}
  const input=Object.fromEntries(model.metadata.features.map(k=>[k,state.input[k]===undefined||state.input[k]===''?null:state.input[k]]));
  const submit=form.querySelector('button[type=submit]');const requestId=++state.requestId;state.pending=true;submit.disabled=true;submit.textContent='Calculating…';errorBox.textContent='';
  try{const response=await fetch('/api/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,consent:!!state.input.acknowledge,sudden_symptoms:false,threshold_mode:state.mode})});const result=await response.json();if(requestId!==state.requestId)return;if(!response.ok){errorBox.textContent=friendlyError(result.detail);return;}if(result.status!=='ok'||!Number.isFinite(result.score)){errorBox.textContent='The model could not calculate this profile. Please try again.';return;}state.result=result;state.resultTab='overview';navigate('/results');}catch{if(requestId===state.requestId)errorBox.textContent='Unable to connect. Your answers are still here; please try again.';}finally{state.pending=false;if(submit.isConnected){submit.disabled=false;submit.textContent='View research result ↗';}}});
 }
}


function canonical(path){
 path=path.replace(/^#/, '');
 if(path==='/home'||path==='/')return '/';
 if(path==='/safety')return '/analysis';
 const step=path.match(/^\/assessment\/([123])$/);
 if(step)return ['/analysis/about','/analysis/history','/analysis/measurements'][Number(step[1])-1];
 return path;
}
function pageSegments(path){
 const p=path.replace(/\/$/,'')||'/';
 if(p==='/')return ['home'];
 if(p==='/analysis')return ['safety'];
 const steps={'/analysis/about':'1','/analysis/history':'2','/analysis/measurements':'3'};
 if(steps[p])return ['assessment',steps[p]];
 return p.split('/').filter(Boolean);
}
function setView(html){
 app.innerHTML=html.replace(/href="(#[^"]*)"/g,(_,p)=>'href="'+canonical(p)+'"');
 bindKeyboardTabs();
}
function navigate(path,replace=false){
 saveFields();const url=canonical(path);
 history[replace?'replaceState':'pushState']({},'',url);route();
}
function friendlyError(detail){
 const message=String(detail||'Please review your information and try again.');
 const names={avg_glucose_level:'Glucose measurement',bmi:'BMI',age:'Age',hypertension:'Hypertension history',heart_disease:'Heart disease history'};
 for(const [key,label] of Object.entries(names))if(message.startsWith(key+':'))return label+': '+message.split(':').slice(1).join(':').trim();
 return message;
}
function bindKeyboardTabs(){
 app.querySelectorAll('[role="tablist"]').forEach(list=>{
  const tabs=[...list.querySelectorAll('[role="tab"]')];tabs.forEach((tab,index)=>{
   tab.tabIndex=tab.getAttribute('aria-selected')==='true'?0:-1;
   tab.addEventListener('keydown',e=>{let next=index;
    if(e.key==='ArrowRight')next=(index+1)%tabs.length;else if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;
    e.preventDefault();tabs[next].click();app.querySelectorAll('[role="tablist"]')[0]?.querySelectorAll('[role="tab"]')[next]?.focus();
   });
  });
 });
}
document.addEventListener('click',e=>{
 const a=e.target.closest('a[href]');if(!a||a.target||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const url=new URL(a.getAttribute('href'),location.href);
 if(url.origin!==location.origin||a.hasAttribute('download')||a.classList.contains('skip-link'))return;
 e.preventDefault();
 if(a.dataset.newAnalysis){state.input={};state.result=null;state.safe=false;}
 navigate(url.hash.startsWith('#/')?url.hash:url.pathname);
});
window.addEventListener('popstate',route);
route();

})().catch(()=>{
 const app=document.getElementById('app');
 app.innerHTML='<section class="card empty-state"><h1>We could not load the model.</h1><p>Please check your connection and reload this page.</p><button class="btn" id="reload-app">Reload page</button></section>';
 document.getElementById('reload-app').addEventListener('click',()=>location.reload());
});
