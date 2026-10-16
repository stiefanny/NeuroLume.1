'use strict';
const $ = (id) => document.getElementById(id);
let research = false, ready = false, generation = 0, controller = null;
const scenarioNames = {default: 'Standar', f2: 'Maksimum F₂ OOF', clinical: 'Clinical', precision_guard: 'Precision guard'};
const form = $('patient-form');
function setMode(value) {
  research = value;
  $('public-mode').classList.toggle('active', !value);
  $('research-mode').classList.toggle('active', value);
  $('public-mode').setAttribute('aria-pressed', String(!value));
  $('research-mode').setAttribute('aria-pressed', String(value));
  $('research-controls').hidden = !value;
  $('research-panel').hidden = !value;
  // A previous research decision must not be mistaken for the default public mode.
  invalidate();
  if (!value) form.elements.threshold_mode.value = 'clinical';
}
function invalidate() {
  generation += 1;
  if (controller) controller.abort();
  controller = null;
  $('result').hidden = true;
  $('submit-button').disabled = !ready;
}
function symptomState() {
  const urgent = form.elements.sudden_symptoms.value === 'yes';
  $('clinical-fields').disabled = urgent;
  $('urgent-message').hidden = !urgent;
  if (urgent) invalidate();
}
$('public-mode').addEventListener('click', () => setMode(false));
$('research-mode').addEventListener('click', () => setMode(true));
$('open-research').addEventListener('click', () => setMode(true));
form.addEventListener('input', () => { invalidate(); symptomState(); });
form.addEventListener('change', () => { invalidate(); symptomState(); });
form.addEventListener('reset', () => {
  invalidate(); $('service-error').hidden = true;
  window.setTimeout(symptomState, 0);
});
function appendText(tag, text, parent) {
  const el = document.createElement(tag); el.textContent = text; parent.appendChild(el); return el;
}
async function start() {
  $('submit-button').disabled = true;
  try {
    const response = await fetch('/api/model', {cache: 'no-store'});
    if (!response.ok) throw new Error('Model belum siap. Jalankan server sesuai README.');
    const model = await response.json();
    ready = true; $('submit-button').disabled = false;
    $('model-status').textContent = 'Model NoSMOTE siap';
    $('metrics-table').replaceChildren();
    model.holdout.scenarios.forEach(row => {
      const tr = document.createElement('tr');
      [scenarioNames[row.scenario], row.threshold.toFixed(4), (row.Precision*100).toFixed(2)+'%',
        (row.Recall*100).toFixed(2)+'%', row.F2.toFixed(4), `${row.TP} / ${row.FP} / ${row.FN}`]
        .forEach(value => appendText('td', String(value), tr));
      $('metrics-table').appendChild(tr);
    });
    const ranking = model.holdout.scenarios[0];
    $('model-provenance').textContent = `Artefak: ${model.model_id}. Skor dasar digabung langsung; tanpa transformasi logit tambahan. ROC-AUC ${ranking['ROC-AUC'].toFixed(4)}; AP ${ranking['PR-AUC'].toFixed(4)}.`;
  } catch (err) {
    $('model-status').textContent = 'Model belum tersedia';
    $('service-error').textContent = err.message; $('service-error').hidden = false;
  }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (form.elements.sudden_symptoms.value === 'yes') { symptomState(); return; }
  if (!ready || !form.reportValidity()) return;
  invalidate(); const ticket = generation;
  const f = new FormData(form);
  const record = {};
  ['age', 'avg_glucose_level', 'bmi', 'hypertension', 'heart_disease'].forEach(name => {
    const raw = f.get(name); record[name] = raw === '' ? null : Number(raw);
  });
  ['gender', 'ever_married', 'work_type', 'Residence_type', 'smoking_status'].forEach(name => {record[name] = f.get(name);});
  record.consent = f.get('consent') === 'on'; record.sudden_symptoms = false;
  record.threshold_mode = research ? f.get('threshold_mode') : 'clinical';
  $('submit-button').disabled = true; $('model-status').textContent = 'Menghitung keluaran model…';
  $('service-error').hidden = true;
  const requestController = new AbortController();
  controller = requestController;
  const timeout = window.setTimeout(() => requestController.abort(), 30000);
  try {
    const response = await fetch('/api/predict', {method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(record), signal: requestController.signal});
    const result = await response.json();
    if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Periksa kelengkapan, kategori, dan satuan masukan.');
    if (ticket !== generation) return;
    if (result.status === 'urgent') { $('urgent-message').textContent = result.message; $('urgent-message').hidden = false; return; }
    $('score').textContent = result.index.toFixed(2); $('score-bar').value = result.index;
    $('category').textContent = result.category.label;
    $('category-description').textContent = result.category.description;
    $('result-message').textContent = result.message;
    $('input-summary').replaceChildren();
    result.input_summary.forEach(item => {appendText('dt', item.label, $('input-summary')); appendText('dd', item.value, $('input-summary'));});
    $('warnings').replaceChildren(); result.warnings.forEach(text => appendText('li', text, $('warnings')));
    $('binary-detail').hidden = !research;
    $('binary-detail').textContent = `Keputusan biner: ${result.decision === 1 ? 'positif' : 'negatif'} pada ${scenarioNames[result.threshold_mode]} (τ = ${result.threshold.toFixed(7)}). Kategori komunikasi memakai batas clinical dan precision guard yang tetap.`;
    $('result').hidden = false; $('result').focus(); $('result').scrollIntoView({behavior: 'smooth', block: 'start'});
  } catch (err) {
    if (ticket !== generation) return;
    $('service-error').textContent = err.name === 'AbortError' ? 'Permintaan berhenti. Silakan coba kembali.' : err.message;
    $('service-error').hidden = false;
  } finally {
    window.clearTimeout(timeout);
    if (ticket === generation) {$('submit-button').disabled = !ready; $('model-status').textContent = 'Model NoSMOTE siap'; controller = null;}
  }
});
start();
