import { useState } from 'react'
import type { CleanupRadius, CleanupType } from '../types'
import { DialogWrapper } from './DialogWrapper'
import { useTranslation } from '../lib/i18n'

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
  const { t } = useTranslation()
  const [type, setType] = useState<CleanupType>(availableTypes[0] ?? 'cars')
  const [radius, setRadius] = useState<CleanupRadius>(20)
  const [deep, setDeep] = useState(true)

  return (
    <DialogWrapper
      title={t("Clean Area")}
      description={t("Choose what to clean and how far from your position.")}
      onCancel={onCancel}
      actions={
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {t("Cancel")}
          </button>
          <button
            className="btn btn-warning"
            onClick={() => onConfirm(type, radius, deep)}
          >
            {t("Clean")}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-subtle">{t("Type")}</span>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as CleanupType)}
          >
            {availableTypes.includes('cars') && <option value="cars">{t("Cars")}</option>}
            {availableTypes.includes('peds') && <option value="peds">{t("Peds")}</option>}
            {availableTypes.includes('props') && <option value="props">{t("Props")}</option>}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-fg-subtle">{t("Radius")}</span>
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
                {r === 'global' ? t("Global") : `${r}m`}
              </option>
            ))}
          </select>
        </label>

        <div className="toggle-row">
          <span className="text-sm text-fg-subtle">{t("Deep clean")}</span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={deep}
              onChange={(e) => setDeep(e.target.checked)}
              aria-label={t("Deep clean")}
            />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>
    </DialogWrapper>
  )
}
