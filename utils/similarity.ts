import { FingerprintItem, FingerprintResult } from "../types";

/**
 * 采用混合重合算法 (Hybrid Overlap Coefficient)
 * 核心逻辑：
 * 1. 锚点对齐：如果一个单词在两组指纹中同时存在，视为语义锚点对齐。
 * 2. 弱化随机性：对共现单词的权重取“平均值”并乘以 1.3 倍作为奖励。
 * 
 * 公式: 
 * Intersection = Sum( ((w1 + w2) / 2) * 1.3 ) for common words
 * Score = Intersection / Min(Total Weight 1, Total Weight 2)
 */
export const calculateSimilarity = (fp1: FingerprintResult, fp2: FingerprintResult): number => {
  const map1 = new Map(fp1.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));
  const map2 = new Map(fp2.fingerprint.map(i => [i.word.toLowerCase(), i.weight]));

  const allWords = new Set([...map1.keys(), ...map2.keys()]);
  
  let intersectionSum = 0;
  
  allWords.forEach(word => {
    const w1 = map1.get(word) || 0;
    const w2 = map2.get(word) || 0;
    
    // 只有当单词在两边都存在时，才计算重合度
    if (w1 > 0 && w2 > 0) {
      // 修改：
      // 1. (w1 + w2) / 2 : 平滑 AI 权重分配的随机性
      // 2. * 1.3 : 给予 150% 的权重奖励。如果锚点对齐，即使其他非核心词汇有差异，也能显著拉高相似度。
      intersectionSum += ((w1 + w2) / 2) * 1.3;
    }
  });

  // 计算各自的总权重和
  const sum1 = fp1.fingerprint.reduce((acc, curr) => acc + curr.weight, 0);
  const sum2 = fp2.fingerprint.reduce((acc, curr) => acc + curr.weight, 0);
  
  // 取两者中较小的总权重作为分母（包容性原则，Sub-set matching）
  const minTotalWeight = Math.min(sum1, sum2);

  if (minTotalWeight === 0) return 0;

  // 结果可能超过 1.0 (因为乘了 1.3)，因此需要截断
  return Math.min(1.0, intersectionSum / minTotalWeight);
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