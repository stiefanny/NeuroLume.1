const MODEL_URL = "/model/neurolume-portable-model.json";
let modelPromise;

const sigmoid = value => value >= 0
  ? 1 / (1 + Math.exp(-value))
  : Math.exp(value) / (1 + Math.exp(value));

function addEngineered(input) {
  const age = Number(input.age);
  const glucose = Number(input.avg_glucose_level);
  const bmi = Number(input.bmi);
  const hypertension = input.hypertension === null ? Number.NaN : Number(input.hypertension);
  const heartDisease = input.heart_disease === null ? Number.NaN : Number(input.heart_disease);
  return {
    ...input,
    age_sq: age * age,
    log_glucose: Math.log1p(glucose),
    bmi_sq: bmi * bmi,
    age_x_glucose: age * glucose,
    age_x_hypertension: age * hypertension,
    age_x_heart_disease: age * heartDisease,
  };
}

function preprocess(input, spec) {
  const row = spec.engineered ? addEngineered(input) : input;
  const values = [];
  spec.numeric_columns.forEach((column, index) => {
    const raw = Number(row[column]);
    const value = Number.isFinite(raw) ? raw : spec.numeric_medians[index];
    values.push((value - spec.numeric_means[index]) / spec.numeric_scales[index]);
  });
  spec.categorical_columns.forEach(column => {
    const raw = row[column];
    const value = raw === null || raw === undefined || raw === ""
      ? spec.categorical_fill[column]
      : String(raw);
    spec.categories[column].forEach(category => values.push(value === category ? 1 : 0));
  });
  return values;
}

function xgboostTree(node, features) {
  if (Object.prototype.hasOwnProperty.call(node, "leaf")) return node.leaf;
  const index = Number(String(node.split).replace(/^f/, ""));
  // XGBoost receives the transformed matrix as float32.
  const value = Math.fround(features[index]);
  const nextId = Number.isNaN(value)
    ? node.missing
    : value < Math.fround(node.split_condition) ? node.yes : node.no;
  return xgboostTree(node.children.find(child => child.nodeid === nextId), features);
}

function predictXGBoost(spec, features) {
  const baseMargin = Math.log(spec.base_score / (1 - spec.base_score));
  const margin = spec.trees.reduce((sum, tree) => sum + xgboostTree(tree, features), baseMargin);
  return sigmoid(margin);
}

function lightgbmTree(node, features) {
  if (Object.prototype.hasOwnProperty.call(node, "leaf_value")) return node.leaf_value;
  const value = features[node.split_feature];
  const goLeft = Number.isNaN(value) ? node.default_left : value <= Number(node.threshold);
  return lightgbmTree(goLeft ? node.left_child : node.right_child, features);
}

function predictLightGBM(spec, features) {
  const margin = spec.model.tree_info.reduce(
    (sum, tree) => sum + lightgbmTree(tree.tree_structure, features), 0,
  );
  return sigmoid(margin);
}

function predictCatBoost(spec, features) {
  const model = spec.model;
  let margin = 0;
  for (const tree of model.oblivious_trees) {
    let leafIndex = 0;
    tree.splits.forEach((split, depth) => {
      // CatBoost quantizes float features as float32 before comparing borders.
      const value = Math.fround(features[split.float_feature_index]);
      if (value > split.border) leafIndex |= (1 << depth);
    });
    margin += tree.leaf_values[leafIndex];
  }
  const scaleAndBias = model.scale_and_bias || [1, [0]];
  margin = margin * Number(scaleAndBias[0]) + Number(scaleAndBias[1]?.[0] || 0);
  return sigmoid(margin);
}

