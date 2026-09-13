import cloudpickle
import numpy as np
import pandas as pd

def load_model(path):
    # Trusted files only.
    with open(path, 'rb') as f: return cloudpickle.load(f)

def _positive_probability(model, frame):
    classes = list(model.classes_)
    if 1 not in classes:
        raise ValueError('Model tidak memiliki kelas positif 1.')
    return model.predict_proba(frame)[:, classes.index(1)]


def _prepare_frame(bundle, frame):
    features=bundle['features']
    if frame.empty or set(frame.columns)!=set(features):
        raise ValueError('Input harus berisi tepat 10 fitur, tanpa ID/label.')
    frame=frame[features].copy()
    for c in ['age','avg_glucose_level','bmi','hypertension','heart_disease']:
        frame[c]=pd.to_numeric(frame[c],errors='raise')
        if np.isinf(frame[c].to_numpy(float)).any(): raise ValueError('Inf input')
    for c in ['hypertension','heart_disease']:
        if not set(frame[c].dropna()).issubset({0,1}): raise ValueError(c)
        frame[c]=frame[c].map(lambda v:str(int(v)) if pd.notna(v) else np.nan)
    for c in ['gender','ever_married','work_type','Residence_type','smoking_status']:
        frame[c]=frame[c].map(lambda v:str(v) if pd.notna(v) else np.nan)
    return frame[features].copy()


def predict_detail(bundle, frame):
    frame = _prepare_frame(bundle, frame)
    fitted=bundle['model']
    base_probabilities = {
        name: _positive_probability(model, frame)
        for name, model in zip(['XGBoost', 'LightGBM', 'CatBoost'], fitted['models'])
    }
    z=np.column_stack(list(base_probabilities.values()))
    q=np.clip(z,1e-5,1-1e-5)
    p=fitted['meta'].predict_proba(np.log(q/(1-q)))[:,1]
    result = {
        'model_score_0_100': 100 * p,
        'above_research_threshold': p >= bundle['thresholds']['Stacking']['threshold'],
    }
    for name, values in base_probabilities.items():
        result[f'{name}_score_0_100'] = 100 * values
    return pd.DataFrame(result, index=frame.index)


def predict(bundle, frame):
    return predict_detail(bundle, frame)[['model_score_0_100', 'above_research_threshold']]
