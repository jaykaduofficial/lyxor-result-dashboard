import { useMemo, useState } from 'react'
import { FileUpload } from '../components/upload/FileUpload'
import { OverviewDashboard } from '../components/dashboard/OverviewDashboard'
import { PRDetail } from '../components/pr/PRDetail'
import { PRList } from '../components/pr/PRList'
import { parseEvaluations } from '../lib/parseEvaluations'
import type { EvaluationsFile } from '../types/evaluation'
import './App.css'

type Tab = 'overview' | 'per-pr'

function App() {
  const [data, setData] = useState<EvaluationsFile | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [selectedPrUrl, setSelectedPrUrl] = useState<string | null>(null)
  const [filterRepo, setFilterRepo] = useState('')

  const stats = useMemo(
    () => (data ? parseEvaluations(data) : null),
    [data],
  )

  const selectedPR = useMemo(
    () => stats?.perPR.find((p) => p.prUrl === selectedPrUrl) ?? null,
    [stats, selectedPrUrl],
  )

  const handleLoad = (loaded: EvaluationsFile, name: string) => {
    setData(loaded)
    setFileName(name)
    setTab('overview')
    setSelectedPrUrl(null)
    setFilterRepo('')
  }

  const handleReset = () => {
    setData(null)
    setFileName(null)
    setSelectedPrUrl(null)
    setFilterRepo('')
  }

  if (!data || !stats) {
    return <FileUpload onLoad={handleLoad} />
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Benchmark Dashboard</h1>
          <span className="file-badge">{fileName}</span>
        </div>
        <div className="header-right">
          <nav className="tab-nav">
            <button
              className={tab === 'overview' ? 'active' : ''}
              onClick={() => setTab('overview')}
            >
              Overview
            </button>
            <button
              className={tab === 'per-pr' ? 'active' : ''}
              onClick={() => setTab('per-pr')}
            >
              Per PR Analysis
            </button>
          </nav>
          <button className="reset-btn" onClick={handleReset}>
            Upload new file
          </button>
        </div>
      </header>

      <main className="app-main">
        {tab === 'overview' && <OverviewDashboard stats={stats} />}

        {tab === 'per-pr' && (
          <div className="per-pr-layout">
            <aside className="pr-sidebar">
              <PRList
                perPR={stats.perPR}
                selectedPrUrl={selectedPrUrl}
                onSelect={(url) => setSelectedPrUrl(url)}
                filterRepo={filterRepo}
                onFilterRepo={setFilterRepo}
              />
            </aside>
            <section className="pr-main">
              <PRDetail pr={selectedPR} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
