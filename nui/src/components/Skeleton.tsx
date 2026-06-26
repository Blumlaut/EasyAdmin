import type { HTMLAttributes } from 'react'

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number
  height?: string | number
  circle?: boolean
}

/**
 * Pulsing grey block placeholder used while async data is loading.
 * Uses the design-token driven `.skeleton` class.
 */
export function Skeleton({ width, height, circle, className, style, ...rest }: SkeletonProps) {
  const computed: Record<string, string | number> = { ...style }
  if (width !== undefined) {
    computed.width = typeof width === 'number' ? `${width}px` : width
  }
  if (height !== undefined) {
    computed.height = typeof height === 'number' ? `${height}px` : height
  }
  return (
    <div
      style={computed}
      className={`skeleton${circle ? ' skeleton-circle' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    />
  )
}
