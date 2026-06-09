import { useEffect, useRef, useState } from 'react'
import { downloadCsvReport } from '../../lib/generateReport'
import { downloadPdfReport } from '../../lib/generatePdfReport'
import type { OverallStats } from '../../types/evaluation'
import './DownloadMenu.css'

interface DownloadMenuProps {
  stats: OverallStats
  sourceFile: string
}

export function DownloadMenu({ stats, sourceFile }: DownloadMenuProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDownload = (format: 'csv' | 'pdf') => {
    setLoading(format)
    setTimeout(() => {
      try {
        if (format === 'csv') {
          downloadCsvReport(stats, sourceFile)
        } else {
          downloadPdfReport(stats, sourceFile)
        }
      } finally {
        setLoading(null)
        setOpen(false)
      }
    }, 50)
  }

  return (
    <div className="download-menu" ref={menuRef}>
      <button
        className="download-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        disabled={!!loading}
      >
        {loading ? 'Generating…' : 'Download Report'}
      </button>
      {open && (
        <div className="download-dropdown">
          <button onClick={() => handleDownload('csv')}>
            <strong>CSV Report</strong>
            <span>Excel-compatible spreadsheet with all sections</span>
          </button>
          <button onClick={() => handleDownload('pdf')}>
            <strong>PDF Report</strong>
            <span>Formatted document with tables and findings</span>
          </button>
        </div>
      )}
    </div>
  )
}
