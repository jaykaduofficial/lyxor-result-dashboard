import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatPercent } from './parseEvaluations'
import type { OverallStats } from '../types/evaluation'

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

function ensureSpace(doc: jsPDF, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight()
  if (needed > pageHeight - 20) {
    doc.addPage()
    return 20
  }
  return needed
}

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
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  y = ensureSpace(doc, y + 40)
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
        `#${pr.prNumber}`,
        tool,
        eval_.tp,
        eval_.fp,
        eval_.fn,
        formatPercent(eval_.precision),
        formatPercent(eval_.recall),
        formatPercent(calcF1(eval_.precision, eval_.recall)),
      ]),
    ),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12

  const tpRows = stats.perPR.flatMap((pr) =>
    Object.entries(pr.tools).flatMap(([tool, eval_]) =>
      eval_.true_positives.map((tp) => [
        pr.repo,
        `#${pr.prNumber}`,
        tool,
        tp.severity,
        `${(tp.confidence * 100).toFixed(0)}%`,
        tp.golden_comment,
        tp.matched_candidate,
      ]),
    ),
  )

  if (tpRows.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `True Positives (${tpRows.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['Repo', 'PR', 'Tool', 'Severity', 'Conf.', 'Golden Comment', 'Matched Candidate']],
      body: tpRows,
      styles: { fontSize: 6, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      columnStyles: {
        5: { cellWidth: 45 },
        6: { cellWidth: 45 },
      },
      margin: { left: 14, right: 14 },
    })
  }

  const fpRows = stats.perPR.flatMap((pr) =>
    Object.entries(pr.tools).flatMap(([tool, eval_]) =>
      eval_.false_positives.map((fp) => [
        pr.repo,
        `#${pr.prNumber}`,
        tool,
        fp.candidate,
      ]),
    ),
  )

  if (fpRows.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `False Positives (${fpRows.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['Repo', 'PR', 'Tool', 'Candidate']],
      body: fpRows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      columnStyles: { 3: { cellWidth: pageWidth - 70 } },
      margin: { left: 14, right: 14 },
    })
  }

  const fnRows = stats.perPR.flatMap((pr) =>
    Object.entries(pr.tools).flatMap(([tool, eval_]) =>
      eval_.false_negatives.map((fn) => [
        pr.repo,
        `#${pr.prNumber}`,
        tool,
        fn.severity,
        fn.golden_comment,
      ]),
    ),
  )

  if (fnRows.length > 0) {
    doc.addPage()
    y = 20
    y = addSectionTitle(doc, `False Negatives (${fnRows.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['Repo', 'PR', 'Tool', 'Severity', 'Golden Comment']],
      body: fnRows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      columnStyles: { 4: { cellWidth: pageWidth - 80 } },
      margin: { left: 14, right: 14 },
    })
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
