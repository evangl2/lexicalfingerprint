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
  input: string; // Now represents the Definition/Meaning
  label?: string; // Optional user label for UI
  result?: FingerprintResult;
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