import { formatPercent } from '../../lib/parseEvaluations'
import type { PREvaluation, ToolEvaluation } from '../../types/evaluation'
import { SeverityBadge } from '../ui/SeverityBadge'
import { StatCard } from '../ui/StatCard'
import './PRDetail.css'

const TOOL_COLORS: Record<string, string> = {
  qodo: '#8b5cf6',
  lyxor: '#06b6d4',
}

interface PRDetailProps {
  pr: PREvaluation | null
}

function ToolSection({ tool, eval_ }: { tool: string; eval_: ToolEvaluation }) {
  const f1 =
    eval_.precision + eval_.recall > 0
      ? (2 * eval_.precision * eval_.recall) / (eval_.precision + eval_.recall)
      : 0

  return (
    <div className="tool-section">
      <div
        className="tool-section-header"
        style={{ borderColor: TOOL_COLORS[tool] ?? 'var(--accent)' }}
      >
        <h3 style={{ color: TOOL_COLORS[tool] }}>{tool}</h3>
        {eval_.skipped && <span className="skipped-badge">Skipped</span>}
        <a href={eval_.pr_url} target="_blank" rel="noopener noreferrer" className="pr-link">
          View annotated PR →
        </a>
      </div>

      <div className="tool-stats">
        <StatCard label="Precision" value={formatPercent(eval_.precision)} accent={tool as 'qodo' | 'lyxor'} />
        <StatCard label="Recall" value={formatPercent(eval_.recall)} accent={tool as 'qodo' | 'lyxor'} />
        <StatCard label="F1" value={formatPercent(f1)} />
        <StatCard label="TP / FP / FN" value={`${eval_.tp} / ${eval_.fp} / ${eval_.fn}`} />
        <StatCard label="Candidates" value={String(eval_.total_candidates)} sub={`${eval_.total_golden} golden`} />
      </div>

      {eval_.true_positives.length > 0 && (
        <div className="finding-group">
          <h4 className="finding-title tp-title">
            True Positives ({eval_.true_positives.length})
          </h4>
          {eval_.true_positives.map((tp, i) => (
            <div key={i} className="finding-card tp-card">
              <div className="finding-meta">
                <SeverityBadge severity={tp.severity} />
                <span className="confidence">Confidence: {(tp.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="finding-block">
                <span className="finding-label">Golden comment</span>
                <p>{tp.golden_comment}</p>
              </div>
              <div className="finding-block">
                <span className="finding-label">Matched candidate</span>
                <p>{tp.matched_candidate}</p>
              </div>
              <div className="finding-block reasoning">
                <span className="finding-label">Reasoning</span>
                <p>{tp.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {eval_.false_positives.length > 0 && (
        <div className="finding-group">
          <h4 className="finding-title fp-title">
            False Positives ({eval_.false_positives.length})
          </h4>
          {eval_.false_positives.map((fp, i) => (
            <div key={i} className="finding-card fp-card">
              <p>{fp.candidate}</p>
            </div>
          ))}
        </div>
      )}

      {eval_.false_negatives.length > 0 && (
        <div className="finding-group">
          <h4 className="finding-title fn-title">
            False Negatives ({eval_.false_negatives.length})
          </h4>
          {eval_.false_negatives.map((fn, i) => (
            <div key={i} className="finding-card fn-card">
              <div className="finding-meta">
                <SeverityBadge severity={fn.severity} />
              </div>
              <p>{fn.golden_comment}</p>
            </div>
          ))}
        </div>
      )}

      {eval_.errors.length > 0 && (
        <div className="finding-group">
          <h4 className="finding-title error-title">Errors ({eval_.errors.length})</h4>
          {eval_.errors.map((err, i) => (
            <div key={i} className="finding-card error-card">
              <p>{err}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PRDetail({ pr }: PRDetailProps) {
  if (!pr) {
    return (
      <div className="pr-detail empty">
        <p>Select a pull request to view detailed analysis</p>
      </div>
    )
  }

  const tools = Object.entries(pr.tools).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="pr-detail">
      <div className="pr-detail-header">
        <div>
          <h2>
            {pr.repo} <span className="pr-hash">#{pr.prNumber}</span>
          </h2>
          <a href={pr.prUrl} target="_blank" rel="noopener noreferrer" className="original-pr">
            {pr.prUrl}
          </a>
        </div>
      </div>

      <div className="tool-sections">
        {tools.map(([tool, eval_]) => (
          <ToolSection key={tool} tool={tool} eval_={eval_} />
        ))}
      </div>
    </div>
  )
}
