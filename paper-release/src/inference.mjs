const sigmoid = x => x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));

function preprocess(input, spec) {
  const values = [];
  spec.numeric_columns.forEach((column, i) => {
    const raw = input[column];
    const value = raw === null || raw === undefined ? spec.numeric_medians[i] : Number(raw);
    values.push((value - spec.numeric_means[i]) / spec.numeric_scales[i]);
  });
  spec.categorical_columns.forEach(column => {
    const raw = input[column];
    const value = raw === null || raw === undefined ? spec.categorical_fill[column] : String(raw);
    spec.categories[column].forEach(category => values.push(value === category ? 1 : 0));
  });
  return values;
}

function xgbTree(node, features, names) {
  while (!Object.hasOwn(node, 'leaf')) {
    const index = names ? names.indexOf(node.split) : Number(String(node.split).replace(/^f/, ''));
    if (index < 0 || !Number.isInteger(index)) throw new Error('Unknown XGBoost feature');
    const value = Math.fround(features[index]);
    const id = Number.isNaN(value) ? node.missing
      : value < Math.fround(node.split_condition) ? node.yes : node.no;
    node = node.children.find(child => child.nodeid === id);
  }
  return Math.fround(node.leaf);
}

function xgb(spec, features) {
  const base = Math.fround(spec.base_score);
  let margin = Math.fround(Math.log(base / (1-base)));
  for (const tree of spec.trees) margin = Math.fround(margin + xgbTree(tree, features, spec.feature_names));
  return Math.fround(1 / Math.fround(1 + Math.fround(Math.exp(-margin))));
}

function lgbTree(node, features) {
  while (!Object.hasOwn(node, 'leaf_value')) {
    const value = features[node.split_feature];
    if (node.decision_type !== '<=') throw new Error('Unsupported LightGBM split');
    node = (Number.isNaN(value) ? node.default_left : value <= Number(node.threshold))
      ? node.left_child : node.right_child;
  }
  return node.leaf_value;
}

function lgb(spec, features) {
  return sigmoid(spec.model.tree_info.reduce((sum, tree) => sum + lgbTree(tree.tree_structure, features), 0));
}

function cat(spec, features) {
  let margin = 0;
  for (const tree of spec.model.oblivious_trees) {
    let leaf = 0;
    tree.splits.forEach((split, depth) => {
      if (Math.fround(features[split.float_feature_index]) > split.border) leaf |= 1 << depth;
    });
    margin += tree.leaf_values[leaf];
  }
  const [scale, bias] = spec.model.scale_and_bias;
  return sigmoid(margin * scale + bias[0]);
}

export function scoreComponents(model, input) {
  if (model.meta.input !== 'raw_base_probabilities') throw new Error('Unsupported meta input');
  const scores = model.models.map(entry => {
    const features = preprocess(input, entry.preprocessor);
    return entry.estimator.kind === 'xgboost' ? xgb(entry.estimator, features)
      : entry.estimator.kind === 'lightgbm' ? lgb(entry.estimator, features)
      : cat(entry.estimator, features);
  });
  return scores;
}

export function scoreModel(model, input) {
  const scores = scoreComponents(model, input);
  return sigmoid(model.meta.intercept + scores.reduce((sum, p, i) => sum + p * model.meta.coefficients[i], 0));
}

export function category(model, score) {
  const t = model.metadata.thresholds;
  if (score >= t.precision_guard) return {code:'higher', label:'Higher model score',
    description:'The score meets or exceeds the research precision guard threshold. Discuss this output and your health with a healthcare professional.'};
  if (score >= t.clinical) return {code:'attention', label:'Needs attention',
    description:'The score meets or exceeds the research clinical threshold. Interpret it together with your medical history and a clinical assessment.'};
  return {code:'below', label:'Below the research threshold',
    description:'The score is below the research clinical threshold. This does not rule out stroke or replace a medical assessment.'};
}
