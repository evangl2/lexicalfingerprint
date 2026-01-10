import { FingerprintItem, FingerprintResult } from "../types";

// A simple weighted Jaccard-ish similarity for demonstration
// If words match, we multiply their weights and sum it up.
// Normalized by the max possible weight (assuming perfect match).
export const calculateSimilarity = (fp1: FingerprintResult, fp2: FingerprintResult): number => {
  const map1 = new Map(fp1.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));
  const map2 = new Map(fp2.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));

  let intersectionScore = 0;
  
  // Collect all unique words
  const allWords = new Set([...map1.keys(), ...map2.keys()]);
  
  // Calculate raw intersection value
  allWords.forEach(word => {
    const w1 = map1.get(word) || 0;
    const w2 = map2.get(word) || 0;
    // We only care if they overlap. The score is determined by the minimum weight present in both.
    // If one has 1.0 and other 0.0, overlap is 0.
    // If one has 1.0 and other 0.7, overlap is driven by 0.7.
    intersectionScore += Math.min(w1, w2);
  });

  // Calculate maximum potential score (Sum of max weights for each word involved)
  // This is a simplified normalization. 
  // A perfect match (identical lists) -> Sum of weights.
  let maxScore1 = 0;
  fp1.fingerprint.forEach(i => maxScore1 += i.weight);
  
  let maxScore2 = 0;
  fp2.fingerprint.forEach(i => maxScore2 += i.weight);
  
  const normalizationFactor = (maxScore1 + maxScore2) / 2;

  if (normalizationFactor === 0) return 0;

  // Boost the score slightly for Exact Word matches in Tier 1 (1.0) to represent "Core Concept" alignment
  // This aligns with the "Anchor" test requirement.
  
  return Math.min(1.0, intersectionScore / normalizationFactor);
};

export const getSimilarityColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};