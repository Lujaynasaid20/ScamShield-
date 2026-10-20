import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fitMessageModel, MODEL_LABELS, predictMessage } from "../lib/message-model.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATASET_PATH = path.join(ROOT, "ScamShield_AI_Sample_Dataset_100.csv");
const ARTIFACT_PATH = path.join(ROOT, "lib", "message-model-artifact.js");
const REPORT_PATH = path.join(ROOT, "models", "message-model-evaluation.json");
const EXPECTED_COLUMNS = ["id", "language", "label", "category", "message", "reason", "recommended_action"];
const SEED = 20261020;

function parseCsv(source) {
  const records = [];
  let row = [], field = "", quoted = false;
  for (let index = 0; index < source.length; index++) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { field += '"'; index++; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); records.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, "")); records.push(row); }
  const [columns, ...values] = records;
  if (columns?.[0]?.charCodeAt(0) === 0xfeff) columns[0] = columns[0].slice(1);
  if (JSON.stringify(columns) !== JSON.stringify(EXPECTED_COLUMNS)) throw new Error(`Unexpected CSV columns: ${columns?.join(",")}`);
  return values.filter(record => record.some(value => value.trim())).map(values => Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""])));
}

function validateRows(rows) {
  const acceptedLabels = new Set(MODEL_LABELS);
  const ids = new Set();
  const messages = new Set();
  for (const row of rows) {
    if (Object.values(row).some(value => !value.trim())) throw new Error(`Missing field in dataset row ${row.id || "?"}`);
    if (!acceptedLabels.has(row.label)) throw new Error(`Invalid label in dataset row ${row.id}`);
    if (!new Set(["en", "sw"]).has(row.language)) throw new Error(`Unsupported language in dataset row ${row.id}`);
    const messageKey = row.message.trim().toLocaleLowerCase();
    if (ids.has(row.id)) throw new Error(`Duplicate id: ${row.id}`);
    if (messages.has(messageKey)) throw new Error(`Duplicate normalized message: ${row.id}`);
    ids.add(row.id);
    messages.add(messageKey);
  }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function splitRows(rows) {
  const random = seededRandom(SEED);
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.label}:${row.language}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const splits = { train: [], validation: [], test: [] };
  for (const group of groups.values()) {
    for (let index = group.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(random() * (index + 1));
      [group[index], group[swapIndex]] = [group[swapIndex], group[index]];
    }
    const trainEnd = Math.floor(group.length * 0.6);
    const validationEnd = trainEnd + Math.floor(group.length * 0.2);
    splits.train.push(...group.slice(0, trainEnd));
    splits.validation.push(...group.slice(trainEnd, validationEnd));
    splits.test.push(...group.slice(validationEnd));
  }
  return splits;
}

function evaluate(model, rows) {
  const confusion = Object.fromEntries(MODEL_LABELS.map(label => [label, Object.fromEntries(MODEL_LABELS.map(predicted => [predicted, 0]))]));
  for (const row of rows) confusion[row.label][predictMessage(model, row.message).label]++;
  const perClass = Object.fromEntries(MODEL_LABELS.map(label => {
    const truePositive = confusion[label][label];
    const falsePositive = MODEL_LABELS.reduce((sum, actual) => sum + (actual === label ? 0 : confusion[actual][label]), 0);
    const falseNegative = MODEL_LABELS.reduce((sum, predicted) => sum + (predicted === label ? 0 : confusion[label][predicted]), 0);
    const precision = truePositive / (truePositive + falsePositive) || 0;
    const recall = truePositive / (truePositive + falseNegative) || 0;
    const f1 = precision + recall ? 2 * precision * recall / (precision + recall) : 0;
    return [label, { precision, recall, f1, support: MODEL_LABELS.reduce((sum, predicted) => sum + confusion[label][predicted], 0) }];
  }));
  return { examples: rows.length, accuracy: rows.filter(row => predictMessage(model, row.message).label === row.label).length / rows.length, perClass, confusionMatrix: confusion };
}

const source = fs.readFileSync(DATASET_PATH, "utf8");
const rows = parseCsv(source);
validateRows(rows);
const splits = splitRows(rows);
const model = fitMessageModel(splits.train);
const report = {
  dataset: {
    file: path.basename(DATASET_PATH),
    sha256: crypto.createHash("sha256").update(source).digest("hex"),
    rows: rows.length,
    labels: Object.fromEntries(MODEL_LABELS.map(label => [label, rows.filter(row => row.label === label).length])),
    languages: Object.fromEntries(["en", "sw"].map(language => [language, rows.filter(row => row.language === language).length])),
    categoryCounts: Object.fromEntries([...new Set(rows.map(row => row.category))].sort().map(category => [category, rows.filter(row => row.category === category).length])),
    annotationFieldsRetained: ["category", "reason", "recommended_action"],
    annotations: rows.map(({ id, language, label, category, reason, recommended_action }) => ({ id, language, label, category, reason, recommended_action }))
  },
  split: { seed: SEED, proportions: { train: 0.6, validation: 0.2, test: 0.2 }, counts: Object.fromEntries(Object.entries(splits).map(([name, entries]) => [name, entries.length])), groupedBy: ["label", "language"], duplicatesAcrossSplits: 0 },
  validation: evaluate(model, splits.validation),
  test: evaluate(model, splits.test),
  note: "Naive Bayes softmax values are not calibrated probabilities. The test set is small and synthetic; metrics are descriptive, not evidence of production accuracy."
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(ARTIFACT_PATH, `export default ${JSON.stringify(model)};\n`);
fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));