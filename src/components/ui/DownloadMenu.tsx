import { useEffect, useRef, useState } from 'react'
import { downloadCsvReport, downloadJsonReport } from '../../lib/generateReport'
import type { EvaluationsFile, OverallStats } from '../../types/evaluation'
import './DownloadMenu.css'

interface DownloadMenuProps {
  stats: OverallStats
  rawData: EvaluationsFile
  sourceFile: string
}

export function DownloadMenu({ stats, rawData, sourceFile }: DownloadMenuProps) {
  const [open, setOpen] = useState(false)
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

  return (
    <div className="download-menu" ref={menuRef}>
      <button
        className="download-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Download Report
      </button>
      {open && (
        <div className="download-dropdown">
          <button
            onClick={() => {
              downloadJsonReport(stats, rawData, sourceFile)
              setOpen(false)
            }}
          >
            <strong>JSON Report</strong>
            <span>Full data with summary and per-PR details</span>
          </button>
          <button
            onClick={() => {
              downloadCsvReport(stats, sourceFile)
              setOpen(false)
            }}
          >
            <strong>CSV Report</strong>
            <span>Spreadsheet-friendly summary and findings</span>
          </button>
        </div>
      )}
    </div>
  )
}
