import { formatPercent } from './parseEvaluations'
import type { OverallStats } from '../types/evaluation'

function escapeCsv(value: string | number | boolean): string {
  const str = String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/"/g, '""')
  return `"${str}"`
}

function csvRow(values: (string | number | boolean)[]): string {
  return values.map(escapeCsv).join(',')
}

function calcF1(precision: number, recall: number): number {
  return precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0
}

export function buildReportCsv(stats: OverallStats, sourceFile: string): string {
  const lines: string[] = []

  lines.push(csvRow(['Report Title', 'Code Review Benchmark Report']))
  lines.push(csvRow(['Generated At', new Date().toISOString()]))
  lines.push(csvRow(['Source File', sourceFile]))
  lines.push(csvRow(['Total Pull Requests', stats.totalPRs]))
  lines.push(csvRow([]))

  lines.push(csvRow(['Section', 'Tool Summary']))
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
  lines.push(csvRow([]))

  lines.push(csvRow(['Section', 'Per PR Metrics']))
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
          formatPercent(calcF1(eval_.precision, eval_.recall)),
          eval_.total_candidates,
          eval_.total_golden,
          eval_.errors_count,
        ]),
      )
    }
  }
  lines.push(csvRow([]))

  lines.push(csvRow(['Section', 'True Positives']))
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
  lines.push(csvRow([]))

  lines.push(csvRow(['Section', 'False Positives']))
  lines.push(csvRow(['Repository', 'PR Number', 'Tool', 'Candidate']))
  for (const pr of stats.perPR) {
    for (const [tool, eval_] of Object.entries(pr.tools)) {
      for (const fp of eval_.false_positives) {
        lines.push(csvRow([pr.repo, pr.prNumber, tool, fp.candidate]))
      }
    }
  }
  lines.push(csvRow([]))

  lines.push(csvRow(['Section', 'False Negatives']))
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

  return lines.join('\r\n')
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadCsvReport(stats: OverallStats, sourceFile: string): void {
  const baseName = sourceFile.replace(/\.json$/i, '') || 'benchmark-report'
  const csvContent = '\uFEFF' + buildReportCsv(stats, sourceFile)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${baseName}-report.csv`)
}
