import type {
  EvaluationsFile,
  OverallStats,
  PREvaluation,
  ToolAggregate,
  ToolEvaluation,
} from '../types/evaluation'

export function parsePRUrl(url: string): { repo: string; prNumber: string } {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/)
  if (match) {
    return { repo: match[1], prNumber: match[2] }
  }
  const parts = url.split('/')
  return {
    repo: parts[parts.length - 3] ?? 'unknown',
    prNumber: parts[parts.length - 1] ?? '?',
  }
}

export function parseEvaluations(data: EvaluationsFile): OverallStats {
  const perPR: PREvaluation[] = Object.entries(data).map(([prUrl, tools]) => {
    const { repo, prNumber } = parsePRUrl(prUrl)
    return { prUrl, repo, prNumber, tools }
  })

  perPR.sort((a, b) => {
    const repoCmp = a.repo.localeCompare(b.repo)
    return repoCmp !== 0 ? repoCmp : Number(a.prNumber) - Number(b.prNumber)
  })

  const toolNames = new Set<string>()
  for (const pr of perPR) {
    for (const tool of Object.keys(pr.tools)) {
      toolNames.add(tool)
    }
  }

  const tools: ToolAggregate[] = [...toolNames].map((tool) =>
    aggregateTool(tool, perPR),
  )

  tools.sort((a, b) => a.tool.localeCompare(b.tool))

  return { totalPRs: perPR.length, tools, perPR }
}

function aggregateTool(tool: string, perPR: PREvaluation[]): ToolAggregate {
  const evaluations: ToolEvaluation[] = []

  for (const pr of perPR) {
    const eval_ = pr.tools[tool]
    if (eval_) evaluations.push(eval_)
  }

  const active = evaluations.filter((e) => !e.skipped)
  const skippedCount = evaluations.length - active.length

  const totalTp = active.reduce((s, e) => s + e.tp, 0)
  const totalFp = active.reduce((s, e) => s + e.fp, 0)
  const totalFn = active.reduce((s, e) => s + e.fn, 0)
  const totalCandidates = active.reduce((s, e) => s + e.total_candidates, 0)
  const totalGolden = active.reduce((s, e) => s + e.total_golden, 0)
  const totalErrors = active.reduce((s, e) => s + e.errors_count, 0)

  const avgPrecision =
    active.length > 0
      ? active.reduce((s, e) => s + e.precision, 0) / active.length
      : 0
  const avgRecall =
    active.length > 0
      ? active.reduce((s, e) => s + e.recall, 0) / active.length
      : 0

  const macroPrecision = totalTp + totalFp > 0 ? totalTp / (totalTp + totalFp) : 0
  const macroRecall = totalTp + totalFn > 0 ? totalTp / (totalTp + totalFn) : 0
  const f1 =
    macroPrecision + macroRecall > 0
      ? (2 * macroPrecision * macroRecall) / (macroPrecision + macroRecall)
      : 0

  return {
    tool,
    evaluationCount: evaluations.length,
    skippedCount,
    totalTp,
    totalFp,
    totalFn,
    totalCandidates,
    totalGolden,
    totalErrors,
    avgPrecision,
    avgRecall,
    f1,
    macroPrecision,
    macroRecall,
  }
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatNumber(value: number): string {
  return value.toLocaleString()
}

export function validateEvaluationsFile(data: unknown): data is EvaluationsFile {
  if (!data || typeof data !== 'object') return false

  for (const [, tools] of Object.entries(data)) {
    if (!tools || typeof tools !== 'object') return false
    for (const [, eval_] of Object.entries(tools)) {
      if (!eval_ || typeof eval_ !== 'object') return false
      const e = eval_ as Record<string, unknown>
      if (typeof e.tp !== 'number' || typeof e.precision !== 'number') return false
    }
  }
  return true
}
