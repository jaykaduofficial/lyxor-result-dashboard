import { formatPercent } from '../../lib/parseEvaluations'
import type { PREvaluation } from '../../types/evaluation'
import './PRList.css'

const TOOL_COLORS: Record<string, string> = {
  qodo: '#8b5cf6',
  lyxor: '#06b6d4',
}

interface PRListProps {
  perPR: PREvaluation[]
  selectedPrUrl: string | null
  onSelect: (prUrl: string) => void
  filterRepo: string
  onFilterRepo: (repo: string) => void
}

export function PRList({
  perPR,
  selectedPrUrl,
  onSelect,
  filterRepo,
  onFilterRepo,
}: PRListProps) {
  const repos = [...new Set(perPR.map((p) => p.repo))].sort()
  const filtered = filterRepo
    ? perPR.filter((p) => p.repo === filterRepo)
    : perPR

  return (
    <div className="pr-list">
      <div className="pr-list-header">
        <h2>Pull Requests ({filtered.length})</h2>
        <select
          className="repo-filter"
          value={filterRepo}
          onChange={(e) => onFilterRepo(e.target.value)}
        >
          <option value="">All repos</option>
          {repos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="pr-cards">
        {filtered.map((pr) => {
          const tools = Object.entries(pr.tools)
          const isSelected = pr.prUrl === selectedPrUrl

          return (
            <button
              key={pr.prUrl}
              className={`pr-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(pr.prUrl)}
            >
              <div className="pr-card-top">
                <span className="pr-repo">{pr.repo}</span>
                <span className="pr-number">#{pr.prNumber}</span>
              </div>
              <div className="pr-metrics">
                {tools.map(([tool, eval_]) => (
                  <div key={tool} className="pr-tool-metric">
                    <span
                      className="tool-pill"
                      style={{ background: `${TOOL_COLORS[tool] ?? '#3b82f6'}22`, color: TOOL_COLORS[tool] }}
                    >
                      {tool}
                    </span>
                    <span className="metric-values">
                      P {formatPercent(eval_.precision, 0)} · R {formatPercent(eval_.recall, 0)}
                    </span>
                    <span className="metric-counts">
                      <span className="tp">{eval_.tp} TP</span>
                      <span className="fp">{eval_.fp} FP</span>
                      <span className="fn">{eval_.fn} FN</span>
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
