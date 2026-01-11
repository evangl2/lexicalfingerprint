import { FingerprintItem, FingerprintResult } from "../types";

export interface SimilarityMatch {
  word: string;
  weightA: number;
  weightB: number;
  contribution: number;
  isBonus: boolean;
  bonusType?: 'tier1' | 'cross';
}

export interface SimilarityAnalysis {
  score: number;
  intersectionSum: number;
  totalWeightA: number;
  totalWeightB: number;
  matches: SimilarityMatch[];
}

/**
 * 采用混合重合算法 (Hybrid Overlap Coefficient)
 * 核心逻辑：
 * 1. 锚点对齐：如果一个单词在两组指纹中同时存在，视为语义锚点对齐。
 * 2. 动态权重：
 *    - Tier 1 强匹配 (Both Weights >= 0.9): 贡献度 = Average * 1.2 (核心语义锁定)
 *    - 跨层级匹配 (Cross Tier): 贡献度 = ((w1 + w2) / 2) * 1.2 (奖励模糊语义连接)
 *    - 普通同层级匹配 (Other Same Tier): 贡献度 = (w1 + w2) / 2
 * 
 * Score = Intersection / Min(Total Weight 1, Total Weight 2)
 */
export const analyzeSimilarity = (fp1: FingerprintResult, fp2: FingerprintResult): SimilarityAnalysis => {
  const map1 = new Map(fp1.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));
  const map2 = new Map(fp2.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));

  const allWords = new Set([...map1.keys(), ...map2.keys()]);
  
  let intersectionSum = 0;
  const matches: SimilarityMatch[] = [];
  
  allWords.forEach(word => {
    const w1 = map1.get(word) || 0;
    const w2 = map2.get(word) || 0;
    
    // 只有当单词在两边都存在时，才计算重合度
    if (w1 > 0 && w2 > 0) {
      const average = (w1 + w2) / 2;
      let contribution = average;
      let isBonus = false;
      let bonusType: 'tier1' | 'cross' | undefined;

      // 逻辑判断：
      // 1. 跨层级匹配 (Cross Tier): 给予 1.2 倍奖励
      // 2. Tier 1 强匹配 (Same Tier & High Weight): 给予 1.3 倍奖励
      
      if (Math.abs(w1 - w2) > 0.001) {
        // Cross Tier
        contribution = average * 1.2;
        isBonus = true;
        bonusType = 'cross';
      } else if (w1 >= 0.9) {
        // Same Tier (Tier 1 is typically 1.0)
        contribution = average * 1.3;
        isBonus = true;
        bonusType = 'tier1';
      }

      intersectionSum += contribution;
      matches.push({
        word,
        weightA: w1,
        weightB: w2,
        contribution,
        isBonus,
        bonusType
      });
    }
  });

  // 按贡献度降序排列
  matches.sort((a, b) => b.contribution - a.contribution);

  // 计算各自的总权重和
  const sum1 = fp1.fingerprint.reduce((acc, curr) => acc + curr.weight, 0);
  const sum2 = fp2.fingerprint.reduce((acc, curr) => acc + curr.weight, 0);
  
  // 取两者中较小的总权重作为分母（包容性原则，Sub-set matching）
  const minTotalWeight = Math.min(sum1, sum2);

  // 结果可能超过 1.0 (因为有奖励乘数)，因此需要截断
  const score = minTotalWeight === 0 ? 0 : Math.min(1.0, intersectionSum / minTotalWeight);

  return {
    score,
    intersectionSum,
    totalWeightA: sum1,
    totalWeightB: sum2,
    matches
  };
};

/**
 * Wrapper for backward compatibility
 */
export const calculateSimilarity = (fp1: FingerprintResult, fp2: FingerprintResult): number => {
  return analyzeSimilarity(fp1, fp2).score;
};

/**
 * 生成指纹内容的哈希 ID (Discovery Key)
 * 保持不变，用于检测 AI 生成内容的严格稳定性
 */
export const generateDiscoveryKey = (items: FingerprintItem[]): string => {
  const sorted = [...items].sort((a, b) => a.word.localeCompare(b.word));
  const raw = sorted.map(i => `${i.word.toLowerCase()}:${i.weight.toFixed(1)}`).join('|');
  
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0').toUpperCase();
};

export const getSimilarityColor = (score: number) => {
  if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};