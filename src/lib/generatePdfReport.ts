import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPercent } from './parseEvaluations'
import { getFindingsByTool } from './toolFindings'
import type { OverallStats } from '../types/evaluation'

const MARGIN = 14

const TOOL_HEAD_COLORS: Record<string, [number, number, number]> = {
  qodo: [124, 58, 237],
  lyxor: [8, 145, 178],
}

const COL = {
  repo: { cellWidth: 40, overflow: 'linebreak' as const, valign: 'top' as const },
  pr: { cellWidth: 18, halign: 'center' as const, overflow: 'ellipsize' as const },
  severity: { cellWidth: 22, halign: 'center' as const, overflow: 'ellipsize' as const },
  conf: { cellWidth: 16, halign: 'center' as const, overflow: 'ellipsize' as const },
  tool: { cellWidth: 16, halign: 'center' as const, overflow: 'ellipsize' as const },
  count: { cellWidth: 10, halign: 'center' as const, overflow: 'ellipsize' as const },
  pct: { cellWidth: 16, halign: 'center' as const, overflow: 'ellipsize' as const },
}

function formatPR(prNumber: string): string {
  return `PR ${prNumber}`
}

function calcF1(precision: number, recall: number): number {
  return precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : 0
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(title, 14, y)
  return y + 6
}

function textColWidth(pageWidth: number, fixedTotal: number, columns = 1): number {
  const available = pageWidth - MARGIN * 2 - fixedTotal
  return Math.max(available / columns, 30)
}

type AutoTableDoc = jsPDF & { lastAutoTable: { finalY: number } }

