"""Export the trusted paper bundle for Cloudflare; never train or tune."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import tempfile

import numpy as np
import pandas as pd


def clean(value):
    if isinstance(value, dict):
        return {str(k): clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, np.ndarray)):
        return [clean(v) for v in value]
    if isinstance(value, np.generic):
        return clean(value.item())
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def preprocessor(pipeline):
    t = pipeline.named_steps['preprocessor']
    n, c = t.named_transformers_['num'], t.named_transformers_['cat']
    num_columns, cat_columns = list(t.transformers_[0][2]), list(t.transformers_[1][2])
    return clean(dict(
        numeric_columns=num_columns, categorical_columns=cat_columns,
        numeric_medians=n.named_steps['imputer'].statistics_,
        numeric_means=n.named_steps['scaler'].mean_,
        numeric_scales=n.named_steps['scaler'].scale_,
        categorical_fill={k: str(v) for k, v in zip(cat_columns, c.named_steps['imputer'].statistics_)},
        categories={k: [str(v) for v in vs] for k, vs in zip(cat_columns, c.named_steps['encoder'].categories_)}))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve()
    root = Path(__file__).resolve().parents[1]
    sys.path.insert(0, str(source))
    from app.engine import Engine
    engine = Engine()  # verifies original hash, versions, feature order, thresholds
    bundle = engine.bundle
    entries = []
    for name in bundle['base_names']:
        pipeline = bundle['fitted_base_models'][name]
        estimator = pipeline.named_steps['classifier']
        if name == 'XGBoost':
            booster = estimator.get_booster()
            config = json.loads(booster.save_config())['learner']
            assert config['objective']['name'] == 'binary:logistic'
            spec = dict(kind='xgboost', feature_names=booster.feature_names,
                        base_score=float(config['learner_model_param']['base_score']),
                        trees=[json.loads(t) for t in booster.get_dump(dump_format='json')])
        elif name == 'LightGBM':
            spec = dict(kind='lightgbm', model=estimator.booster_.dump_model())
        elif name == 'CatBoost':
            with tempfile.NamedTemporaryFile(suffix='.json') as f:
                estimator.save_model(f.name, format='json')
                spec = dict(kind='catboost', model=json.loads(Path(f.name).read_text()))
            assert all(s['split_type'] == 'FloatFeature' for t in spec['model']['oblivious_trees'] for s in t['splits'])
        else:
            raise ValueError(name)
        entries.append(dict(name=name, preprocessor=preprocessor(pipeline), estimator=spec))
    model = clean(dict(format='neurolume-cloudflare-paper-v1',
                       metadata=engine.metadata, models=entries,
                       meta=dict(input='raw_base_probabilities',
                                 coefficients=bundle['meta_model'].coef_[0],
                                 intercept=bundle['meta_model'].intercept_[0])))
    model_path = root/'src/model.json'
    model_path.write_text(json.dumps(model, ensure_ascii=False, separators=(',', ':')))

    reference = pd.read_csv(source/'tests/holdout_reference.csv', float_precision='round_trip')
    x = reference[bundle['feature_columns']]
    actual = engine.predict(x).risk_probability.to_numpy()
    assert np.max(np.abs(actual-reference.expected_score.to_numpy())) < 1e-10
    fixture = [dict(input=clean(row), expected_score=float(score), stroke=int(y))
               for row, score, y in zip(x.to_dict('records'), actual, reference.stroke)]
    rng = np.random.default_rng(42)
    extra = x.iloc[rng.integers(0, len(x), size=180)].copy().reset_index(drop=True)
    extra['age'] = rng.uniform(18, 100, len(extra))
    extra['avg_glucose_level'] = rng.uniform(40, 300, len(extra))
    extra['bmi'] = rng.uniform(10, 70, len(extra))
    extra.loc[::3, 'bmi'] = np.nan
    extra_scores = engine.predict(extra).risk_probability.to_numpy()
    extras = [dict(input=clean(row), expected_score=float(score))
              for row, score in zip(extra.to_dict('records'), extra_scores)]
    # Test inputs remain local/offline. They are never included in public/.
    (root/'tests/parity-fixtures.json').write_text(json.dumps(dict(holdout=fixture, extra=extras), allow_nan=False))
    print(json.dumps(dict(model_bytes=model_path.stat().st_size,
                          model_sha256=hashlib.sha256(model_path.read_bytes()).hexdigest(),
                          source_sha256=engine.metadata['model_sha256'],
                          holdout=len(fixture), extra=len(extras),
                          python_max_error=float(np.max(np.abs(actual-reference.expected_score.to_numpy())))), indent=2))


if __name__ == '__main__':
    main()
