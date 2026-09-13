"""Export the trusted NoSMOTE bundle to a browser-portable JSON representation.

Run with the exact Python/library versions recorded in the research bundle.  The
export is deterministic and does not train, tune, or change any model parameter.
"""

from __future__ import annotations

import json
import math
import tempfile
from pathlib import Path

import cloudpickle
import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
BUNDLE_PATH = ROOT / "model" / "neurolume_acc_model.pkl"
CUTOFF_PATH = ROOT / "model" / "three_level_cutoffs.json"
OUTPUT_PATH = ROOT / "public" / "model" / "neurolume-portable-model.json"
FIXTURE_PATH = ROOT / "tests" / "model-parity-fixtures.json"


def jsonable(value):
    if isinstance(value, np.ndarray):
        return value.tolist()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, dict):
        return {str(k): jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [jsonable(v) for v in value]
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def export_preprocessor(candidate):
    transformer = candidate.transformer
    numeric = transformer.named_transformers_["num"]
    categorical = transformer.named_transformers_["cat"]
    num_columns = list(transformer.transformers_[0][2])
    cat_columns = list(transformer.transformers_[1][2])
    imputer = numeric.named_steps["imputer"]
    scaler = numeric.named_steps["scaler"]
    cat_imputer = categorical.named_steps["imputer"]
    onehot = categorical.named_steps["onehot"]
    return {
        "engineered": bool(candidate.feature_builder.enabled),
        "numeric_columns": num_columns,
        "categorical_columns": cat_columns,
        "numeric_medians": jsonable(imputer.statistics_),
        "numeric_means": jsonable(scaler.mean_),
        "numeric_scales": jsonable(scaler.scale_),
        "categorical_fill": {
            column: str(value)
            for column, value in zip(cat_columns, cat_imputer.statistics_)
        },
        "categories": {
            column: [str(value) for value in values]
            for column, values in zip(cat_columns, onehot.categories_)
        },
        "output_features": list(transformer.get_feature_names_out()),
    }


def export_xgboost(estimator):
    booster = estimator.get_booster()
    config = json.loads(booster.save_config())
    learner = config["learner"]
    objective = learner["objective"]["name"]
    base_score = float(learner["learner_model_param"]["base_score"].strip("[]"))
    return {
        "kind": "xgboost",
        "objective": objective,
        "base_score": base_score,
        "trees": [json.loads(tree) for tree in booster.get_dump(dump_format="json")],
    }


def export_lightgbm(estimator):
    return {"kind": "lightgbm", "model": estimator.booster_.dump_model()}


def export_catboost(estimator):
    with tempfile.NamedTemporaryFile(suffix=".json") as temporary:
        estimator.save_model(temporary.name, format="json")
        temporary.seek(0)
        model = json.load(temporary)
    return {"kind": "catboost", "model": model}


def make_profiles(count=160):
    rng = np.random.default_rng(20260912)
    options = {
        "gender": ["Female", "Male", "Other"],
        "hypertension": ["0", "1"],
        "heart_disease": ["0", "1"],
        "ever_married": ["No", "Yes"],
        "work_type": ["Govt_job", "Never_worked", "Private", "Self-employed", "children", "Other"],
        "Residence_type": ["Rural", "Urban"],
        "smoking_status": ["Unknown", "formerly smoked", "never smoked", "smokes"],
    }
    rows = [
        {"age": 18, "avg_glucose_level": 40, "bmi": 10, "gender": "Female", "hypertension": "0", "heart_disease": "0", "ever_married": "No", "work_type": "Never_worked", "Residence_type": "Rural", "smoking_status": "Unknown"},
        {"age": 100, "avg_glucose_level": 300, "bmi": 70, "gender": "Male", "hypertension": "1", "heart_disease": "1", "ever_married": "Yes", "work_type": "Self-employed", "Residence_type": "Urban", "smoking_status": "smokes"},
        {"age": 52, "avg_glucose_level": 108.4, "bmi": 27.6, "gender": "Female", "hypertension": "1", "heart_disease": "0", "ever_married": "Yes", "work_type": "Private", "Residence_type": "Urban", "smoking_status": "never smoked"},
        {"age": 61, "avg_glucose_level": 117.2, "bmi": 28.1, "gender": "Male", "hypertension": None, "heart_disease": None, "ever_married": None, "work_type": "Other", "Residence_type": None, "smoking_status": "Unknown"},
    ]
    while len(rows) < count:
        row = {
            "age": round(float(rng.uniform(18, 100)), 3),
            "avg_glucose_level": round(float(rng.uniform(40, 300)), 3),
            "bmi": round(float(rng.uniform(10, 70)), 3),
        }
        for key, values in options.items():
            row[key] = values[int(rng.integers(0, len(values)))]
        rows.append(row)
    return rows


def predict_python(bundle, profiles):
    frame = pd.DataFrame(profiles)[bundle["features"]].copy()
    for column in ["hypertension", "heart_disease"]:
        frame[column] = frame[column].map(lambda value: str(int(value)) if pd.notna(value) else np.nan)
    for column in ["gender", "ever_married", "work_type", "Residence_type", "smoking_status"]:
        frame[column] = frame[column].map(lambda value: str(value) if pd.notna(value) else np.nan)
    probabilities = []
    for candidate in bundle["model"]["models"]:
        probabilities.append(candidate.predict_proba(frame)[:, 1])
    base = np.column_stack(probabilities)
    clipped = np.clip(base, 1e-5, 1 - 1e-5)
    stacking = bundle["model"]["meta"].predict_proba(np.log(clipped / (1 - clipped)))[:, 1]
    return base, stacking


def main():
    with BUNDLE_PATH.open("rb") as handle:
        bundle = cloudpickle.load(handle)
    cutoffs = json.loads(CUTOFF_PATH.read_text(encoding="utf-8"))
    candidates = bundle["model"]["models"]
    estimators = [c.estimator for c in candidates]
    portable = {
        "format": "neurolume-portable-v1",
        "variant": "NoSMOTE",
        "source_sha256": bundle.get("dataset_sha256"),
        "features": list(bundle["features"]),
        "models": [
            {"name": "XGBoost", "preprocessor": export_preprocessor(candidates[0]), "estimator": export_xgboost(estimators[0])},
            {"name": "LightGBM", "preprocessor": export_preprocessor(candidates[1]), "estimator": export_lightgbm(estimators[1])},
            {"name": "CatBoost", "preprocessor": export_preprocessor(candidates[2]), "estimator": export_catboost(estimators[2])},
        ],
        "meta": {
            "classes": jsonable(bundle["model"]["meta"].classes_),
            "coefficients": jsonable(bundle["model"]["meta"].coef_[0]),
            "intercept": float(bundle["model"]["meta"].intercept_[0]),
            "clip": 1e-5,
        },
        "cutoffs": cutoffs,
        "clinical_validation": False,
        "notice": "Skor indeks model penelitian, bukan probabilitas klinis atau diagnosis.",
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(jsonable(portable), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    profiles = make_profiles()
    base, stacking = predict_python(bundle, profiles)
    fixtures = []
    for index, profile in enumerate(profiles):
        fixtures.append({
            "input": profile,
            "expected": {
                "XGBoost": float(base[index, 0]),
                "LightGBM": float(base[index, 1]),
                "CatBoost": float(base[index, 2]),
                "Stacking": float(stacking[index]),
            },
        })
    FIXTURE_PATH.parent.mkdir(parents=True, exist_ok=True)
    FIXTURE_PATH.write_text(json.dumps(fixtures, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size:,} bytes)")
    print(f"Wrote {FIXTURE_PATH} ({len(fixtures)} parity cases)")


if __name__ == "__main__":
    main()
