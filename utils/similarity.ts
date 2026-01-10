import { FingerprintItem, FingerprintResult } from "../types";

// Formula: Sum(Min Weights) / Sum(Max Weights)
export const calculateSimilarity = (fp1: FingerprintResult, fp2: FingerprintResult): number => {
  const map1 = new Map(fp1.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));
  const map2 = new Map(fp2.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));

  const allWords = new Set([...map1.keys(), ...map2.keys()]);
  
  let intersectionSum = 0;
  let unionSum = 0;
  
  allWords.forEach(word => {
    const w1 = map1.get(word) || 0;
    const w2 = map2.get(word) || 0;
    intersectionSum += Math.min(w1, w2);
    unionSum += Math.max(w1, w2);
  });

  return unionSum === 0 ? 0 : intersectionSum / unionSum;
};

// Generate a hash ID for the fingerprint content
export const generateDiscoveryKey = (items: FingerprintItem[]): string => {
  const sorted = [...items].sort((a, b) => a.word.localeCompare(b.word));
  const raw = sorted.map(i => `${i.word.toLowerCase()}:${i.weight.toFixed(1)}`).join('|');
  
  // Simple hash implementation
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  // Convert to positive hex string padded
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
};

export const getSimilarityColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};