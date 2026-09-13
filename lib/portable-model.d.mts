export type NeuroLumePatient = {
  age: number;
  avg_glucose_level: number;
  bmi: number;
  gender: string;
  hypertension: number | null;
  heart_disease: number | null;
  ever_married: string | null;
  work_type: string;
  Residence_type: string | null;
  smoking_status: string;
};

export type PortableScores = Record<"XGBoost" | "LightGBM" | "CatBoost" | "Stacking", number>;

export function evaluatePortableModel(model: unknown, input: NeuroLumePatient): PortableScores;
export function loadPortableModel(url?: string): Promise<unknown>;
export function analyzePatient(input: NeuroLumePatient): Promise<{
  score: number;
  level: "Pantau dan Jaga Kesehatan" | "Perlu Perhatian" | "Disarankan Konsultasi";
  factors: Array<{ name: string; direction: "up" | "down"; note: string }>;
  tips: string[];
  modelScores: Record<string, number>;
}>;
