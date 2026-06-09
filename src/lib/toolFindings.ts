import type {
  FalseNegative,
  FalsePositive,
  OverallStats,
  TruePositive,
} from '../types/evaluation'

export interface FindingWithPR {
  repo: string
  prNumber: string
  prUrl: string
}

export interface TruePositiveFinding extends FindingWithPR, TruePositive {}

export interface FalsePositiveFinding extends FindingWithPR, FalsePositive {}

export interface FalseNegativeFinding extends FindingWithPR, FalseNegative {}

export interface ToolFindings {
  tool: string
  truePositives: TruePositiveFinding[]
  falsePositives: FalsePositiveFinding[]
  falseNegatives: FalseNegativeFinding[]
}

export function getFindingsByTool(stats: OverallStats): ToolFindings[] {
  return stats.tools.map((t) => {
    const truePositives: TruePositiveFinding[] = []
    const falsePositives: FalsePositiveFinding[] = []
    const falseNegatives: FalseNegativeFinding[] = []

    for (const pr of stats.perPR) {
      const eval_ = pr.tools[t.tool]
      if (!eval_) continue

      const base = { repo: pr.repo, prNumber: pr.prNumber, prUrl: pr.prUrl }

      for (const tp of eval_.true_positives) {
        truePositives.push({ ...base, ...tp })
      }
      for (const fp of eval_.false_positives) {
        falsePositives.push({ ...base, ...fp })
      }
      for (const fn of eval_.false_negatives) {
        falseNegatives.push({ ...base, ...fn })
      }
    }

    return { tool: t.tool, truePositives, falsePositives, falseNegatives }
  })
}
