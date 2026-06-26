/**
 * SchemaRenderer — maps a declarative component schema to built-in
 * EasyAdmin NUI components.
 *
 * Plugins never ship React components. They return schema trees from
 * their Lua render handlers, and this renderer maps each node to one
 * of EasyAdmin's existing components (Card, StatCard, Alert, etc.).
 *
 * Interactive nodes (buttons) call back to Lua via `onAction`.
 */

import { type ReactNode, type CSSProperties, useEffect } from 'react'
import type { ButtonNode, ComponentSchema } from './schema'
import type { ModalFieldDefinition } from '../modals/types'
import { Icon, type IconName } from '../components/icons'
import { StatCard } from '../components/StatCard'
import { Alert } from '../components/Alert'
import { CopyButton } from '../components/CopyButton'
import { Tooltip } from '../components/Tooltip'
import { TimelineEntry } from '../components/TimelineEntry'
import { BarChart } from '../components/BarChart'
import { Skeleton } from '../components/Skeleton'
import { KeyValueTable, type KeyValueRow } from '../components/KeyValueTable'
import { useModalContext } from '../ModalContext'
import { notify } from '../lib/notify'

// ---------------------------------------------------------------------------
// Action handler type
// ---------------------------------------------------------------------------

export interface SchemaRendererProps {
  schema: ComponentSchema[]
  /** Called when a button node is clicked. */
  onAction: (action: string, data: unknown, server: boolean) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SIZE_MAP = { xs: 'btn-xs', sm: 'btn-sm', md: '' } as const
const VARIANT_MAP = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
} as const

const TEXT_VARIANT_CLASS: Record<string, string> = {
  default: '',
  muted: 'text-fg-muted',
  small: 'text-sm text-fg-muted',
  large: 'text-lg',
  mono: 'text-mono',
}

const GAP_CLASS: Record<number, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
}

// ---------------------------------------------------------------------------
// Modal button component
// ---------------------------------------------------------------------------

