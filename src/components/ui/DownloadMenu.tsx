import { useState } from 'react'
import { downloadPdfReport } from '../../lib/generatePdfReport'
import type { OverallStats } from '../../types/evaluation'
import './DownloadMenu.css'

interface DownloadMenuProps {
  stats: OverallStats
  sourceFile: string
}

export function DownloadMenu({ stats, sourceFile }: DownloadMenuProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = () => {
    setLoading(true)
    setTimeout(() => {
      try {
        downloadPdfReport(stats, sourceFile)
      } finally {
        setLoading(false)
      }
    }, 50)
  }

  return (
    <button
      className="download-btn"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? 'Generating…' : 'Download PDF Report'}
    </button>
  )
}
