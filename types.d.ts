export type Decision = 'C' | 'D' | null;
export type Strategy = 'manual' | 'always-cooperate' | 'always-defect' | 'tit-for-tat' | 'random';

export interface Player {
  id: number;
  name: string;
  strategy: Strategy;
  decisions: Decision[];
  penalties: number[];
  totalPenalty: number;
}

export interface RoundResult {
  round: number;
  decisions: Decision[];
  penalties: number[];
}