import type { WireframeVariant } from './Wireframe'
import { Wireframe } from './Wireframe'

interface WireframeOptionProps {
  /** Radio group the option belongs to */
  name: string
  variant: WireframeVariant
  checked: boolean
  onSelect: () => void
  label: string
  description: string
}

/** One radio card of a wireframe picker: preview, label and description. */
export function WireframeOption({
  name,
  variant,
  checked,
  onSelect,
  label,
  description,
}: WireframeOptionProps) {
  return (
    <label className={`layout-grid-option selectable-card${checked ? ' selectable-card--checked' : ''}`}>
      <input
        className="radio-group-input"
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
      />
      <div className="layout-wireframe-wrap">
        <Wireframe variant={variant} checked={checked} />
      </div>
      <div className="layout-grid-content">
        <span className="layout-grid-label">{label}</span>
        <span className="layout-grid-description">{description}</span>
      </div>
    </label>
  )
}
