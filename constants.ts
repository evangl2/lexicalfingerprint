import { Scenario } from './types';

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