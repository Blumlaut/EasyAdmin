import { useState } from 'react'
import type { CleanupRadius, CleanupType } from '../types'

interface CleanupModalProps {
  availableTypes: CleanupType[]
  onConfirm: (type: CleanupType, radius: CleanupRadius, deep: boolean) => void
  onCancel: () => void
}

const RADII: CleanupRadius[] = [10, 20, 50, 100, 'global']

/**
 * Modal for area cleanup. Lets the admin pick:
 *  - type (cars / peds / props)
 *  - radius (10, 20, 50, 100, global)
 *  - deep clean (toggle)
 *
 * Matches NativeUI cleanup menu behavior (deep clean enabled by default).
 */
export function CleanupModal({ availableTypes, onConfirm, onCancel }: CleanupModalProps) {
  const [type, setType] = useState<CleanupType>(availableTypes[0] ?? 'cars')
  const [radius, setRadius] = useState<CleanupRadius>(20)
  const [deep, setDeep] = useState(true)

  return (
    <div
      className="dialog-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cleanup-title"
      >
        <h2 id="cleanup-title" className="dialog-title">
          Clean Area
        </h2>
        <p className="dialog-description">
          Choose what to clean and how far from your position.
        </p>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Type</span>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as CleanupType)}
            >
              {availableTypes.includes('cars') && <option value="cars">Cars</option>}
              {availableTypes.includes('peds') && <option value="peds">Peds</option>}
              {availableTypes.includes('props') && <option value="props">Props</option>}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-secondary">Radius</span>
            <select
              className="input"
              value={String(radius)}
              onChange={(e) => {
                const v = e.target.value
                setRadius(v === 'global' ? 'global' : (Number(v) as CleanupRadius))
              }}
            >
              {RADII.map((r) => (
                <option key={String(r)} value={String(r)}>
                  {r === 'global' ? 'Global' : `${r}m`}
                </option>
              ))}
            </select>
          </label>

          <div className="toggle-row">
            <span className="text-sm text-secondary">Deep clean</span>
            <label className="toggle">
              <input
                type="checkbox"
                checked={deep}
                onChange={(e) => setDeep(e.target.checked)}
                aria-label="Deep clean"
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-warning"
            onClick={() => onConfirm(type, radius, deep)}
          >
            Clean
          </button>
        </div>
      </div>
    </div>
  )
}
