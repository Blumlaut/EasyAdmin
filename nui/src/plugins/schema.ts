/**
 * Component schema types for the runtime plugin system.
 *
 * Plugins (external FiveM resources) register via Lua exports and provide
 * "render actions" that return a tree of {@link ComponentSchema} nodes.
 * The NUI's {@link SchemaRenderer} maps each node to a built-in EasyAdmin
 * component. Plugins cannot ship their own React components — they can
 * only compose from the palette defined here.
 *
 * @see docs/nui-plugins.md
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

/** Common fields available on most schema nodes. */
interface BaseNode {
  /** Optional key for React reconciliation. */
  key?: string
}

/** A node that can contain children. */
interface ContainerNode extends BaseNode {
  children?: ComponentSchema[]
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export interface CardNode extends ContainerNode {
  type: 'card'
  /** Extra CSS class(es) — must be from the EasyAdmin design system. */
  className?: string
}

export interface RowNode extends ContainerNode {
  type: 'row'
  /** Gap utility: 0, 1, 2, 3, 4 → gap-0 … gap-4 */
  gap?: 0 | 1 | 2 | 3 | 4
  /** Wrap children to new line when they overflow. */
  wrap?: boolean
  className?: string
}

export interface ColNode extends ContainerNode {
  type: 'col'
  gap?: 0 | 1 | 2 | 3 | 4
  className?: string
}

export interface DividerNode extends BaseNode {
  type: 'divider'
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export interface HeadingNode extends BaseNode {
  type: 'heading'
  text: string
  level?: 1 | 2 | 3 | 4
}

export interface TextNode extends BaseNode {
  type: 'text'
  text: string
  variant?: 'default' | 'muted' | 'small' | 'large' | 'mono'
}

// ---------------------------------------------------------------------------
// Interactive
// ---------------------------------------------------------------------------

export interface ButtonNode extends BaseNode {
  type: 'button'
  label: string
  /** Action name — will be passed to the plugin's Lua handler via pluginCall. */
  action: string
  /** Optional data payload sent with the action call. */
  data?: unknown
  /** Route the action to a server-side handler. */
  server?: boolean
  icon?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md'
  disabled?: boolean
}

export interface CopyButtonNode extends BaseNode {
  type: 'copy-button'
  value: string
  label?: string
}

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export interface StatCardNode extends BaseNode {
  type: 'stat-card'
  label: string
  value: string | number
  subValue?: string
  icon: string
  /** CSS custom property or design-token color for the icon. */
  iconColor: string
  /** CSS custom property or design-token color for the background. */
  bgColor: string
}

export interface KeyValueRowNode {
  key: string
  value: string
  mono?: boolean
  /** If set, the row is clickable and triggers this action. */
  action?: string
  actionLabel?: string
}

export interface KeyValueTableNode extends BaseNode {
  type: 'key-value-table'
  rows: KeyValueRowNode[]
}

export interface AlertNode extends BaseNode {
  type: 'alert'
  variant?: 'info' | 'warning' | 'success' | 'error'
  title?: string
  children?: ComponentSchema[]
}

export interface BadgeNode extends BaseNode {
  type: 'badge'
  text: string
  variant?: 'default' | 'online' | 'offline' | 'admin' | 'warning'
  icon?: string
}

export interface IconNode extends BaseNode {
  type: 'icon'
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

export interface TooltipNode extends BaseNode {
  type: 'tooltip'
  content: string
  children: ComponentSchema[]
}

export interface TimelineEntryNode extends BaseNode {
  type: 'timeline-entry'
  title?: string
  time?: string
  footer?: string
  children?: ComponentSchema[]
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

export interface BarChartItemNode {
  label: string
  value: number
  color?: string
}

export interface BarChartNode extends BaseNode {
  type: 'bar-chart'
  items: BarChartItemNode[]
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export interface SkeletonNode extends BaseNode {
  type: 'skeleton'
  height?: number
  width?: string | number
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type ComponentSchema =
  | CardNode
  | RowNode
  | ColNode
  | DividerNode
  | HeadingNode
  | TextNode
  | ButtonNode
  | CopyButtonNode
  | StatCardNode
  | KeyValueTableNode
  | AlertNode
  | BadgeNode
  | IconNode
  | TooltipNode
  | TimelineEntryNode
  | BarChartNode
  | SkeletonNode
