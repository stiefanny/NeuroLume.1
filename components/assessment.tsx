"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleHelp,
  DatabaseZap,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Progress } from "@/components/ui/progress";
import { BrainMark } from "@/components/brain-mark";
import {
  analyzePatient,
  type NeuroLumePatient,
} from "@/lib/portable-model.mjs";

type Result = {
  score: number;
  level:
    | "Pantau dan Jaga Kesehatan"
    | "Perlu Perhatian"
    | "Disarankan Konsultasi";
  factors: { name: string; direction: "up" | "down"; note: string }[];
  tips: string[];
  modelScores?: Record<string, number>;
  demo?: boolean;
};

const emergencyItems = [
  "Wajah mencong",
  "Satu lengan tiba-tiba lemah",
  "Bicara pelo/sulit dipahami",
  "Pandangan atau keseimbangan mendadak terganggu",
  "Sakit kepala hebat mendadak",
];
const sampleResult: Result = {
  score: 72.4,
  level: "Disarankan Konsultasi",
  demo: true,
  factors: [
    {
      name: "Usia",
      direction: "up",
      note: "Lebih tinggi daripada profil referensi training",
    },
    {
      name: "Rerata glukosa",
      direction: "up",
      note: "Mendorong skor model ke atas",
    },
    {
      name: "Riwayat hipertensi",
      direction: "up",
      note: "Tercatat sebagai faktor input penting",
    },
    {
      name: "Tidak merokok",
      direction: "down",
      note: "Menahan sebagian kenaikan skor",
    },
  ],
  tips: [
    "Periksa tekanan darah, gula darah, dan kolesterol bersama tenaga kesehatan.",
    "Bawa catatan obat dan hasil pemeriksaan terakhir saat konsultasi.",
    "Pertahankan aktivitas fisik dan pola makan yang sesuai kondisi kesehatan.",
  ],
  modelScores: { XGBoost: 74.1, LightGBM: 68.8, CatBoost: 71.5 },
};

