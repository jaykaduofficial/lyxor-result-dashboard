export type Severity = 'high' | 'medium' | 'low' | string

export interface TruePositive {
  golden_comment: string
  severity: Severity
  matched_candidate: string
  confidence: number
  reasoning: string
}

export interface FalsePositive {
  candidate: string
}

export interface FalseNegative {
  golden_comment: string
  severity: Severity
}

export interface ToolEvaluation {
  skipped: boolean
  true_positives: TruePositive[]
  false_positives: FalsePositive[]
  false_negatives: FalseNegative[]
  errors: string[]
  total_candidates: number
  total_golden: number
  tp: number
  fp: number
  fn: number
  errors_count: number
  precision: number
  recall: number
  tool: string
  repo_name: string
  pr_url: string
}

export type EvaluationsFile = Record<string, Record<string, ToolEvaluation>>

export interface PREvaluation {
  prUrl: string
  repo: string
  prNumber: string
  tools: Record<string, ToolEvaluation>
}

export interface ToolAggregate {
  tool: string
  evaluationCount: number
  skippedCount: number
  totalTp: number
  totalFp: number
  totalFn: number
  totalCandidates: number
  totalGolden: number
  totalErrors: number
  avgPrecision: number
  avgRecall: number
  f1: number
  macroPrecision: number
  macroRecall: number
}

export interface OverallStats {
  totalPRs: number
  tools: ToolAggregate[]
  perPR: PREvaluation[]
}
