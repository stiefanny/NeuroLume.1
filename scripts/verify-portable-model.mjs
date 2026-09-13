import { readFile } from "node:fs/promises";
import { evaluatePortableModel } from "../lib/portable-model.mjs";

const root = new URL("../", import.meta.url);
const model = JSON.parse(await readFile(new URL("public/model/neurolume-portable-model.json", root), "utf8"));
const fixtures = JSON.parse(await readFile(new URL("tests/model-parity-fixtures.json", root), "utf8"));
const maximum = { XGBoost: 0, LightGBM: 0, CatBoost: 0, Stacking: 0 };

for (const fixture of fixtures) {
  const actual = evaluatePortableModel(model, fixture.input);
  for (const name of Object.keys(maximum)) {
    maximum[name] = Math.max(maximum[name], Math.abs(actual[name] - fixture.expected[name]));
  }
}

const tolerance = { XGBoost: 3e-7, LightGBM: 2e-10, CatBoost: 2e-10, Stacking: 1e-7 };
for (const name of Object.keys(maximum)) {
  if (maximum[name] > tolerance[name]) {
    throw new Error(`${name} parity failed: ${maximum[name]} > ${tolerance[name]}`);
  }
}

console.log(JSON.stringify({ cases: fixtures.length, maximumAbsoluteDifference: maximum }, null, 2));