function FieldSelect({
  id,
  label,
  children,
  hint,
  ...props
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
} & React.ComponentProps<typeof NativeSelect>) {
  return (
    <div className="field">
      <Label htmlFor={id}>
        {label} <b>*</b>
      </Label>
      <NativeSelect
        id={id}
        name={id}
        className="w-full"
        defaultValue=""
        required
        {...props}
      >
        {children}
      </NativeSelect>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Assessment() {
  const [step, setStep] = useState(1);
  const [emergency, setEmergency] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const progress = (step / 3) * 100;
  const hasEmergency = emergency.length > 0;
  const completeness = useMemo(
    () =>
      step === 1
        ? "Data dasar"
        : step === 2
          ? "Riwayat & kebiasaan"
          : "Pemeriksaan & persetujuan",
    [step],
  );
  useEffect(() => {
    const context =
      typeof document === "undefined"
        ? undefined
        : (
            document as Document & {
              modelContext?: {
                registerTool?: (
                  tool: unknown,
                  options?: unknown,
                ) => void | Promise<void>;
              };
            }
          ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "show_neurolume_example",
            title: "Tampilkan contoh hasil NeuroLume",
            description:
              "Menampilkan contoh antarmuka hasil penelitian tanpa menganalisis atau menyimpan data pengguna.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute() {
              setResult(sampleResult);
              setMessage("");
              return { status: "example_shown", stored: false };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => undefined);
    } catch {}
    return () => lifecycle.abort();
  }, []);
  function toggleEmergency(label: string, checked: boolean) {
    setEmergency((current) =>
      checked ? [...current, label] : current.filter((item) => item !== label),
    );
    setResult(null);
  }
  function continueStep(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    if (!form) return;
    const controls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        `[data-step="${step}"] input, [data-step="${step}"] select`,
      ),
    );
    const invalid = controls.find((control) => !control.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStep(step + 1);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasEmergency) return;
    const form = event.currentTarget;
    const invalid = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      ":invalid",
    );
    if (invalid) {
      const pane = invalid.closest<HTMLElement>("[data-step]");
      if (pane) setStep(Number(pane.dataset.step));
      requestAnimationFrame(() => invalid.reportValidity());
      return;
    }
    setBusy(true);
    setMessage("");
    setResult(null);
    const raw = Object.fromEntries(new FormData(form).entries());
    const nullable = (value: FormDataEntryValue | undefined) =>
      value === "Unknown" || value === "" ? null : String(value);
    const payload: NeuroLumePatient = {
      age: Number(raw.age),
      gender: String(raw.gender),
      ever_married: nullable(raw.ever_married),
      work_type: String(raw.work_type),
      Residence_type: nullable(raw.Residence_type),
      hypertension:
        raw.hypertension === "Unknown" ? null : Number(raw.hypertension),
      heart_disease:
        raw.heart_disease === "Unknown" ? null : Number(raw.heart_disease),
      smoking_status: String(raw.smoking_status),
      avg_glucose_level: Number(raw.avg_glucose_level),
      bmi: Number(raw.bmi),
    };
    try {
      setResult(await analyzePatient(payload));
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Analisis belum dapat dijalankan.",
      );
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setStep(1);
    setEmergency([]);
    setResult(null);
    setMessage("");
  }
  return (
    <section
      className="assessment-grid"
      aria-label="Pemeriksaan awal faktor risiko"
    >
      <Card className="assessment-card">
        <CardHeader className="form-heading">
          <div>
            <span className="eyebrow">Mode masyarakat</span>
            <CardTitle>Pemeriksaan awal faktor risiko</CardTitle>
            <CardDescription>
              Isi yang kamu ketahui. Kolom kosong ditandai sebagai data tidak
              tersedia, bukan dianggap normal.
            </CardDescription>
          </div>
          <span className="step-count">{step}/3</span>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
            <AlertTriangle />
            <AlertTitle>Ini bukan diagnosis</AlertTitle>
            <AlertDescription>
              Skor NeuroLume adalah indeks model penelitian, bukan persentase
              risiko klinis. Jangan gunakan hasilnya untuk menunda pemeriksaan
              atau pengobatan.
            </AlertDescription>
          </Alert>
          <div className="progress-row">
            <span>{completeness}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="mb-7" />
          <form onSubmit={submit}>
            <div hidden={step !== 1} data-step="1" className="form-grid">
              <div className="field">
                <Label htmlFor="age">
                  Usia <b>*</b>
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="18"
                  max="100"
                  required
                  placeholder="Contoh: 52"
                />
                <small>
                  Untuk dewasa dan lansia. Di luar 18 sampai 100 tahun perlu
                  penilaian khusus.
                </small>
              </div>
              <FieldSelect id="gender" label="Jenis kelamin">
                <NativeSelectOption value="">
                  Pilih jenis kelamin
                </NativeSelectOption>
                <NativeSelectOption value="Female">
                  Perempuan
                </NativeSelectOption>
                <NativeSelectOption value="Male">Laki laki</NativeSelectOption>
                <NativeSelectOption value="Other">Lainnya</NativeSelectOption>
              </FieldSelect>
              <FieldSelect id="ever_married" label="Pernah menikah">
                <NativeSelectOption value="">Pilih jawaban</NativeSelectOption>
                <NativeSelectOption value="Yes">Ya</NativeSelectOption>
                <NativeSelectOption value="No">Tidak</NativeSelectOption>
                <NativeSelectOption value="Unknown">
                  Tidak tahu
                </NativeSelectOption>
              </FieldSelect>
              <FieldSelect id="Residence_type" label="Wilayah tempat tinggal">
                <NativeSelectOption value="">Pilih wilayah</NativeSelectOption>
                <NativeSelectOption value="Urban">Perkotaan</NativeSelectOption>
                <NativeSelectOption value="Rural">Perdesaan</NativeSelectOption>
                <NativeSelectOption value="Unknown">
                  Tidak tahu
                </NativeSelectOption>
              </FieldSelect>
            </div>
            <div hidden={step !== 2} data-step="2" className="form-grid">
              <FieldSelect
                id="hypertension"
                label="Pernah didiagnosis hipertensi"
                hint="Jika ragu, pilih tidak tahu, jangan menebak."
              >
                <NativeSelectOption value="">Pilih jawaban</NativeSelectOption>
                <NativeSelectOption value="1">Ya</NativeSelectOption>
                <NativeSelectOption value="0">Tidak</NativeSelectOption>
                <NativeSelectOption value="Unknown">
                  Tidak tahu
                </NativeSelectOption>
              </FieldSelect>
              <FieldSelect
                id="heart_disease"
                label="Pernah didiagnosis penyakit jantung"
              >
                <NativeSelectOption value="">Pilih jawaban</NativeSelectOption>
                <NativeSelectOption value="1">Ya</NativeSelectOption>
                <NativeSelectOption value="0">Tidak</NativeSelectOption>
                <NativeSelectOption value="Unknown">
                  Tidak tahu
                </NativeSelectOption>
              </FieldSelect>
              <FieldSelect
                id="work_type"
                label="Jenis pekerjaan"
                hint="Pilih Lainnya jika pekerjaanmu belum ada di daftar."
              >
                <NativeSelectOption value="">
                  Pilih pekerjaan
                </NativeSelectOption>
                <NativeSelectOption value="Private">Swasta</NativeSelectOption>
                <NativeSelectOption value="Self-employed">
                  Wiraswasta
                </NativeSelectOption>
                <NativeSelectOption value="Govt_job">
                  Pemerintahan
                </NativeSelectOption>
                <NativeSelectOption value="Never_worked">
                  Belum pernah bekerja
                </NativeSelectOption>
                <NativeSelectOption value="Other">Lainnya</NativeSelectOption>
              </FieldSelect>
              <FieldSelect id="smoking_status" label="Status merokok">
                <NativeSelectOption value="">Pilih status</NativeSelectOption>
                <NativeSelectOption value="never smoked">
                  Tidak pernah
                </NativeSelectOption>
                <NativeSelectOption value="formerly smoked">
                  Pernah, sudah berhenti
                </NativeSelectOption>
                <NativeSelectOption value="smokes">
                  Masih merokok
                </NativeSelectOption>
                <NativeSelectOption value="Unknown">
                  Riwayat tidak diketahui
                </NativeSelectOption>
              </FieldSelect>
            </div>
            <div hidden={step !== 3} data-step="3" className="form-grid">
              <div className="field">
                <Label htmlFor="avg_glucose_level">
                  Rerata glukosa <b>*</b>
                </Label>
                <Input
                  id="avg_glucose_level"
                  name="avg_glucose_level"
                  type="number"
                  min="40"
                  max="300"
                  step="0.1"
                  required
                  placeholder="Masukkan hasil pemeriksaan"
                />
                <small>
                  Gunakan hasil pemeriksaan yang paling baru jika tersedia.
                </small>
              </div>
              <div className="field">
                <Label htmlFor="bmi">
                  BMI <b>*</b>
                </Label>
                <Input
                  id="bmi"
                  name="bmi"
                  type="number"
                  min="10"
                  max="70"
                  step="0.1"
                  required
                  placeholder="Masukkan nilai BMI"
                />
                <small>BMI dapat dihitung dari berat dan tinggi badan.</small>
              </div>
              <div className="consent-box full-span">
                <Checkbox
                  id="research_consent"
                  name="research_consent"
                  disabled
                />
                <div>
                  <Label htmlFor="research_consent">
                    Pengumpulan data penelitian belum dibuka
                  </Label>
                  <p>
                    Jawaban dianalisis di perangkat ini dan tidak disimpan
                    sebelum persetujuan etik.
                  </p>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step > 1 ? setStep(step - 1) : reset())}
              >
                <RotateCcw />
                {step > 1 ? "Kembali" : "Reset"}
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={continueStep}>
                  Lanjut <ArrowRight />
                </Button>
              ) : (
                <Button type="submit" disabled={busy || hasEmergency}>
                  {busy ? "Memproses…" : "Analisis riset"}
                  <Sparkles />
                </Button>
              )}
            </div>
          </form>
          {message && (
            <Alert className="mt-5 border-sky-200 bg-sky-50">
              <DatabaseZap />
              <AlertTitle>Analisis belum dapat dijalankan</AlertTitle>
              <AlertDescription>
                {message} Kamu tetap dapat membuka contoh tampilan hasil.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <div className="result-column">
        <Card id="emergency-check" className="emergency-check-card">
          <CardHeader>
            <span className="eyebrow danger">Pemeriksaan darurat</span>
            <CardTitle>Apakah ada gejala mendadak?</CardTitle>
            <CardDescription>
              Pilih semua yang sedang terjadi. Langkah ini selalu didahulukan
              sebelum skor model.
            </CardDescription>
          </CardHeader>
          <CardContent className="emergency-list">
            {emergencyItems.map((item) => (
              <label key={item}>
                <Checkbox
                  checked={emergency.includes(item)}
                  onCheckedChange={(checked) =>
                    toggleEmergency(item, checked === true)
                  }
                />
                <span>{item}</span>
              </label>
            ))}
            {hasEmergency && (
              <Alert variant="destructive" className="emergency-alert">
                <AlertTriangle />
                <AlertTitle>Jangan menunggu hasil NeuroLume</AlertTitle>
                <AlertDescription>
                  Segera hubungi layanan darurat setempat atau menuju IGD. Catat
                  waktu gejala pertama muncul.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        <Card className="result-card" aria-live="polite">
          {!result ? (
            <CardContent className="result-empty">
              <span className="result-orb">
                <BrainMark />
              </span>
              <h2>Hasil muncul di sini</h2>
              <p>
                Model NoSMOTE final dijalankan langsung di perangkatmu. Jawaban
                tidak dikirim atau disimpan.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setResult(sampleResult);
                  setMessage("");
                }}
              >
                Lihat contoh hasil
              </Button>
            </CardContent>
          ) : (
            <ResultView result={result} />
          )}
        </Card>
      </div>
    </section>
  );
}

