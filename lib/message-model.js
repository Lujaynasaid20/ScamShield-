const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "i", "in", "is", "it", "me", "my", "of", "on", "or", "our", "please", "the", "this", "to", "we", "you", "your",
  "ama", "chini", "hii", "hiyo", "ili", "kwa", "la", "na", "ni", "of", "sana", "tafadhali", "ya", "yako", "za"
]);

export const MODEL_LABELS = ["scam", "safe", "needs_review"];

export function tokenize(message) {
  return String(message || "").toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)?/gu) || [];
}

function featuresFor(message) {
  const tokens = tokenize(message).filter(token => !STOP_WORDS.has(token));
  const features = new Map();
  for (const token of tokens) features.set(`w:${token}`, (features.get(`w:${token}`) || 0) + 1);
  for (let index = 0; index < tokens.length - 1; index++) {
    const feature = `b:${tokens[index]}_${tokens[index + 1]}`;
    features.set(feature, (features.get(feature) || 0) + 1);
  }
  return { tokens, features };
}

function vectorize(message, model) {
  const { tokens, features } = featuresFor(message);
  const vector = new Map();
  let total = 0;
  for (const [feature, count] of features) {
    const idf = model.idf[feature];
    if (!idf) continue;
    const value = (1 + Math.log(count)) * idf;
    vector.set(feature, value);
    total += value;
  }
  if (total) for (const [feature, value] of vector) vector.set(feature, value / total);
  const uniqueTokens = [...new Set(tokens)];
  const knownTokenRatio = uniqueTokens.length
    ? uniqueTokens.filter(token => model.idf[`w:${token}`]).length / uniqueTokens.length
    : 0;
  return { vector, knownTokenRatio };
}

export function fitMessageModel(examples) {
  const documentFrequencies = new Map();
  const prepared = examples.map(example => {
    const data = featuresFor(example.message);
    for (const feature of data.features.keys()) documentFrequencies.set(feature, (documentFrequencies.get(feature) || 0) + 1);
    return { ...example, ...data };
  });
  const idf = Object.fromEntries([...documentFrequencies].map(([feature, count]) => [feature, Math.log((prepared.length + 1) / (count + 1)) + 1]));
  const totals = Object.fromEntries(MODEL_LABELS.map(label => [label, 0]));
  const counts = Object.fromEntries(MODEL_LABELS.map(label => [label, {}]));

  for (const example of prepared) {
    let total = 0;
    const weighted = [];
    for (const [feature, count] of example.features) {
      const value = (1 + Math.log(count)) * idf[feature];
      weighted.push([feature, value]);
      total += value;
    }
    for (const [feature, value] of weighted) {
      const normalized = value / total;
      counts[example.label][feature] = (counts[example.label][feature] || 0) + normalized;
      totals[example.label] += normalized;
    }
  }

  const vocabulary = Object.keys(idf);
  const alpha = 1;
  const classCounts = Object.fromEntries(MODEL_LABELS.map(label => [label, examples.filter(example => example.label === label).length]));
  const classLogPrior = Object.fromEntries(MODEL_LABELS.map(label => [label, Math.log(classCounts[label] / examples.length)]));
  const classLogLikelihood = Object.fromEntries(MODEL_LABELS.map(label => [
    label,
    Object.fromEntries(vocabulary.map(feature => [feature, Math.log(((counts[label][feature] || 0) + alpha) / (totals[label] + alpha * vocabulary.length))]))
  ]));

  return { version: 1, labels: MODEL_LABELS, idf, classLogPrior, classLogLikelihood, classCounts, alpha };
}

export function predictMessage(model, message) {
  if (!model || !message || !String(message).trim()) return null;
  const { vector, knownTokenRatio } = vectorize(message, model);
  const scores = Object.fromEntries(MODEL_LABELS.map(label => [label, model.classLogPrior[label]]));
  for (const [feature, value] of vector) {
    for (const label of MODEL_LABELS) scores[label] += value * model.classLogLikelihood[label][feature];
  }
  const ranked = MODEL_LABELS.map(label => ({ label, score: scores[label] })).sort((left, right) => right.score - left.score);
  const maxScore = ranked[0].score;
  const expScores = ranked.map(item => Math.exp(item.score - maxScore));
  const total = expScores.reduce((sum, value) => sum + value, 0);
  const predicted = ranked[0].label;
  const runnerUp = ranked[1].label;
  const evidence = [...vector]
    .map(([feature, value]) => ({
      feature: feature.slice(2).replaceAll("_", " "),
      contribution: value * (model.classLogLikelihood[predicted][feature] - model.classLogLikelihood[runnerUp][feature])
    }))
    .filter(item => item.contribution > 0)
    .sort((left, right) => right.contribution - left.contribution)
    .slice(0, 5)
    .map(item => item.feature);

  return {
    label: knownTokenRatio < 0.35 ? "needs_review" : predicted,
    rawLabel: predicted,
    knownTokenRatio,
    probabilities: Object.fromEntries(ranked.map((item, index) => [item.label, expScores[index] / total])),
    evidence
  };
}