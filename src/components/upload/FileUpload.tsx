import { useRef, useState } from 'react'
import { validateEvaluationsFile } from '../../lib/parseEvaluations'
import type { EvaluationsFile } from '../../types/evaluation'
import './FileUpload.css'

interface FileUploadProps {
  onLoad: (data: EvaluationsFile, fileName: string) => void
}

export function FileUpload({ onLoad }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a .json file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown

      if (!validateEvaluationsFile(data)) {
        setError('Invalid evaluation JSON format. Expected PR URLs with tool results.')
        return
      }

      onLoad(data, file.name)
    } catch {
      setError('Failed to parse JSON file. Check the file format.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div className="upload-screen">
      <div className="upload-hero">
        <div className="upload-icon">📊</div>
        <h1>Code Review Benchmark Dashboard</h1>
        <p>
          Upload your evaluation results JSON to compare code review tools across pull
          requests — precision, recall, and per-PR breakdowns.
        </p>
      </div>

      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
          }}
        />
        {loading ? (
          <span className="upload-label">Parsing file…</span>
        ) : (
          <>
            <span className="upload-label">Drop your evaluations.json here</span>
            <span className="upload-hint">or click to browse</span>
          </>
        )}
      </div>

      {error && <p className="upload-error">{error}</p>}

      <div className="upload-features">
        <div className="feature">
          <strong>Overall metrics</strong>
          <span>Precision, recall, F1 across all PRs</span>
        </div>
        <div className="feature">
          <strong>Tool comparison</strong>
          <span>Side-by-side qodo vs lyxor</span>
        </div>
        <div className="feature">
          <strong>Per-PR drill-down</strong>
          <span>TP, FP, FN with full comments</span>
        </div>
      </div>
    </div>
  )
}
