import { formatPercent } from './parseEvaluations'
import type { EvaluationsFile, OverallStats } from '../types/evaluation'

export interface BenchmarkReport {
  generatedAt: string
  sourceFile: string
  summary: {
    totalPRs: number
    tools: OverallStats['tools']
  }
  perPullRequest: OverallStats['perPR']
  rawData: EvaluationsFile
}

export function buildReport(
  stats: OverallStats,
  rawData: EvaluationsFile,
  sourceFile: string,
): BenchmarkReport {
  return {
    generatedAt: new Date().toISOString(),
    sourceFile,
    summary: {
      totalPRs: stats.totalPRs,
      tools: stats.tools,
    },
    perPullRequest: stats.perPR,
    rawData,
  }
}

function escapeCsv(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(values: (string | number)[]): string {
  return values.map(escapeCsv).join(',')
}

export function buildReportCsv(stats: OverallStats, sourceFile: string): string {
  const lines: string[] = []

  lines.push('CODE REVIEW BENCHMARK REPORT')
  lines.push(`Generated At,${new Date().toISOString()}`)
  lines.push(`Source File,${sourceFile}`)
  lines.push(`Total Pull Requests,${stats.totalPRs}`)
  lines.push('')

  lines.push('TOOL SUMMARY')
  lines.push(
    csvRow([
      'Tool',
      'PRs Evaluated',
      'TP',
      'FP',
      'FN',
      'Candidates',
      'Golden',
      'Macro Precision',
      'Macro Recall',
      'F1',
      'Avg Precision',
      'Avg Recall',
      'Errors',
    ]),
  )
  for (const t of stats.tools) {
    lines.push(
      csvRow([
        t.tool,
        t.evaluationCount,
        t.totalTp,
        t.totalFp,
        t.totalFn,
        t.totalCandidates,
        t.totalGolden,
        formatPercent(t.macroPrecision),
        formatPercent(t.macroRecall),
        formatPercent(t.f1),
        formatPercent(t.avgPrecision),
        formatPercent(t.avgRecall),
        t.totalErrors,
      ]),
    )
  }
  lines.push('')

  lines.push('PER PR METRICS')
  lines.push(
    csvRow([
      'Repository',
      'PR Number',
      'PR URL',
      'Tool',
      'Skipped',
      'TP',
      'FP',
      'FN',
      'Precision',
      'Recall',
      'F1',
      'Candidates',
      'Golden',
      'Errors',
    ]),
  )
  for (const pr of stats.perPR) {
    for (const [tool, eval_] of Object.entries(pr.tools)) {
      const f1 =
        eval_.precision + eval_.recall > 0
          ? (2 * eval_.precision * eval_.recall) / (eval_.precision + eval_.recall)
          : 0
      lines.push(
        csvRow([
          pr.repo,
          pr.prNumber,
          pr.prUrl,
          tool,
          eval_.skipped ? 'yes' : 'no',
          eval_.tp,
          eval_.fp,
          eval_.fn,
          formatPercent(eval_.precision),
          formatPercent(eval_.recall),
          formatPercent(f1),
          eval_.total_candidates,
          eval_.total_golden,
          eval_.errors_count,
        ]),
      )
    }
  }
  lines.push('')

  lines.push('TRUE POSITIVES')
  lines.push(
    csvRow([
      'Repository',
      'PR Number',
      'Tool',
      'Severity',
      'Confidence',
      'Golden Comment',
      'Matched Candidate',
      'Reasoning',
    ]),
  )
  for (const pr of stats.perPR) {
    for (const [tool, eval_] of Object.entries(pr.tools)) {
      for (const tp of eval_.true_positives) {
        lines.push(
          csvRow([
            pr.repo,
            pr.prNumber,
            tool,
            tp.severity,
            tp.confidence,
            tp.golden_comment,
            tp.matched_candidate,
            tp.reasoning,
          ]),
        )
      }
    }
  }
  lines.push('')

  lines.push('FALSE POSITIVES')
  lines.push(csvRow(['Repository', 'PR Number', 'Tool', 'Candidate']))
  for (const pr of stats.perPR) {
    for (const [tool, eval_] of Object.entries(pr.tools)) {
      for (const fp of eval_.false_positives) {
        lines.push(csvRow([pr.repo, pr.prNumber, tool, fp.candidate]))
      }
    }
  }
  lines.push('')

  lines.push('FALSE NEGATIVES')
  lines.push(csvRow(['Repository', 'PR Number', 'Tool', 'Severity', 'Golden Comment']))
  for (const pr of stats.perPR) {
    for (const [tool, eval_] of Object.entries(pr.tools)) {
      for (const fn of eval_.false_negatives) {
        lines.push(
          csvRow([pr.repo, pr.prNumber, tool, fn.severity, fn.golden_comment]),
        )
      }
    }
  }

  return lines.join('\n')
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function downloadJsonReport(
  stats: OverallStats,
  rawData: EvaluationsFile,
  sourceFile: string,
): void {
  const report = buildReport(stats, rawData, sourceFile)
  const baseName = sourceFile.replace(/\.json$/i, '') || 'benchmark-report'
  downloadFile(
    JSON.stringify(report, null, 2),
    `${baseName}-report.json`,
    'application/json',
  )
}

export function downloadCsvReport(stats: OverallStats, sourceFile: string): void {
  const baseName = sourceFile.replace(/\.json$/i, '') || 'benchmark-report'
  downloadFile(
    buildReportCsv(stats, sourceFile),
    `${baseName}-report.csv`,
    'text/csv;charset=utf-8',
  )
}