function ResultView({ result }: { result: Result }) {
  const color =
    result.level === "Pantau dan Jaga Kesehatan"
      ? "calm"
      : result.level === "Perlu Perhatian"
        ? "attention"
        : "priority";
  return (
    <>
      <CardHeader className="result-heading">
        <div>
          <span className={`level-pill ${color}`}>{result.level}</span>
          <CardTitle>Ringkasan indikasi</CardTitle>
        </div>
        <div className="score">
          <strong>{result.score.toFixed(1)}</strong>
          <span>/100</span>
        </div>
      </CardHeader>
      <CardContent>
        {result.demo && (
          <div className="demo-note">
            <CircleHelp />
            Contoh tampilan, bukan analisis data yang kamu isi dan bukan
            probabilitas klinis.
          </div>
        )}
        <div className="score-scale">
          <i style={{ width: `${Math.min(result.score, 100)}%` }} />
        </div>
        <div className="level-legend" aria-label="Tiga kategori komunikasi hasil">
          <span>Pantau</span>
          <span>Perlu perhatian</span>
          <span>Disarankan konsultasi</span>
        </div>
        <section className="result-section">
          <h3>Faktor input yang perlu dibahas</h3>
          {result.factors.map((f) => (
            <div className="factor-row" key={f.name}>
              <span className={f.direction}>
                <ArrowRight />
              </span>
              <div>
                <strong>{f.name}</strong>
                <small>{f.note}</small>
              </div>
            </div>
          ))}
        </section>
        {result.modelScores && (
          <section className="result-section">
            <h3>Suara tiga model</h3>
            {Object.entries(result.modelScores).map(([name, score]) => (
              <div className="model-score" key={name}>
                <span>{name}</span>
                <div>
                  <i style={{ width: `${Math.min(score, 100)}%` }} />
                </div>
                <strong>{score.toFixed(1)}</strong>
              </div>
            ))}
          </section>
        )}
        <section className="result-section">
          <h3>Langkah yang dapat dipertimbangkan</h3>
          <ul className="tips">
            {result.tips.map((t) => (
              <li key={t}>
                <Check />
                {t}
              </li>
            ))}
          </ul>
        </section>
        <div className="privacy-line">
          <ShieldCheck />
          Data tidak disimpan pada versi ini.
        </div>
      </CardContent>
    </>
  );
}
