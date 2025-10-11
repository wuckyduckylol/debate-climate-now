// Belief Shift Index (BSI) scoring engine

export interface TurnScores {
  evidence: number; // 0-1
  logic: number; // 0-1
  tone: number; // 0-1
  crossDisciplinary: number; // 0-1
}

export interface DifficultyWeights {
  evidence: number;
  logic: number;
  tone: number;
  crossDisciplinary: number;
}

export interface DifficultyThresholds {
  minEvidence: number;
  minLogic: number;
  minBsi: number;
  requiredTurns: number;
  requiredRebuttals?: number;
  requiredCitations?: number;
  requiredDomains?: number;
  requiredMechanisms?: number;
  sustainedTurns?: number;
}

const DIFFICULTY_WEIGHTS: Record<string, DifficultyWeights> = {
  Easy: { evidence: 0.30, logic: 0.45, tone: 0.25, crossDisciplinary: 0.00 },
  Moderate: { evidence: 0.40, logic: 0.35, tone: 0.15, crossDisciplinary: 0.10 },
  Hard: { evidence: 0.45, logic: 0.35, tone: 0.10, crossDisciplinary: 0.10 },
  Extreme: { evidence: 0.50, logic: 0.30, tone: 0.05, crossDisciplinary: 0.15 },
};

const DIFFICULTY_THRESHOLDS: Record<string, DifficultyThresholds> = {
  Easy: {
    minEvidence: 0.25,
    minLogic: 0.70,
    minBsi: 0.60,
    requiredTurns: 6,
    requiredRebuttals: 3,
  },
  Moderate: {
    minEvidence: 0.45,
    minLogic: 0.70,
    minBsi: 0.70,
    requiredTurns: 8,
    requiredRebuttals: 3,
    requiredCitations: 1,
  },
  Hard: {
    minEvidence: 0.60,
    minLogic: 0.80,
    minBsi: 0.80,
    requiredTurns: 10,
    requiredRebuttals: 4,
    requiredCitations: 2,
    requiredDomains: 2,
    requiredMechanisms: 1,
  },
  Extreme: {
    minEvidence: 0.75,
    minLogic: 0.85,
    minBsi: 0.85,
    requiredTurns: 12,
    requiredRebuttals: 5,
    requiredCitations: 3,
    requiredDomains: 3,
    sustainedTurns: 5,
  },
};

export function calculateBSI(
  scores: TurnScores,
  difficulty: string
): number {
  const weights = DIFFICULTY_WEIGHTS[difficulty] || DIFFICULTY_WEIGHTS.Easy;
  
  return (
    weights.evidence * scores.evidence +
    weights.logic * scores.logic +
    weights.tone * scores.tone +
    weights.crossDisciplinary * scores.crossDisciplinary
  );
}

export function updateRollingBSI(
  currentRolling: number,
  newBSI: number,
  alpha: number = 0.3
): number {
  // Exponential moving average
  return alpha * newBSI + (1 - alpha) * currentRolling;
}

export function checkPassCriteria(
  difficulty: string,
  rollingBSI: number,
  turnCount: number,
  stats: {
    rebuttalCount?: number;
    citationCount?: number;
    domainsUsed?: number;
    mechanismsExplained?: number;
  }
): { passed: boolean; reason?: string } {
  const thresholds = DIFFICULTY_THRESHOLDS[difficulty] || DIFFICULTY_THRESHOLDS.Easy;

  // Check minimum turns
  if (turnCount < thresholds.requiredTurns) {
    return { passed: false, reason: `Need at least ${thresholds.requiredTurns} turns` };
  }

  // Check BSI threshold
  if (rollingBSI < thresholds.minBsi) {
    return { passed: false, reason: `BSI ${rollingBSI.toFixed(2)} below threshold ${thresholds.minBsi}` };
  }

  // Check rebuttals
  if (thresholds.requiredRebuttals && (!stats.rebuttalCount || stats.rebuttalCount < thresholds.requiredRebuttals)) {
    return { passed: false, reason: `Need ${thresholds.requiredRebuttals} rebuttals` };
  }

  // Check citations
  if (thresholds.requiredCitations && (!stats.citationCount || stats.citationCount < thresholds.requiredCitations)) {
    return { passed: false, reason: `Need ${thresholds.requiredCitations} citations` };
  }

  // Check domains
  if (thresholds.requiredDomains && (!stats.domainsUsed || stats.domainsUsed < thresholds.requiredDomains)) {
    return { passed: false, reason: `Need evidence from ${thresholds.requiredDomains} domains` };
  }

  // Check mechanisms
  if (thresholds.requiredMechanisms && (!stats.mechanismsExplained || stats.mechanismsExplained < thresholds.requiredMechanisms)) {
    return { passed: false, reason: `Need to explain ${thresholds.requiredMechanisms} mechanism(s)` };
  }

  return { passed: true };
}

export function getColorForBSI(bsi: number): string {
  if (bsi >= 0.8) return 'success';
  if (bsi >= 0.6) return 'secondary';
  if (bsi >= 0.4) return 'warning';
  return 'destructive';
}
