export interface FingerprintItem {
  word: string;
  weight: number;
}

export interface FingerprintResult {
  sense_description: string;
  fingerprint: FingerprintItem[];
}

export interface TierConfig {
  label: string;
  weight: number;
  description: string;
  // count removed, AI decides distribution
}

export interface FingerprintConfig {
  model: string; // The specific Gemini model ID to use
  totalCount: number; // Global limit
  tiers: TierConfig[];
}

export interface ProcessingItem {
  id: string;
  input: string; // Now represents the Definition/Meaning
  label?: string; // Optional user label for UI
  result?: FingerprintResult;
  config?: FingerprintConfig; // Store the config used for this item
  loading: boolean;
  error?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  items: {
    input: string; // The definition
    label?: string;
  }[];
}