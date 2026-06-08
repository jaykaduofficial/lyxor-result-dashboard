import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber, formatPercent } from '../../lib/parseEvaluations'
import type { OverallStats } from '../../types/evaluation'
import { StatCard } from '../ui/StatCard'
import './OverviewDashboard.css'

const TOOL_COLORS: Record<string, string> = {
  qodo: '#8b5cf6',
  lyxor: '#06b6d4',
}

interface OverviewDashboardProps {
  stats: OverallStats
}

export function OverviewDashboard({ stats }: OverviewDashboardProps) {
  const comparisonData = stats.tools.map((t) => ({
    tool: t.tool,
    precision: +(t.macroPrecision * 100).toFixed(1),
    recall: +(t.macroRecall * 100).toFixed(1),
    f1: +(t.f1 * 100).toFixed(1),
  }))

  const countsData = stats.tools.map((t) => ({
    tool: t.tool,
    TP: t.totalTp,
    FP: t.totalFp,
    FN: t.totalFn,
  }))

  return (
    <div className="overview">
      <section className="overview-section">
        <h2>Summary</h2>
        <div className="stat-grid">
          <StatCard label="Pull Requests" value={formatNumber(stats.totalPRs)} />
          <StatCard
            label="Tools Compared"
            value={formatNumber(stats.tools.length)}
          />
          {stats.tools.map((t) => (
            <StatCard
              key={t.tool}
              label={`${t.tool} — F1 Score`}
              value={formatPercent(t.f1)}
              sub={`P ${formatPercent(t.macroPrecision)} · R ${formatPercent(t.macroRecall)}`}
              accent={t.tool as 'qodo' | 'lyxor'}
            />
          ))}
        </div>
      </section>

      <section className="overview-section charts-row">
        <div className="chart-card">
          <h3>Precision / Recall / F1</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3647" />
              <XAxis dataKey="tool" stroke="#8b9cb3" tick={{ fill: '#8b9cb3', fontSize: 12 }} />
              <YAxis
                stroke="#8b9cb3"
                tick={{ fill: '#8b9cb3', fontSize: 12 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1c2633',
                  border: '1px solid #2a3647',
                  borderRadius: 8,
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend />
              <Bar dataKey="precision" name="Precision" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recall" name="Recall" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="f1" name="F1" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Detection Counts (TP / FP / FN)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={countsData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3647" />
              <XAxis dataKey="tool" stroke="#8b9cb3" tick={{ fill: '#8b9cb3', fontSize: 12 }} />
              <YAxis stroke="#8b9cb3" tick={{ fill: '#8b9cb3', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: '#1c2633',
                  border: '1px solid #2a3647',
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Bar dataKey="TP" name="True Positives" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="FP" name="False Positives" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="FN" name="False Negatives" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overview-section">
        <h2>Tool Breakdown</h2>
        <div className="tool-table-wrap">
          <table className="tool-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>PRs</th>
                <th>TP</th>
                <th>FP</th>
                <th>FN</th>
                <th>Candidates</th>
                <th>Golden</th>
                <th>Macro Precision</th>
                <th>Macro Recall</th>
                <th>F1</th>
                <th>Avg Precision</th>
                <th>Avg Recall</th>
              </tr>
            </thead>
            <tbody>
              {stats.tools.map((t) => (
                <tr key={t.tool}>
                  <td>
                    <span
                      className="tool-dot"
                      style={{ background: TOOL_COLORS[t.tool] ?? 'var(--accent)' }}
                    />
                    {t.tool}
                  </td>
                  <td>{t.evaluationCount}</td>
                  <td className="num-success">{t.totalTp}</td>
                  <td className="num-warning">{t.totalFp}</td>
                  <td className="num-danger">{t.totalFn}</td>
                  <td>{t.totalCandidates}</td>
                  <td>{t.totalGolden}</td>
                  <td>{formatPercent(t.macroPrecision)}</td>
                  <td>{formatPercent(t.macroRecall)}</td>
                  <td className="num-bold">{formatPercent(t.f1)}</td>
                  <td>{formatPercent(t.avgPrecision)}</td>
                  <td>{formatPercent(t.avgRecall)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
