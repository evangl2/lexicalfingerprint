export interface FingerprintItem {
  word: string;
  weight: number;
}

export interface FingerprintResult {
  sense_description: string;
  fingerprint: FingerprintItem[];
}

export interface ProcessingItem {
  id: string;
  input: string;
  context?: string;
  result?: FingerprintResult;
  loading: boolean;
  error?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  items: {
    input: string;
    context?: string;
  }[];
}