export function downloadPdfReport(stats: OverallStats, sourceFile: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text('Code Review Benchmark Report', 14, y)
  y += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y)
  y += 5
  doc.text(`Source: ${sourceFile}`, 14, y)
  y += 5
  doc.text(`Total Pull Requests: ${stats.totalPRs}`, 14, y)
  y += 10

  y = addSectionTitle(doc, 'Tool Summary', y)

  autoTable(doc, {
    startY: y,
    head: [[
      'Tool', 'PRs', 'TP', 'FP', 'FN',
      'Macro P', 'Macro R', 'F1', 'Avg P', 'Avg R',
    ]],
    body: stats.tools.map((t) => [
      t.tool,
      t.evaluationCount,
      t.totalTp,
      t.totalFp,
      t.totalFn,
      formatPercent(t.macroPrecision),
      formatPercent(t.macroRecall),
      formatPercent(t.f1),
      formatPercent(t.avgPrecision),
      formatPercent(t.avgRecall),
    ]),
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'ellipsize' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 18, halign: 'left' },
      1: COL.count,
      2: COL.count,
      3: COL.count,
      4: COL.count,
      5: COL.pct,
      6: COL.pct,
      7: COL.pct,
      8: COL.pct,
      9: COL.pct,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: MARGIN, right: MARGIN },
  })

  y = (doc as AutoTableDoc).lastAutoTable.finalY + 12
  y = addSectionTitle(doc, 'Per Pull Request Metrics', y)

  autoTable(doc, {
    startY: y,
    head: [[
      'Repository', 'PR', 'Tool', 'TP', 'FP', 'FN',
      'Precision', 'Recall', 'F1',
    ]],
    body: stats.perPR.flatMap((pr) =>
      Object.entries(pr.tools).map(([tool, eval_]) => [
        pr.repo,
        formatPR(pr.prNumber),
        tool,
        eval_.tp,
        eval_.fp,
        eval_.fn,
        formatPercent(eval_.precision),
        formatPercent(eval_.recall),
        formatPercent(calcF1(eval_.precision, eval_.recall)),
      ]),
    ),
    styles: { fontSize: 7, cellPadding: 2.5, overflow: 'ellipsize', valign: 'middle' },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, halign: 'center' },
    columnStyles: {
      0: COL.repo,
      1: COL.pr,
      2: COL.tool,
      3: COL.count,
      4: COL.count,
      5: COL.count,
      6: COL.pct,
      7: COL.pct,
      8: COL.pct,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: MARGIN, right: MARGIN },
  })

  const findingsByTool = getFindingsByTool(stats)
  const tpTextWidth = textColWidth(pageWidth, COL.repo.cellWidth + COL.pr.cellWidth + COL.severity.cellWidth + COL.conf.cellWidth, 2)
  const fpTextWidth = textColWidth(pageWidth, COL.repo.cellWidth + COL.pr.cellWidth, 1)
  const fnTextWidth = textColWidth(pageWidth, COL.repo.cellWidth + COL.pr.cellWidth + COL.severity.cellWidth, 1)

  for (const findings of findingsByTool) {
    const toolColor = TOOL_HEAD_COLORS[findings.tool] ?? [37, 99, 235]
    const toolLabel = findings.tool.charAt(0).toUpperCase() + findings.tool.slice(1)

    doc.addPage()
    y = 20
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...toolColor)
    doc.text(`${toolLabel} — Findings`, 14, y)
    y += 12

    y = addSectionTitle(doc, `True Positives (${findings.truePositives.length})`, y)

    if (findings.truePositives.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Repository', 'PR', 'Severity', 'Conf.', 'Golden Comment', 'Matched Candidate']],
        body: findings.truePositives.map((tp) => [
          tp.repo,
          formatPR(tp.prNumber),
          tp.severity,
          `${(tp.confidence * 100).toFixed(0)}%`,
          tp.golden_comment,
          tp.matched_candidate,
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, valign: 'top' },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, halign: 'center' },
        columnStyles: {
          0: COL.repo,
          1: COL.pr,
          2: COL.severity,
          3: COL.conf,
          4: { cellWidth: tpTextWidth, overflow: 'linebreak' },
          5: { cellWidth: tpTextWidth, overflow: 'linebreak' },
        },
        margin: { left: MARGIN, right: MARGIN },
      })
      y = (doc as AutoTableDoc).lastAutoTable.finalY + 10
    } else {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('None', 14, y)
      y += 10
    }

    y = addSectionTitle(doc, `False Positives (${findings.falsePositives.length})`, y)

    if (findings.falsePositives.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Repository', 'PR', 'Candidate']],
        body: findings.falsePositives.map((fp) => [
          fp.repo,
          formatPR(fp.prNumber),
          fp.candidate,
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, valign: 'top' },
        headStyles: { fillColor: [217, 119, 6], textColor: 255, halign: 'center' },
        columnStyles: {
          0: COL.repo,
          1: COL.pr,
          2: { cellWidth: fpTextWidth, overflow: 'linebreak' },
        },
        margin: { left: MARGIN, right: MARGIN },
      })
      y = (doc as AutoTableDoc).lastAutoTable.finalY + 10
    } else {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('None', 14, y)
      y += 10
    }

    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage()
      y = 20
    }

    y = addSectionTitle(doc, `False Negatives (${findings.falseNegatives.length})`, y)

    if (findings.falseNegatives.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Repository', 'PR', 'Severity', 'Golden Comment']],
        body: findings.falseNegatives.map((fn) => [
          fn.repo,
          formatPR(fn.prNumber),
          fn.severity,
          fn.golden_comment,
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, valign: 'top' },
        headStyles: { fillColor: [220, 38, 38], textColor: 255, halign: 'center' },
        columnStyles: {
          0: COL.repo,
          1: COL.pr,
          2: COL.severity,
          3: { cellWidth: fnTextWidth, overflow: 'linebreak' },
        },
        margin: { left: MARGIN, right: MARGIN },
      })
    } else {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text('None', 14, y)
    }
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    )
  }

  const baseName = sourceFile.replace(/\.json$/i, '') || 'benchmark-report'
  doc.save(`${baseName}-report.pdf`)
}
