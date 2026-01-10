import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'disambiguation',
    title: '1. Disambiguation Test',
    description: 'Verify if the same word "Bank" produces different fingerprints based on context (Financial vs. River).',
    items: [
      { input: 'Bank', context: 'I need to deposit my salary and check my savings account.' },
      { input: 'Bank', context: 'We sat on the grassy bank and watched the river flow by.' }
    ]
  },
  {
    id: 'cross-lingual',
    title: '2. Cross-lingual Anchor Test',
    description: 'Verify if "Spring" produces the same fingerprint across Chinese, English, and French.',
    items: [
      { input: '春天', context: 'Concept: Season' },
      { input: 'Spring', context: 'Concept: Season' },
      { input: 'Printemps', context: 'Concept: Season' }
    ]
  },
  {
    id: 'desc-vs-word',
    title: '3. Description vs Word Test',
    description: 'Compare a specific word "Spring (Hardware)" with its abstract definition.',
    items: [
      { input: 'Spring', context: 'Hardware/Mechanical context' },
      { input: 'Description', context: 'A mechanical device made of coiled metal that recovers its shape after being compressed.' }
    ]
  },
  {
    id: 'synonym-merge',
    title: '4. Synonym Merge Test',
    description: 'Check overlap between "Sword" and "Katana". Should share Tier 1 but diverge on Tier 2/3.',
    items: [
      { input: 'Sword', context: 'General concept' },
      { input: 'Katana', context: 'Specific concept' }
    ]
  }
];