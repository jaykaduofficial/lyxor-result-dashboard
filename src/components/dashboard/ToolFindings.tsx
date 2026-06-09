import type { ToolFindings as ToolFindingsData } from '../../lib/toolFindings'
import { getFindingsByTool } from '../../lib/toolFindings'
import type { OverallStats } from '../../types/evaluation'
import { SeverityBadge } from '../ui/SeverityBadge'
import './ToolFindings.css'

const TOOL_COLORS: Record<string, string> = {
  qodo: '#7c3aed',
  lyxor: '#0891b2',
}

interface ToolFindingsProps {
  stats: OverallStats
}

function ToolPanel({ findings }: { findings: ToolFindingsData }) {
  const color = TOOL_COLORS[findings.tool] ?? 'var(--accent)'

  return (
    <div className="tool-findings-panel" style={{ borderTopColor: color }}>
      <h3 className="tool-findings-title" style={{ color }}>
        {findings.tool}
      </h3>

      <div className="findings-category">
        <h4 className="category-title tp-title">
          True Positives ({findings.truePositives.length})
        </h4>
        {findings.truePositives.length === 0 ? (
          <p className="findings-empty">None</p>
        ) : (
          findings.truePositives.map((tp, i) => (
            <div key={i} className="finding-item tp-item">
              <div className="finding-item-header">
                <span className="finding-pr">{tp.repo} #{tp.prNumber}</span>
                <SeverityBadge severity={tp.severity} />
                <span className="finding-confidence">
                  {(tp.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <p className="finding-text"><strong>Golden:</strong> {tp.golden_comment}</p>
              <p className="finding-text"><strong>Matched:</strong> {tp.matched_candidate}</p>
            </div>
          ))
        )}
      </div>

      <div className="findings-category">
        <h4 className="category-title fp-title">
          False Positives ({findings.falsePositives.length})
        </h4>
        {findings.falsePositives.length === 0 ? (
          <p className="findings-empty">None</p>
        ) : (
          findings.falsePositives.map((fp, i) => (
            <div key={i} className="finding-item fp-item">
              <span className="finding-pr">{fp.repo} #{fp.prNumber}</span>
              <p className="finding-text">{fp.candidate}</p>
            </div>
          ))
        )}
      </div>

      <div className="findings-category">
        <h4 className="category-title fn-title">
          False Negatives ({findings.falseNegatives.length})
        </h4>
        {findings.falseNegatives.length === 0 ? (
          <p className="findings-empty">None</p>
        ) : (
          findings.falseNegatives.map((fn, i) => (
            <div key={i} className="finding-item fn-item">
              <div className="finding-item-header">
                <span className="finding-pr">{fn.repo} #{fn.prNumber}</span>
                <SeverityBadge severity={fn.severity} />
              </div>
              <p className="finding-text">{fn.golden_comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function ToolFindings({ stats }: ToolFindingsProps) {
  const byTool = getFindingsByTool(stats)

  return (
    <section className="overview-section tool-findings-section">
      <h2>Findings by Tool</h2>
      <div className="tool-findings-grid">
        {byTool.map((findings) => (
          <ToolPanel key={findings.tool} findings={findings} />
        ))}
      </div>
    </section>
  )
}