export function evaluatePortableModel(model, input) {
  const scores = {};
  for (const entry of model.models) {
    const features = preprocess(input, entry.preprocessor);
    if (entry.estimator.kind === "xgboost") scores[entry.name] = predictXGBoost(entry.estimator, features);
    else if (entry.estimator.kind === "lightgbm") scores[entry.name] = predictLightGBM(entry.estimator, features);
    else if (entry.estimator.kind === "catboost") scores[entry.name] = predictCatBoost(entry.estimator, features);
    else throw new Error(`Jenis model tidak didukung: ${entry.estimator.kind}`);
  }
  const names = ["XGBoost", "LightGBM", "CatBoost"];
  const clip = model.meta.clip;
  const logitScores = names.map(name => {
    const probability = Math.min(1 - clip, Math.max(clip, scores[name]));
    return Math.log(probability / (1 - probability));
  });
  const margin = model.meta.intercept + model.meta.coefficients.reduce(
    (sum, coefficient, index) => sum + coefficient * logitScores[index], 0,
  );
  scores.Stacking = sigmoid(margin);
  return scores;
}

export async function loadPortableModel(url = MODEL_URL) {
  if (!modelPromise || url !== MODEL_URL) {
    modelPromise = fetch(url, { cache: "force-cache" }).then(response => {
      if (!response.ok) throw new Error("Berkas model NoSMOTE tidak dapat dimuat.");
      return response.json();
    });
  }
  return modelPromise;
}

function levelFromScore(score, cutoffs) {
  if (score < cutoffs.low_upper_threshold) return "Pantau dan Jaga Kesehatan";
  if (score < cutoffs.consult_threshold) return "Perlu Perhatian";
  return "Disarankan Konsultasi";
}

function guidance(input, level) {
  const factors = [];
  if (Number(input.age) >= 55) factors.push({ name: "Usia", direction: "up", note: "Usia perlu dibahas bersama faktor kesehatan lain." });
  if (Number(input.avg_glucose_level) >= 126) factors.push({ name: "Rerata glukosa", direction: "up", note: "Nilai yang dimasukkan cukup tinggi dan layak dikonfirmasi tenaga kesehatan." });
  if (Number(input.hypertension) === 1) factors.push({ name: "Riwayat hipertensi", direction: "up", note: "Hipertensi tercatat sebagai faktor input penting pada model." });
  if (Number(input.heart_disease) === 1) factors.push({ name: "Riwayat penyakit jantung", direction: "up", note: "Riwayat ini ikut memengaruhi pola yang dibaca model." });
  if (input.smoking_status === "smokes") factors.push({ name: "Masih merokok", direction: "up", note: "Kebiasaan merokok perlu dibicarakan dalam pencegahan stroke." });
  if (Number(input.bmi) >= 30) factors.push({ name: "BMI", direction: "up", note: "BMI yang dimasukkan berada pada rentang yang perlu ditinjau bersama tenaga kesehatan." });
  if (!factors.length) factors.push({ name: "Gabungan profil", direction: "down", note: "Tidak ada satu jawaban yang berdiri sendiri; skor berasal dari gabungan seluruh input." });

  const tips = [
    "Pantau tekanan darah, gula darah, dan kolesterol melalui pemeriksaan yang sesuai.",
    "Pertahankan aktivitas fisik, pola makan seimbang, tidur cukup, dan hindari rokok.",
  ];
  if (level === "Disarankan Konsultasi") tips.unshift("Buat jadwal konsultasi untuk meninjau faktor risiko dan membawa hasil pemeriksaan terbaru.");
  else if (level === "Perlu Perhatian") tips.unshift("Pertimbangkan pemeriksaan faktor risiko dan diskusikan hasilnya dengan tenaga kesehatan.");
  else tips.unshift("Terus jaga kebiasaan sehat dan lakukan pemeriksaan rutin sesuai anjuran tenaga kesehatan.");
  return { factors: factors.slice(0, 5), tips };
}

export async function analyzePatient(input) {
  const model = await loadPortableModel();
  const scores = evaluatePortableModel(model, input);
  const level = levelFromScore(scores.Stacking, model.cutoffs);
  const info = guidance(input, level);
  return {
    score: scores.Stacking * 100,
    level,
    factors: info.factors,
    tips: info.tips,
    modelScores: {
      XGBoost: scores.XGBoost * 100,
      LightGBM: scores.LightGBM * 100,
      CatBoost: scores.CatBoost * 100,
    },
  };
}
