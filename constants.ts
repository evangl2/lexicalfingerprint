import { Scenario, FingerprintConfig } from './types';

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (Recommended)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (High Quality)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
];

export const DEFAULT_CONFIG: FingerprintConfig = {
  model: 'gemini-3-flash-preview',
  totalCount: 5,
  tiers: [
    { label: 'Tier 1 (Core)', weight: 1.0, description: 'The most essential word. If missing, the sense changes.' },
    { label: 'Tier 2 (Strong)', weight: 0.7, description: 'Very close, but might have slight nuance differences.' },
    { label: 'Tier 3 (Related)', weight: 0.3, description: 'Broadly related, used to map the general semantic field.' }
  ]
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'disambiguation',
    title: '1. Disambiguation Test (Bank)',
    description: 'Verify if the definitions of "Bank" (Financial vs River) produce distinct fingerprints.',
    items: [
      { 
        label: 'Bank (Financial)',
        input: '存放或借贷货币的机构，从事存款、放款、汇兑、储蓄等业务。' 
      },
      { 
        label: 'Bank (River)',
        input: 'The land alongside or sloping down to a river or lake.' 
      }
    ]
  },
  {
    id: 'cross-lingual',
    title: '2. Cross-lingual Anchor Test (Spring)',
    description: 'Verify if Chinese, English, and French definitions of "Spring" converge to the same fingerprint.',
    items: [
      { 
        label: 'Spring (Chinese)',
        input: '冬天到夏天之间的季节,天文学上是从三月的春分到六月的夏至。' 
      },
      { 
        label: 'Spring (English)',
        input: 'The season after winter and before summer, in which vegetation begins to appear.' 
      },
      { 
        label: 'Spring (French)',
        input: "Saison qui suit l'hiver et précède l'été." 
      }
    ]
  },
  {
    id: 'abstract-logic',
    title: '3. Abstract Logic Test',
    description: 'Compare the physical definition of a spring with its functional mechanical description.',
    items: [
      { 
        label: 'Spring (Physics)',
        input: '一种利用弹性来工作的机械零件。用弹性材料制成的零件在外力作用下发生形变，除去外力后又恢复原状。' 
      },
      { 
        label: 'Spring (Mechanism)',
        input: 'A mechanical device made of coiled metal that recovers its shape after being compressed.' 
      }
    ]
  }
];