function ModalButton({ node, onAction }: { node: ButtonNode; onAction: SchemaRendererProps['onAction'] }) {
  const { openModal } = useModalContext()
  const modal = node.modal
  if (!modal) return null

  const sizeCls = SIZE_MAP[node.size ?? 'md']
  const variantCls = VARIANT_MAP[node.variant ?? 'ghost']

  // Map schema field nodes to ModalFieldDefinition instances
  const modalFields: ModalFieldDefinition[] = modal.fields.map((f) => {
    const base = {
      key: f.key,
      type: f.type,
      label: f.label,
      description: f.description,
      required: f.required,
    }
    switch (f.type) {
      case 'text':
        return { ...base, type: 'text' as const, placeholder: f.placeholder, initialValue: f.initialValue, maxLength: f.maxLength }
      case 'textarea':
        return { ...base, type: 'textarea' as const, placeholder: f.placeholder, initialValue: f.initialValue, maxLength: f.maxLength, rows: f.rows }
      case 'number':
        return { ...base, type: 'number' as const, placeholder: f.placeholder, initialValue: f.initialValue, min: f.min, max: f.max, step: f.step }
      case 'slider':
        return { ...base, type: 'slider' as const, min: f.min, max: f.max, initialValue: f.initialValue, step: f.step }
      case 'select':
        return { ...base, type: 'select' as const, placeholder: f.placeholder, initialValue: f.initialValue, options: f.options }
      case 'checkbox':
        return { ...base, type: 'checkbox' as const, initialValue: f.initialValue }
    }
  })

  return (
    <button
      key={node.key}
      className={`btn ${variantCls} ${sizeCls}`.trim()}
      disabled={node.disabled}
      onClick={() => {
        openModal({
          title: modal.title,
          description: modal.description,
          submitLabel: modal.submitLabel,
          submitVariant: modal.submitVariant,
          fields: modalFields,
          onSubmit: (values) => {
            onAction(node.action, values, node.server ?? false)
          },
        })
      }}
    >
      {node.icon && <Icon name={node.icon as IconName} size={node.size === 'xs' ? 'xs' : 'sm'} />}
      {node.label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Notification component (triggers a native FiveM notification)
// ---------------------------------------------------------------------------

function NotificationNode({ text }: { text: string }) {
  useEffect(() => {
    notify(text)
  }, [text])
  return null
}

// ---------------------------------------------------------------------------
// Node renderer
// ---------------------------------------------------------------------------

function SchemaNode({
  node,
  onAction,
}: {
  node: ComponentSchema
  onAction: SchemaRendererProps['onAction']
}): ReactNode {
  switch (node.type) {
    // ── Layout ──────────────────────────────────────────────
    case 'card':
      return (
        <div className={`card${node.className ? ` ${node.className}` : ''}`} key={node.key}>
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </div>
      )

    case 'row':
      return (
        <div
          key={node.key}
          className={`flex${node.gap ? ` ${GAP_CLASS[node.gap]}` : ''}${node.wrap ? ' flex-wrap' : ''}${node.className ? ` ${node.className}` : ''}`}
        >
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </div>
      )

    case 'col':
      return (
        <div
          key={node.key}
          className={`flex flex-col${node.gap ? ` ${GAP_CLASS[node.gap]}` : ''}${node.className ? ` ${node.className}` : ''}`}
        >
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </div>
      )

    case 'divider':
      return <hr key={node.key} className="border-border" />

    // ── Text ────────────────────────────────────────────────
    case 'heading': {
      const level = node.level ?? 3
      const cls = level === 1 ? 'text-2xl font-bold' : level === 2 ? 'text-xl font-bold' : 'text-lg font-semibold'
      return (
        <h3 key={node.key} className={cls}>
          {node.text}
        </h3>
      )
    }

    case 'text':
      return (
        <span key={node.key} className={TEXT_VARIANT_CLASS[node.variant ?? 'default']}>
          {node.text}
        </span>
      )

    // ── Interactive ─────────────────────────────────────────
    case 'button': {
      if (node.modal) {
        return <ModalButton key={node.key} node={node} onAction={onAction} />
      }
      const sizeCls = SIZE_MAP[node.size ?? 'md']
      const variantCls = VARIANT_MAP[node.variant ?? 'ghost']
      return (
        <button
          key={node.key}
          className={`btn ${variantCls} ${sizeCls}`.trim()}
          disabled={node.disabled}
          onClick={() => onAction(node.action, node.data, node.server ?? false)}
        >
          {node.icon && <Icon name={node.icon as IconName} size={node.size === 'xs' ? 'xs' : 'sm'} />}
          {node.label}
        </button>
      )
    }

    case 'copy-button':
      return <CopyButton key={node.key} value={node.value} label={node.label} />

    case 'notification':
      return <NotificationNode key={node.key} text={node.text} />

    // ── Data display ────────────────────────────────────────
    case 'stat-card':
      return (
        <StatCard
          key={node.key}
          label={node.label}
          value={node.value}
          subValue={node.subValue}
          icon={node.icon as IconName}
          iconColor={node.iconColor}
          bgColor={node.bgColor}
        />
      )

    case 'key-value-table': {
      const rows: KeyValueRow[] = node.rows.map((r) => {
        const action = r.action
        return {
          key: r.key,
          value: r.value,
          mono: r.mono,
          actionLabel: r.actionLabel,
          onClick: action ? () => onAction(action, undefined, false) : undefined,
        }
      })
      return <KeyValueTable key={node.key} rows={rows} />
    }

    case 'alert':
      return (
        <Alert key={node.key} variant={node.variant} title={node.title}>
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </Alert>
      )

    case 'badge': {
      const variantCls = node.variant ? `badge-${node.variant}` : 'badge-default'
      return (
        <span key={node.key} className={`badge ${variantCls}`}>
          {node.icon && <Icon name={node.icon as IconName} size="xs" />}
          {node.text}
        </span>
      )
    }

    case 'icon':
      return <Icon key={node.key} name={node.name as IconName} size={node.size ?? 'md'} />

    case 'tooltip':
      return (
        <Tooltip key={node.key} content={node.content}>
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </Tooltip>
      )

    case 'timeline-entry':
      return (
        <TimelineEntry key={node.key} title={node.title} time={node.time} footer={node.footer}>
          {node.children && <SchemaRenderer schema={node.children} onAction={onAction} />}
        </TimelineEntry>
      )

    // ── Charts ──────────────────────────────────────────────
    case 'bar-chart':
      return <BarChart key={node.key} items={node.items} />

    // ── Loading ─────────────────────────────────────────────
    case 'skeleton':
      return (
        <Skeleton
          key={node.key}
          height={node.height}
          width={node.width}
        />
      )

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

export function SchemaRenderer({ schema, onAction }: SchemaRendererProps): ReactNode {
  return (
    <>
      {schema.map((node, i) => (
        <SchemaNode key={node.key ?? i} node={node} onAction={onAction} />
      ))}
    </>
  )
}

// Re-export for convenience
export type { ComponentSchema }
// Avoid unused import warning — CSSProperties used in type annotations above
export type { CSSProperties }
